import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const SITE_URL = "https://neurorotina.com";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Ping search engines about sitemap updates and submit URLs via IndexNow.
 *
 * POST body: { url: string } — the article URL that was published/updated
 *
 * Actions:
 * 1. Ping Google sitemap endpoint
 * 2. Ping Bing sitemap endpoint
 * 3. Submit URL via IndexNow (Bing, Yandex, Seznam, Naver)
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    const results: Record<string, string> = {};

    // 1. Ping Google Sitemap
    try {
      const googlePing = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
        { method: "GET" }
      );
      results.google_sitemap_ping = googlePing.ok ? "ok" : `HTTP ${googlePing.status}`;
    } catch (e) {
      results.google_sitemap_ping = `error: ${e}`;
    }

    // 2. Ping Bing Sitemap
    try {
      const bingPing = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
        { method: "GET" }
      );
      results.bing_sitemap_ping = bingPing.ok ? "ok" : `HTTP ${bingPing.status}`;
    } catch (e) {
      results.bing_sitemap_ping = `error: ${e}`;
    }

    // 3. IndexNow — submit URL to Bing/Yandex/Seznam/Naver
    const indexNowKey = Deno.env.get("INDEXNOW_KEY");
    if (indexNowKey && url) {
      const payload = {
        host: new URL(SITE_URL).host,
        key: indexNowKey,
        keyLocation: `${SITE_URL}/${indexNowKey}.txt`,
        urlList: [url],
      };

      const engines = [
        "https://api.indexnow.org/indexnow",
        "https://www.bing.com/indexnow",
        "https://yandex.com/indexnow",
      ];

      for (const engine of engines) {
        try {
          const res = await fetch(engine, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify(payload),
          });
          const name = new URL(engine).hostname;
          results[`indexnow_${name}`] = res.ok || res.status === 202 ? "ok" : `HTTP ${res.status}`;
        } catch (e) {
          const name = new URL(engine).hostname;
          results[`indexnow_${name}`] = `error: ${e}`;
        }
      }
    } else {
      results.indexnow = "skipped (INDEXNOW_KEY not set)";
    }

    console.log("[ping-search-engines]", JSON.stringify(results));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ping-search-engines error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
