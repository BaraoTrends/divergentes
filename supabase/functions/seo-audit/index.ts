import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_URL = "https://neurorotina.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RouteAudit {
  path: string;
  label: string;
  status: "pass" | "warn" | "fail" | "error";
  checks: AuditCheck[];
}

interface AuditCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  value: string;
  detail?: string;
}

function extractTag(html: string, pattern: RegExp): string {
  const m = html.match(pattern);
  return m ? m[1].trim() : "";
}

function auditHtml(html: string, path: string): AuditCheck[] {
  const checks: AuditCheck[] = [];

  // Title
  const title = extractTag(html, /<title>([^<]*)<\/title>/i);
  if (!title) {
    checks.push({ id: "title", label: "Title", status: "fail", value: "(vazio)", detail: "A tag <title> está ausente ou vazia." });
  } else if (title.length > 60) {
    checks.push({ id: "title", label: "Title", status: "warn", value: `${title.length} chars`, detail: `"${title.slice(0, 80)}…" — Recomendado: até 60 caracteres.` });
  } else {
    checks.push({ id: "title", label: "Title", status: "pass", value: `${title.length} chars`, detail: title });
  }

  // Meta description
  const desc = extractTag(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!desc) {
    checks.push({ id: "description", label: "Meta Description", status: "fail", value: "(vazio)", detail: "Meta description ausente." });
  } else if (desc.length > 160) {
    checks.push({ id: "description", label: "Meta Description", status: "warn", value: `${desc.length} chars`, detail: `Recomendado: até 160 caracteres.` });
  } else if (desc.length < 50) {
    checks.push({ id: "description", label: "Meta Description", status: "warn", value: `${desc.length} chars`, detail: `Muito curta. Recomendado: 50-160 caracteres.` });
  } else {
    checks.push({ id: "description", label: "Meta Description", status: "pass", value: `${desc.length} chars` });
  }

  // Canonical
  const canonical = extractTag(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const expectedCanonical = `${SITE_URL}${path}`;
  if (!canonical) {
    checks.push({ id: "canonical", label: "Canonical", status: "fail", value: "(ausente)", detail: "Tag canonical não encontrada." });
  } else if (canonical !== expectedCanonical && canonical !== expectedCanonical.replace(/\/$/, "")) {
    checks.push({ id: "canonical", label: "Canonical", status: "warn", value: canonical, detail: `Esperado: ${expectedCanonical}` });
  } else {
    checks.push({ id: "canonical", label: "Canonical", status: "pass", value: canonical });
  }

  // Robots
  const robots = extractTag(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);
  if (!robots) {
    checks.push({ id: "robots", label: "Meta Robots", status: "warn", value: "(ausente)", detail: "Nenhuma meta robots encontrada. O padrão é index,follow." });
  } else if (robots.includes("noindex")) {
    checks.push({ id: "robots", label: "Meta Robots", status: "fail", value: robots, detail: "Página marcada como noindex — não será indexada!" });
  } else {
    checks.push({ id: "robots", label: "Meta Robots", status: "pass", value: robots });
  }

  // OG Title
  const ogTitle = extractTag(html, /<meta\s+property="og:title"\s+content="([^"]*)"/i);
  checks.push({
    id: "og_title",
    label: "OG Title",
    status: ogTitle ? "pass" : "fail",
    value: ogTitle || "(ausente)",
  });

  // OG Description
  const ogDesc = extractTag(html, /<meta\s+property="og:description"\s+content="([^"]*)"/i);
  checks.push({
    id: "og_desc",
    label: "OG Description",
    status: ogDesc ? "pass" : "fail",
    value: ogDesc ? `${ogDesc.length} chars` : "(ausente)",
  });

  // OG Image
  const ogImage = extractTag(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i);
  checks.push({
    id: "og_image",
    label: "OG Image",
    status: ogImage ? "pass" : "warn",
    value: ogImage ? "✓" : "(ausente)",
    detail: ogImage || undefined,
  });

  // H1
  const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].trim() : "";
  checks.push({
    id: "h1",
    label: "H1",
    status: h1 ? "pass" : "fail",
    value: h1 || "(ausente)",
    detail: h1 ? undefined : "Toda página precisa de exatamente um H1.",
  });

  // JSON-LD
  const jsonLdCount = (html.match(/application\/ld\+json/gi) || []).length;
  checks.push({
    id: "jsonld",
    label: "JSON-LD Schema",
    status: jsonLdCount > 0 ? "pass" : "warn",
    value: jsonLdCount > 0 ? `${jsonLdCount} schema(s)` : "(nenhum)",
  });

  // Content length (strip tags, count words)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    const text = bodyMatch[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const wordCount = text.split(" ").filter(Boolean).length;
    checks.push({
      id: "content",
      label: "Conteúdo",
      status: wordCount > 50 ? "pass" : wordCount > 10 ? "warn" : "fail",
      value: `${wordCount} palavras`,
      detail: wordCount <= 10 ? "Muito pouco conteúdo visível para crawlers." : undefined,
    });
  }

  return checks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build route list
    const staticRoutes = [
      { path: "/", label: "Home" },
      { path: "/blog", label: "Blog" },
      { path: "/tdah", label: "TDAH" },
      { path: "/tea", label: "TEA" },
      { path: "/dislexia", label: "Dislexia" },
      { path: "/altas-habilidades", label: "Altas Habilidades" },
      { path: "/toc", label: "TOC" },
      { path: "/perguntas-frequentes", label: "FAQ" },
      { path: "/glossario", label: "Glossário" },
      { path: "/sobre", label: "Sobre" },
      { path: "/contato", label: "Contato" },
    ];

    // Get published articles
    const { data: articles } = await supabase
      .from("articles")
      .select("slug, title")
      .eq("published", true)
      .order("created_at", { ascending: false });

    const articleRoutes = (articles || []).map((a) => ({
      path: `/blog/${a.slug}`,
      label: a.title,
    }));

    const allRoutes = [...staticRoutes, ...articleRoutes];

    // Fetch prerendered HTML for each route
    const prerenderUrl = `${supabaseUrl}/functions/v1/prerender`;
    const results: RouteAudit[] = [];

    for (const route of allRoutes) {
      try {
        const res = await fetch(`${prerenderUrl}?path=${encodeURIComponent(route.path)}`, {
          headers: { Authorization: `Bearer ${supabaseKey}` },
        });

        if (!res.ok) {
          results.push({
            path: route.path,
            label: route.label,
            status: "error",
            checks: [{ id: "fetch", label: "Prerender", status: "fail", value: `HTTP ${res.status}` }],
          });
          continue;
        }

        const html = await res.text();
        const checks = auditHtml(html, route.path);
        const fails = checks.filter((c) => c.status === "fail").length;
        const warns = checks.filter((c) => c.status === "warn").length;

        results.push({
          path: route.path,
          label: route.label,
          status: fails > 0 ? "fail" : warns > 0 ? "warn" : "pass",
          checks,
        });
      } catch (e) {
        results.push({
          path: route.path,
          label: route.label,
          status: "error",
          checks: [{ id: "fetch", label: "Prerender", status: "fail", value: String(e) }],
        });
      }
    }

    const totalPass = results.filter((r) => r.status === "pass").length;
    const totalWarn = results.filter((r) => r.status === "warn").length;
    const totalFail = results.filter((r) => r.status === "fail" || r.status === "error").length;

    return new Response(
      JSON.stringify({
        summary: { total: results.length, pass: totalPass, warn: totalWarn, fail: totalFail },
        routes: results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("seo-audit error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});