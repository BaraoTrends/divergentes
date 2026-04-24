#!/usr/bin/env node
/**
 * Build-time SEO consistency check for ARTICLE pages.
 *
 * Samples up to N published articles via the public Supabase REST API and, for
 * each one, fetches the prerender HTML and validates:
 *
 *   1. <meta name="keywords"> is present and matches buildArticleKeywords()
 *      computed from the same focus_keyword + tags + category. This guarantees
 *      client (SEOHead → react-helmet-async) and bot (prerender) emit the SAME
 *      keyword set, since both consume src/lib/keywords.ts#buildArticleKeywords.
 *
 *   2. The full set of <meta property="article:tag"> equals the keywords list
 *      (same items, same order — bots use this for topical hints).
 *
 *   3. Open Graph + Twitter parity:
 *        - og:title === twitter:title
 *        - og:description === twitter:description
 *        - twitter:image is non-empty (jpg fallback for Twitter cache)
 *        - og:image is non-empty
 *        - canonical === og:url
 *
 *   4. article:published_time, article:modified_time, article:author,
 *      article:section are present (rich crawler signals).
 *
 * If the prerender Edge Function or the REST API are unreachable, the check
 * exits 0 with a warning (offline build is still allowed).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://wmdjjvjmwvsceqbcmksb.supabase.co";
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZGpqdmptd3ZzY2VxYmNta3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Nzc3OTIsImV4cCI6MjA5MTU1Mzc5Mn0.cgul6I97ZoaOO4Bv3iVaH2EaWdsRRREgqmPmngRxCUw";
const PRERENDER_URL =
  process.env.PRERENDER_FUNCTION_URL || `${SUPABASE_URL}/functions/v1/prerender`;
const SAMPLE_LIMIT = Number(process.env.ARTICLE_SEO_SAMPLE || "5");

/* ------------------------------------------------------------------ *
 *  Mirror of src/lib/keywords.ts (must stay byte-identical).
 *  Kept inline to avoid a TS loader dependency in the build script.
 * ------------------------------------------------------------------ */
const BRAND_KEYWORDS = [
  "neurodivergência", "neurodiversidade", "tdah", "autismo", "tea",
  "dislexia", "altas habilidades", "superdotação", "toc",
];
const CATEGORY_KEYWORDS = {
  tdah: ["tdah", "transtorno de déficit de atenção", "hiperatividade", "desatenção", "tdah adulto", "tdah infantil", "metilfenidato", "diagnóstico tdah", "tratamento tdah", "tdah brasil"],
  tea: ["tea", "autismo", "transtorno do espectro autista", "espectro autista", "autismo infantil", "autismo adulto", "níveis de suporte autismo", "diagnóstico autismo", "intervenção precoce autismo", "stimming"],
  dislexia: ["dislexia", "dificuldade de leitura", "transtorno de aprendizagem", "alfabetização dislexia", "diagnóstico dislexia", "estratégias dislexia", "tecnologia assistiva dislexia", "dislexia escolar"],
  "altas-habilidades": ["altas habilidades", "superdotação", "ah/sd", "dupla excepcionalidade", "criança superdotada", "enriquecimento curricular", "identificação altas habilidades", "criatividade superdotação"],
  toc: ["toc", "transtorno obsessivo-compulsivo", "obsessões", "compulsões", "tcc-epr", "exposição prevenção resposta", "tratamento toc", "isrs toc", "ansiedade toc"],
};
function normalizeKeywords(list) {
  const seen = new Set();
  const out = [];
  for (const k of list) {
    const v = (k || "").toLowerCase().trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}
function buildArticleKeywords({ focusKeyword, tags, category }) {
  const merged = [];
  if (focusKeyword) merged.push(focusKeyword);
  if (Array.isArray(tags)) merged.push(...tags);
  if (category && CATEGORY_KEYWORDS[category]) merged.push(...CATEGORY_KEYWORDS[category]);
  merged.push(...BRAND_KEYWORDS);
  return normalizeKeywords(merged).slice(0, 15);
}

/* ------------------------------------------------------------------ *
 *  Cross-check: assert local mirror matches src/lib/keywords.ts so a
 *  future edit to one half can't silently drift.
 * ------------------------------------------------------------------ */
function assertMirrorInSync() {
  const src = readFileSync(resolve(ROOT, "src/lib/keywords.ts"), "utf-8");
  for (const kw of BRAND_KEYWORDS) {
    if (!src.includes(`"${kw}"`)) {
      throw new Error(
        `[article-seo] mirror drift: BRAND_KEYWORDS entry "${kw}" not found in src/lib/keywords.ts. ` +
        `Update scripts/validate-article-seo.mjs to match.`,
      );
    }
  }
  for (const cat of Object.keys(CATEGORY_KEYWORDS)) {
    if (!src.includes(`${cat}:`) && !src.includes(`"${cat}":`)) {
      throw new Error(`[article-seo] mirror drift: CATEGORY_KEYWORDS["${cat}"] not found in src/lib/keywords.ts.`);
    }
  }
}

/* ------------------------------------------------------------------ *
 *  HTML extractors.
 * ------------------------------------------------------------------ */
const pickAttr = (html, regex) => {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
};
const pickAll = (html, regex) => {
  const out = [];
  for (const m of html.matchAll(regex)) out.push(m[1].trim());
  return out;
};

function extractMeta(html) {
  return {
    title: pickAttr(html, /<title>([\s\S]*?)<\/title>/i),
    description: pickAttr(html, /<meta\s+name="description"\s+content="([^"]*)"/i),
    keywords: pickAttr(html, /<meta\s+name="keywords"\s+content="([^"]*)"/i),
    canonical: pickAttr(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i),
    ogTitle: pickAttr(html, /<meta\s+property="og:title"\s+content="([^"]*)"/i),
    ogDescription: pickAttr(html, /<meta\s+property="og:description"\s+content="([^"]*)"/i),
    ogUrl: pickAttr(html, /<meta\s+property="og:url"\s+content="([^"]*)"/i),
    ogImage: pickAttr(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i),
    ogType: pickAttr(html, /<meta\s+property="og:type"\s+content="([^"]*)"/i),
    twitterTitle: pickAttr(html, /<meta\s+name="twitter:title"\s+content="([^"]*)"/i),
    twitterDescription: pickAttr(html, /<meta\s+name="twitter:description"\s+content="([^"]*)"/i),
    twitterImage: pickAttr(html, /<meta\s+name="twitter:image"\s+content="([^"]*)"/i),
    articleTags: pickAll(html, /<meta\s+property="article:tag"\s+content="([^"]*)"/gi),
    articlePublished: pickAttr(html, /<meta\s+property="article:published_time"\s+content="([^"]*)"/i),
    articleModified: pickAttr(html, /<meta\s+property="article:modified_time"\s+content="([^"]*)"/i),
    articleAuthor: pickAttr(html, /<meta\s+property="article:author"\s+content="([^"]*)"/i),
    articleSection: pickAttr(html, /<meta\s+property="article:section"\s+content="([^"]*)"/i),
  };
}

/* ------------------------------------------------------------------ *
 *  Reachability probes.
 * ------------------------------------------------------------------ */
async function probe(url, init) {
  try {
    const res = await fetch(url, init);
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 *  Main.
 * ------------------------------------------------------------------ */
assertMirrorInSync();

const articlesRes = await probe(
  `${SUPABASE_URL}/rest/v1/articles?select=slug,title,category,focus_keyword,tags&published=eq.true&order=updated_at.desc&limit=${SAMPLE_LIMIT}`,
  { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } },
);

if (!articlesRes) {
  console.warn("[article-seo] Supabase REST unreachable — skipping article checks (offline build).");
  process.exit(0);
}
const articles = await articlesRes.json();
if (!Array.isArray(articles) || articles.length === 0) {
  console.log("[article-seo] no published articles found — nothing to validate.");
  process.exit(0);
}

const prerenderProbe = await probe(`${PRERENDER_URL}?path=/`, { headers: { Accept: "text/html" } });
if (!prerenderProbe) {
  console.warn("[article-seo] prerender unreachable — skipping article checks (offline build).");
  process.exit(0);
}

const errors = [];

for (const a of articles) {
  const path = `/blog/${a.slug}`;
  const id = `[article-seo] ${path}`;
  const expectedKeywords = buildArticleKeywords({
    focusKeyword: a.focus_keyword,
    tags: a.tags,
    category: a.category,
  });
  if (expectedKeywords.length === 0) {
    errors.push(`${id}: buildArticleKeywords() returned empty list (broken category "${a.category}"?)`);
    continue;
  }

  let html;
  try {
    const res = await fetch(`${PRERENDER_URL}?path=${encodeURIComponent(path)}`, { headers: { Accept: "text/html" } });
    if (!res.ok) { errors.push(`${id}: prerender HTTP ${res.status}`); continue; }
    html = await res.text();
  } catch (err) {
    errors.push(`${id}: prerender fetch failed (${err.message || err})`);
    continue;
  }
  const meta = extractMeta(html);

  // 1. keywords meta present + equal to expected
  if (!meta.keywords) {
    errors.push(`${id}: missing <meta name="keywords"> in prerender output`);
  } else {
    const got = meta.keywords.split(",").map((s) => s.trim()).filter(Boolean);
    if (JSON.stringify(got) !== JSON.stringify(expectedKeywords)) {
      errors.push(
        `${id}: keywords mismatch between buildArticleKeywords() and prerender\n` +
        `        expected: ${JSON.stringify(expectedKeywords)}\n` +
        `        got:      ${JSON.stringify(got)}`,
      );
    }
  }

  // 2. article:tag list mirrors keywords list (same order)
  if (JSON.stringify(meta.articleTags) !== JSON.stringify(expectedKeywords)) {
    errors.push(
      `${id}: <meta property="article:tag"> set ≠ keywords\n` +
      `        expected: ${JSON.stringify(expectedKeywords)}\n` +
      `        got:      ${JSON.stringify(meta.articleTags)}`,
    );
  }

  // 3. og + twitter parity
  if (meta.ogType !== "article") errors.push(`${id}: og:type should be "article" — got "${meta.ogType}"`);
  if (!meta.ogTitle || !meta.twitterTitle || meta.ogTitle !== meta.twitterTitle)
    errors.push(`${id}: og:title ≠ twitter:title  ("${meta.ogTitle}" vs "${meta.twitterTitle}")`);
  if (!meta.ogDescription || !meta.twitterDescription || meta.ogDescription !== meta.twitterDescription)
    errors.push(`${id}: og:description ≠ twitter:description`);
  if (!meta.ogImage) errors.push(`${id}: missing og:image`);
  if (!meta.twitterImage) errors.push(`${id}: missing twitter:image`);
  if (!meta.canonical || !meta.ogUrl || meta.canonical !== meta.ogUrl)
    errors.push(`${id}: canonical ≠ og:url  ("${meta.canonical}" vs "${meta.ogUrl}")`);

  // 4. article-specific meta
  for (const [k, v] of Object.entries({
    "article:published_time": meta.articlePublished,
    "article:modified_time": meta.articleModified,
    "article:author": meta.articleAuthor,
    "article:section": meta.articleSection,
  })) {
    if (!v) errors.push(`${id}: missing <meta property="${k}">`);
  }
}

if (errors.length) {
  console.error(`\n[article-seo] ${errors.length} issue(s) across ${articles.length} sampled article(s):\n  - ${errors.join("\n  - ")}\n`);
  process.exit(1);
}
console.log(`[article-seo] ✓ ${articles.length} article(s) validated — keywords + OG + Twitter consistent.`);
