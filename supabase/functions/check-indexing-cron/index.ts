import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_URL = "https://neurorotina.com";
const INSPECTION_CONCURRENCY = 4;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Cron job: checks Google indexing status for all published articles.
 * Detects deindexed articles and creates alerts.
 * Called by pg_cron daily or can be invoked manually.
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

async function inspectUrl(accessToken: string, inspectionUrl: string, siteUrl: string) {
  const res = await fetch(
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inspectionUrl, siteUrl }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`HTTP ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const result = data.inspectionResult || {};
  const indexStatus = result.indexStatusResult || {};

  return {
    verdict: indexStatus.verdict || "UNKNOWN",
    coverageState: indexStatus.coverageState || "UNKNOWN",
    lastCrawlTime: indexStatus.lastCrawlTime || null,
  };
}

async function processArticle(
  supabase: ReturnType<typeof createClient>,
  accessToken: string,
  siteUrl: string,
  article: { id: string; slug: string; title: string }
) {
  const url = `${SITE_URL}/blog/${article.slug}`;

  try {
    const inspection = await inspectUrl(accessToken, url, siteUrl);

    const { data: existingStatus } = await supabase
      .from("indexing_status")
      .select("verdict")
      .eq("article_id", article.id)
      .maybeSingle();

    const previousVerdict = existingStatus?.verdict || "UNKNOWN";

    await supabase.from("indexing_status").upsert(
      {
        article_id: article.id,
        url,
        verdict: inspection.verdict,
        coverage_state: inspection.coverageState,
        last_crawl_time: inspection.lastCrawlTime,
        previous_verdict: previousVerdict,
        changed_at: inspection.verdict !== previousVerdict ? new Date().toISOString() : undefined,
      },
      { onConflict: "article_id" }
    );

    let newAlerts = 0;

    if (
      previousVerdict === "PASS" &&
      (inspection.verdict === "FAIL" || inspection.verdict === "NEUTRAL")
    ) {
      await supabase.from("indexing_alerts").insert({
        article_id: article.id,
        alert_type: "deindexed",
        message: `O artigo "${article.title}" saiu do índice do Google. Status anterior: indexado. Status atual: ${inspection.coverageState || inspection.verdict}.`,
      });
      newAlerts++;
      console.log(`[ALERT] Deindexed: ${article.title} (${url})`);
    }

    if (inspection.verdict === "FAIL" && previousVerdict !== "FAIL") {
      if (previousVerdict !== "PASS") {
        await supabase.from("indexing_alerts").insert({
          article_id: article.id,
          alert_type: "error",
          message: `O artigo "${article.title}" não está indexado. Motivo: ${inspection.coverageState || "desconhecido"}.`,
        });
        newAlerts++;
      }
    }

    if (inspection.verdict === "PASS" && previousVerdict !== "PASS") {
      await supabase
        .from("indexing_alerts")
        .update({ resolved: true })
        .eq("article_id", article.id)
        .eq("resolved", false);
      console.log(`[RESOLVED] Re-indexed: ${article.title}`);
    }

    return {
      slug: article.slug,
      verdict: inspection.verdict,
      previous: previousVerdict,
      changed: inspection.verdict !== previousVerdict,
      newAlerts,
    };
  } catch (e) {
    console.error(`Error inspecting ${article.slug}:`, e);
    return { slug: article.slug, error: String(e), newAlerts: 0 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      console.error("GOOGLE_SERVICE_ACCOUNT_JSON not configured");
      return new Response(
        JSON.stringify({ error: "GOOGLE_SERVICE_ACCOUNT_JSON not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccount = JSON.parse(saJson);
    const accessToken = await getAccessToken(serviceAccount);

    // Get all published articles
    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("id, slug, title")
      .eq("published", true);

    if (articlesError) throw articlesError;
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ message: "No published articles" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = `${SITE_URL}/`;
    const results: any[] = [];
    let newAlerts = 0;

    for (let index = 0; index < articles.length; index += INSPECTION_CONCURRENCY) {
      const batch = articles.slice(index, index + INSPECTION_CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((article) => processArticle(supabase, accessToken, siteUrl, article))
      );

      batchResults.forEach(({ newAlerts: batchAlertCount, ...result }) => {
        newAlerts += batchAlertCount;
        results.push(result);
      });
    }

    console.log(
      `[check-indexing-cron] Checked ${articles.length} articles. ${newAlerts} new alert(s).`
    );

    return new Response(
      JSON.stringify({
        checked: articles.length,
        newAlerts,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("check-indexing-cron error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
