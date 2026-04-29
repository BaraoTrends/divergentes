/**
 * Validação automatizada do sitemap (índice + sub-sitemaps).
 *
 * Roda contra a edge function já deployada (URL via env) — assim valida
 * exatamente o que Google/Bing vão consumir. Default aponta pro projeto.
 *
 * Uso:
 *   deno test --allow-net --allow-env supabase/functions/sitemap/sitemap_test.ts
 *   SITEMAP_BASE_URL=https://outra.../functions/v1/sitemap deno test ...
 */
import { assert, assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";

const BASE = Deno.env.get("SITEMAP_BASE_URL")
  || "https://wmdjjvjmwvsceqbcmksb.supabase.co/functions/v1/sitemap";

const SUB_SITEMAPS = ["pages", "categories", "posts", "news"] as const;

async function fetchXml(type: string): Promise<{ status: number; contentType: string; body: string }> {
  const url = type === "index" ? BASE : `${BASE}?type=${type}`;
  const res = await fetch(url, { headers: { Accept: "application/xml" } });
  return { status: res.status, contentType: res.headers.get("content-type") || "", body: await res.text() };
}

function assertValidXmlHeader(body: string, label: string) {
  assert(body.trim().startsWith("<?xml"), `${label}: não começa com declaração <?xml ?>`);
  assertStringIncludes(body, 'encoding="UTF-8"', `${label}: deve declarar UTF-8`);
}

Deno.test("sitemap index retorna sitemapindex válido com 4 sub-sitemaps", async () => {
  const { status, contentType, body } = await fetchXml("index");
  assertEquals(status, 200, "HTTP 200 esperado");
  assertStringIncludes(contentType, "xml", "Content-Type deve ser XML");
  assertValidXmlHeader(body, "index");
  assertStringIncludes(body, "<sitemapindex", "deve conter <sitemapindex>");
  for (const name of SUB_SITEMAPS) {
    assertStringIncludes(body, `sitemap-${name}.xml`, `índice deve referenciar sitemap-${name}.xml`);
  }
  // Cada <sitemap> deve ter <loc> e <lastmod>
  const sitemapBlocks = body.match(/<sitemap>[\s\S]*?<\/sitemap>/g) || [];
  assertEquals(sitemapBlocks.length, 4, "deve listar exatamente 4 sub-sitemaps");
  for (const block of sitemapBlocks) {
    assertStringIncludes(block, "<loc>", "cada <sitemap> precisa de <loc>");
    assertStringIncludes(block, "<lastmod>", "cada <sitemap> precisa de <lastmod>");
  }
});

Deno.test("sitemap-pages.xml contém páginas estáticas obrigatórias", async () => {
  const { status, body } = await fetchXml("pages");
  assertEquals(status, 200);
  assertValidXmlHeader(body, "pages");
  assertStringIncludes(body, "<urlset");
  for (const must of ["/blog", "/perguntas-frequentes", "/sobre", "/contato", "/politica-de-privacidade"]) {
    assertStringIncludes(body, `<loc>https://neurorotina.com${must}</loc>`, `falta página ${must}`);
  }
});

Deno.test("sitemap-categories.xml lista as 5 categorias", async () => {
  const { status, body } = await fetchXml("categories");
  assertEquals(status, 200);
  assertValidXmlHeader(body, "categories");
  for (const cat of ["tdah", "tea", "dislexia", "altas-habilidades", "toc"]) {
    assertStringIncludes(body, `<loc>https://neurorotina.com/${cat}</loc>`, `falta categoria /${cat}`);
  }
});

Deno.test("sitemap-posts.xml retorna URLs de artigos válidas", async () => {
  const { status, body } = await fetchXml("posts");
  assertEquals(status, 200);
  assertValidXmlHeader(body, "posts");
  assertStringIncludes(body, "<urlset");
  // Todas as <loc> de posts devem estar sob /blog/<slug>
  const locs = [...body.matchAll(/<loc>(https:\/\/neurorotina\.com\/blog\/[a-z0-9-]+)<\/loc>/g)];
  assert(locs.length >= 1, "esperado ao menos 1 artigo publicado no sitemap");
  // Garante que não há <loc> fora do padrão /blog/<slug>
  const allLocs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const loc of allLocs) {
    assert(/^https:\/\/neurorotina\.com\/blog\/[a-z0-9-]+$/.test(loc), `URL fora do padrão /blog/<slug>: ${loc}`);
  }
});

Deno.test("sitemap-news.xml é XML válido (pode estar vazio fora de janela 48h)", async () => {
  const { status, body } = await fetchXml("news");
  assertEquals(status, 200);
  assertValidXmlHeader(body, "news");
  assertStringIncludes(body, "<urlset");
  assertStringIncludes(body, 'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
  // Se houver itens, cada um deve ter publication_date e title
  if (body.includes("<news:news>")) {
    assertStringIncludes(body, "<news:publication_date>");
    assertStringIncludes(body, "<news:title>");
  }
});

Deno.test("nenhum sub-sitemap excede limite de 50.000 URLs (regra Google)", async () => {
  for (const name of SUB_SITEMAPS) {
    const { body } = await fetchXml(name);
    const count = (body.match(/<loc>/g) || []).length;
    assert(count <= 50000, `sitemap-${name}.xml tem ${count} URLs (máx 50000)`);
  }
});
