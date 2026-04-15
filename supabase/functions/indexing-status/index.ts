import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Google Search Console URL Inspection API.
 * Uses the same GOOGLE_SERVICE_ACCOUNT_JSON secret.
 * The service account must have access to the Search Console property.
 *
 * POST body: { urls: string[], siteUrl: string }
 * Returns: { results: { url, verdict, indexingState, coverageState, lastCrawlTime, pageFetchState, robotsTxtState }[] }
 */

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
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

  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

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
    const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_SERVICE_ACCOUNT_JSON não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccount = JSON.parse(saJson);
    const accessToken = await getAccessToken(serviceAccount);

    const { urls, siteUrl = "https://neurorotina.com/" } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "Envie um array de URLs" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const inspectionUrl of urls) {
      try {
        const res = await fetch(
          "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inspectionUrl,
              siteUrl,
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const result = data.inspectionResult || {};
          const indexStatus = result.indexStatusResult || {};
          
          results.push({
            url: inspectionUrl,
            status: "ok",
            verdict: indexStatus.verdict || "UNKNOWN",
            coverageState: indexStatus.coverageState || "UNKNOWN",
            indexingState: indexStatus.indexingState || "UNKNOWN",
            lastCrawlTime: indexStatus.lastCrawlTime || null,
            pageFetchState: indexStatus.pageFetchState || "UNKNOWN",
            robotsTxtState: indexStatus.robotsTxtState || "UNKNOWN",
            crawledAs: indexStatus.crawledAs || "UNKNOWN",
            referringUrls: indexStatus.referringUrls || [],
          });
        } else {
          const errBody = await res.text();
          results.push({
            url: inspectionUrl,
            status: "error",
            error: `HTTP ${res.status}: ${errBody}`,
          });
        }
      } catch (e) {
        results.push({
          url: inspectionUrl,
          status: "error",
          error: String(e),
        });
      }

      // Small delay to avoid rate limiting
      if (urls.length > 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("indexing-status error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
