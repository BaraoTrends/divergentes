import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Google Indexing API edge function.
 * 
 * Requires a secret GOOGLE_SERVICE_ACCOUNT_JSON containing the full
 * service-account key JSON downloaded from Google Cloud Console.
 *
 * POST body: { urls: string[], type?: "URL_UPDATED" | "URL_DELETED" }
 */

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const unsignedToken = `${enc(header)}.${enc(payload)}`;

  // Import the RSA private key — aceitar "\n" literal (escapado) ou quebras reais
  const normalizedPem = String(serviceAccount.private_key || "")
    .replace(/\\n/g, "\n")
    .trim();
  if (!/-----BEGIN PRIVATE KEY-----/.test(normalizedPem)) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON.private_key inválida: faltam delimitadores BEGIN/END PRIVATE KEY. Recole o JSON da Service Account."
    );
  }
  const pemContents = normalizedPem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  let binaryKey: Uint8Array;
  try {
    binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  } catch {
    throw new Error("private_key não é base64 válido. Recole o JSON original da Service Account do Google Cloud.");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const { access_token } = await tokenRes.json();
  return access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authenticated user is admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: hasAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!hasAdmin) {
      return new Response(JSON.stringify({ error: "Apenas admins podem indexar" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get service account credentials — DB first, then env secret fallback
    let saJson: string | null = null;
    const { data: dbSecret } = await supabase
      .from("integration_secrets")
      .select("value")
      .eq("key", "GOOGLE_SERVICE_ACCOUNT_JSON")
      .maybeSingle();
    if (dbSecret?.value) {
      saJson = dbSecret.value;
    } else {
      saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") ?? null;
    }
    if (!saJson) {
      return new Response(
        JSON.stringify({
          error: "Chave do Google Service Account não configurada. Adicione o JSON no painel Admin → SEO → Chave Google Service Account.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccount = JSON.parse(saJson);
    const accessToken = await getAccessToken(serviceAccount);

    const { urls, type = "URL_UPDATED" } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "Envie um array de URLs" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Google Indexing API allows batch requests; we send one per URL
    const results: { url: string; status: string; error?: string }[] = [];

    for (const url of urls) {
      try {
        const res = await fetch(
          "https://indexing.googleapis.com/v3/urlNotifications:publish",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, type }),
          }
        );

        if (res.ok) {
          results.push({ url, status: "ok" });
        } else {
          const errBody = await res.text();
          results.push({ url, status: "error", error: `HTTP ${res.status}: ${errBody}` });
        }
      } catch (e) {
        results.push({ url, status: "error", error: String(e) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("google-indexing error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
