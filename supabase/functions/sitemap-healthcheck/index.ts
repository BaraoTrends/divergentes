import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Health-check pós-deploy para o sistema de sitemaps.
 *
 * Faz GET nos 5 endpoints públicos (índice + 4 sub-sitemaps) e valida:
 *  - HTTP 200
 *  - Content-Type XML
 *  - Declaração <?xml ?> e UTF-8
 *  - Estrutura mínima esperada (sitemapindex vs urlset)
 *  - Conteúdo obrigatório (categorias, páginas, etc.)
 *  - Limite de 50.000 URLs por arquivo (regra Google)
 *
 * Retorno: JSON com status agregado + breakdown por arquivo.
 * Status 200 = tudo OK | 500 = pelo menos uma falha.
 *
 * Uso:
 *   GET /functions/v1/sitemap-healthcheck
 *   GET /functions/v1/sitemap-healthcheck?base=https://neurorotina.com
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_BASE = "https://neurorotina.com";

const REQUIRED_CATEGORIES = ["tdah", "tea", "dislexia", "altas-habilidades", "toc"];
const REQUIRED_PAGES = ["/blog", "/perguntas-frequentes", "/sobre", "/contato", "/politica-de-privacidade"];

type FileCheck = {
  file: string;
  url: string;
  ok: boolean;
  status: number | null;
  contentType: string | null;
  bytes: number;
  urlCount: number;
  errors: string[];
};

async function checkFile(url: string, kind: "index" | "pages" | "categories" | "posts" | "news", file: string): Promise<FileCheck> {
  const result: FileCheck = { file, url, ok: false, status: null, contentType: null, bytes: 0, urlCount: 0, errors: [] };

  let body = "";
  try {
    const res = await fetch(url, { headers: { Accept: "application/xml" }, redirect: "follow" });
    result.status = res.status;
    result.contentType = res.headers.get("content-type");
    body = await res.text();
    result.bytes = body.length;
    if (res.status !== 200) result.errors.push(`HTTP ${res.status}`);
    if (!result.contentType?.includes("xml")) result.errors.push(`Content-Type não-XML: ${result.contentType}`);
  } catch (e) {
    result.errors.push(`fetch falhou: ${e instanceof Error ? e.message : String(e)}`);
    return result;
  }

  if (!body.trim().startsWith("<?xml")) result.errors.push("não começa com <?xml ?>");
  if (!body.includes('encoding="UTF-8"')) result.errors.push("encoding não declarado como UTF-8");

  if (kind === "index") {
    if (!body.includes("<sitemapindex")) result.errors.push("falta <sitemapindex>");
    for (const sub of ["pages", "categories", "posts", "news"]) {
      if (!body.includes(`sitemap-${sub}.xml`)) result.errors.push(`índice não referencia sitemap-${sub}.xml`);
    }
    result.urlCount = (body.match(/<sitemap>/g) || []).length;
    if (result.urlCount !== 4) result.errors.push(`índice deve listar 4 sub-sitemaps (encontrado: ${result.urlCount})`);
  } else {
    if (!body.includes("<urlset")) result.errors.push("falta <urlset>");
    result.urlCount = (body.match(/<loc>/g) || []).length;
    if (result.urlCount > 50000) result.errors.push(`excede limite Google de 50000 URLs (${result.urlCount})`);

    if (kind === "pages") {
      for (const p of REQUIRED_PAGES) {
        if (!body.includes(`<loc>${DEFAULT_BASE}${p}</loc>`)) result.errors.push(`falta página obrigatória ${p}`);
      }
    }
    if (kind === "categories") {
      for (const c of REQUIRED_CATEGORIES) {
        if (!body.includes(`<loc>${DEFAULT_BASE}/${c}</loc>`)) result.errors.push(`falta categoria /${c}`);
      }
      if (result.urlCount !== REQUIRED_CATEGORIES.length) {
        result.errors.push(`esperado ${REQUIRED_CATEGORIES.length} categorias, encontrado ${result.urlCount}`);
      }
    }
    if (kind === "posts") {
      // Todas as <loc> precisam ser /blog/<slug>
      const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      const invalid = locs.filter((l) => !/^https:\/\/[^/]+\/blog\/[a-z0-9-]+$/.test(l));
      if (invalid.length > 0) result.errors.push(`${invalid.length} URLs fora do padrão /blog/<slug>`);
      if (locs.length === 0) result.errors.push("nenhum artigo no sitemap-posts.xml");
    }
    if (kind === "news") {
      if (!body.includes('xmlns:news=')) result.errors.push("falta namespace xmlns:news");
      // news pode estar vazio fora da janela de 48h — não é erro
    }
  }

  result.ok = result.errors.length === 0;
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const base = (url.searchParams.get("base") || DEFAULT_BASE).replace(/\/$/, "");

  const targets: Array<{ file: string; kind: "index" | "pages" | "categories" | "posts" | "news" }> = [
    { file: "sitemap.xml", kind: "index" },
    { file: "sitemap-pages.xml", kind: "pages" },
    { file: "sitemap-categories.xml", kind: "categories" },
    { file: "sitemap-posts.xml", kind: "posts" },
    { file: "sitemap-news.xml", kind: "news" },
  ];

  const checks = await Promise.all(targets.map((t) => checkFile(`${base}/${t.file}`, t.kind, t.file)));

  const failed = checks.filter((c) => !c.ok);
  const summary = {
    base,
    checked_at: new Date().toISOString(),
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    overall_ok: failed.length === 0,
    files: checks,
  };

  return new Response(JSON.stringify(summary, null, 2), {
    status: failed.length === 0 ? 200 : 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
