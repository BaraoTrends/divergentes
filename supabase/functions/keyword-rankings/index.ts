import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface GoogleToken {
  access_token: string;
}

function toBase64Url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function normalizePrivateKey(raw: string): Uint8Array {
  if (!raw) throw new Error("private_key vazia.");
  let pem = raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (/-----BEGIN RSA PRIVATE KEY-----/.test(pem)) {
    throw new Error(
      "private_key está em formato PKCS#1 (RSA PRIVATE KEY). O Google emite chaves PKCS#8 (BEGIN PRIVATE KEY). Recole o JSON original da Service Account."
    );
  }
  if (!/-----BEGIN PRIVATE KEY-----/.test(pem) || !/-----END PRIVATE KEY-----/.test(pem)) {
    throw new Error(
      "private_key inválida: faltam delimitadores BEGIN/END PRIVATE KEY. Recole o JSON original da Service Account."
    );
  }

  const begin = "-----BEGIN PRIVATE KEY-----";
  const end = "-----END PRIVATE KEY-----";
  const body = pem
    .slice(pem.indexOf(begin) + begin.length, pem.indexOf(end))
    .replace(/\s+/g, "");

  if (!/^[A-Za-z0-9+/=]+$/.test(body)) {
    throw new Error("private_key contém caracteres não-base64. Recole o JSON original.");
  }

  try {
    return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  } catch {
    throw new Error("private_key não é base64 válido. Recole o JSON original da Service Account.");
  }
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const encoder = new TextEncoder();
  const signingInput = `${header}.${payload}`;

  const binaryKey = normalizePrivateKey(String(serviceAccount.private_key || ""));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(signingInput)
  );

  const sig = toBase64Url(new Uint8Array(signature));

  const jwt = `${header}.${payload}.${sig}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData: GoogleToken = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function fetchSearchAnalytics(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  rowLimit: number
) {
  const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl
  )}/searchAnalytics/query`;

  const apiRes = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions,
      rowLimit,
      dataState: "final",
    }),
  });

  if (!apiRes.ok) {
    const errText = await apiRes.text();
    throw new Error(`Google API ${apiRes.status}: ${errText}`);
  }

  return apiRes.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // DB-first lookup (managed via Admin SEO panel), fallback to env secret
    const { data: dbSecret } = await supabase
      .from("integration_secrets")
      .select("value")
      .eq("key", "GOOGLE_SERVICE_ACCOUNT_JSON")
      .maybeSingle();

    const saJson = dbSecret?.value ?? Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_SERVICE_ACCOUNT_JSON não configurada. Adicione a chave no painel Admin → SEO." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(saJson);
    } catch {
      return new Response(
        JSON.stringify({ error: "GOOGLE_SERVICE_ACCOUNT_JSON não é um JSON válido. Recole o arquivo original da Service Account." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      return new Response(
        JSON.stringify({ error: "JSON da Service Account incompleto: faltam 'client_email' e/ou 'private_key'." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const {
      siteUrl = "https://neurorotina.com/",
      startDate,
      endDate,
      rowLimit = 500,
      mode = "daily", // "daily" (per-date rows) or "aggregate" (single snapshot)
    } = body;

    const end = endDate || new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10); // GSC data has ~2 day lag
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const accessToken = await getAccessToken(serviceAccount);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let totalInserted = 0;

    if (mode === "daily") {
      // Fetch with date dimension for historical tracking
      const data = await fetchSearchAnalytics(
        accessToken, siteUrl, start, end,
        ["date", "query", "page"], rowLimit
      );

      const rows = (data.rows || []).map((r: any) => ({
        date: r.keys[0],
        query: r.keys[1],
        page: r.keys[2] || null,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: parseFloat(r.ctr.toFixed(4)),
        position: parseFloat(r.position.toFixed(2)),
        country: null,
        device: null,
      }));

      if (rows.length > 0) {
        // Batch insert in chunks of 200
        for (let i = 0; i < rows.length; i += 200) {
          const chunk = rows.slice(i, i + 200);
          const { error } = await supabase
            .from("keyword_rankings")
            .upsert(chunk, { onConflict: "query,page,date,country,device", ignoreDuplicates: false });
          if (error) console.error("Upsert error:", error);
        }
        totalInserted = rows.length;
      }

      return new Response(
        JSON.stringify({ success: true, startDate: start, endDate: end, totalRows: totalInserted, mode: "daily" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aggregate mode (backward-compatible)
    const data = await fetchSearchAnalytics(
      accessToken, siteUrl, start, end,
      ["query", "page"], rowLimit
    );

    const rows = (data.rows || []).map((r: any) => ({
      query: r.keys[0],
      page: r.keys[1] || null,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: parseFloat(r.ctr.toFixed(4)),
      position: parseFloat(r.position.toFixed(2)),
    }));

    const today = new Date().toISOString().slice(0, 10);
    if (rows.length > 0) {
      const records = rows.map((r: any) => ({
        ...r,
        date: today,
        country: null,
        device: null,
      }));

      const { error } = await supabase
        .from("keyword_rankings")
        .upsert(records, { onConflict: "query,page,date,country,device" });
      if (error) console.error("Upsert error:", error);
      totalInserted = records.length;
    }

    // Also fetch device breakdown
    const deviceData = await fetchSearchAnalytics(
      accessToken, siteUrl, start, end,
      ["query", "device"], Math.min(rowLimit, 200)
    );

    const deviceRows = (deviceData.rows || []).map((r: any) => ({
      query: r.keys[0],
      page: null,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: parseFloat(r.ctr.toFixed(4)),
      position: parseFloat(r.position.toFixed(2)),
      date: today,
      country: null,
      device: r.keys[1] || null,
    }));

    if (deviceRows.length > 0) {
      const { error } = await supabase
        .from("keyword_rankings")
        .upsert(deviceRows, { onConflict: "query,page,date,country,device" });
      if (error) console.error("Device upsert error:", error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        startDate: start,
        endDate: end,
        totalRows: totalInserted,
        deviceRows: deviceRows.length,
        mode: "aggregate",
        rows,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
