#!/usr/bin/env tsx
/**
 * Build-time SEO consistency check for ARTICLE pages.
 *
 * Single source of truth: this script imports `buildArticleKeywords`,
 * `serializeKeywordsMeta`, `parseKeywordsMeta` and `normalizeKeywords` directly
 * from `src/lib/keywords.ts` (executed via tsx). The previous mirror has been
 * removed so client + prerender + validator can never drift again.
 *
 * Pipeline:
 *   1. Sample N most-recent published articles (REST + anon key).
 *   2. Skip drafts, empty/invalid slugs, and articles whose category is not in
 *      CATEGORY_KEYWORDS — those are off-schema and intentionally NOT validated.
 *   3. Fetch the prerender HTML for each article and extract:
 *        title, description, canonical, og:*, twitter:*, article:*, keywords.
 *   4. Compare against the expected keyword list using the SAME normalization
 *      pipeline the prerender runs through (parseKeywordsMeta), so casing,
 *      stray spaces, and trailing separators NEVER cause false positives.
 *   5. On any failure, write /tmp/seo-report.json + /tmp/seo-report.html with
 *      the offending HTML snippet for inspection, then exit 1.
 *
 * Network failures (REST or prerender unreachable) are treated as soft skips —
 * the build is NOT failed, only logged.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CATEGORY_KEYWORDS,
  buildArticleKeywords,
  parseKeywordsMeta,
  normalizeKeywords,
  serializeKeywordsMeta,
} from "../src/lib/keywords";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://wmdjjvjmwvsceqbcmksb.supabase.co";
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZGpqdmptd3ZzY2VxYmNta3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Nzc3OTIsImV4cCI6MjA5MTU1Mzc5Mn0.cgul6I97ZoaOO4Bv3iVaH2EaWdsRRREgqmPmngRxCUw";
const PRERENDER_URL =
  process.env.PRERENDER_FUNCTION_URL || `${SUPABASE_URL}/functions/v1/prerender`;
const SAMPLE_LIMIT = Number(process.env.ARTICLE_SEO_SAMPLE || "10");

const REPORT_JSON = "/tmp/seo-report.json";
const REPORT_HTML = "/tmp/seo-report.html";

/* ------------------------------------------------------------------ *
 *  HTML extractors.
 * ------------------------------------------------------------------ */
const pickAttr = (html: string, regex: RegExp): string | null => {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
};
const pickAll = (html: string, regex: RegExp): string[] => {
  const out: string[] = [];
  for (const m of html.matchAll(regex)) out.push(m[1].trim());
  return out;
};

interface ExtractedMeta {
  title: string | null;
  description: string | null;
  keywords: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogUrl: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  articleTags: string[];
  articlePublished: string | null;
  articleModified: string | null;
  articleAuthor: string | null;
  articleSection: string | null;
}

function extractMeta(html: string): ExtractedMeta {
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

/** Return the <head> region only — keeps the snippet small enough for a report. */
function extractHead(html: string): string {
  const m = html.match(/<head>([\s\S]*?)<\/head>/i);
  return m ? m[1].trim() : html.slice(0, 4000);
}

interface ArticleRow {
  slug: string;
  title: string;
  category: string;
  focus_keyword: string | null;
  tags: string[] | null;
  published: boolean;
}

interface ArticleFailure {
  slug: string;
  url: string;
  category: string;
  expectedKeywords: string[];
  expectedKeywordsMeta: string;
  reasons: string[];
  prerenderHeadSnippet: string;
}

/* ------------------------------------------------------------------ *
 *  Reachability + main.
 * ------------------------------------------------------------------ */
async function probe(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, init);
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

const VALID_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isPublicArticle(a: ArticleRow): { ok: true } | { ok: false; reason: string } {
  if (a.published !== true) return { ok: false, reason: "draft" };
  if (!a.slug || !VALID_SLUG_RE.test(a.slug)) return { ok: false, reason: `invalid slug "${a.slug}"` };
  if (!a.category || !(a.category in CATEGORY_KEYWORDS))
    return { ok: false, reason: `off-schema category "${a.category}"` };
  return { ok: true };
}

const articlesRes = await probe(
  `${SUPABASE_URL}/rest/v1/articles?select=slug,title,category,focus_keyword,tags,published&published=eq.true&order=updated_at.desc&limit=${SAMPLE_LIMIT}`,
  { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } },
);

if (!articlesRes) {
  console.warn("[article-seo] Supabase REST unreachable — skipping article checks (offline build).");
  process.exit(0);
}
const articlesJson = (await articlesRes.json()) as ArticleRow[];
if (!Array.isArray(articlesJson) || articlesJson.length === 0) {
  console.log("[article-seo] no published articles found — nothing to validate.");
  process.exit(0);
}

const prerenderProbe = await probe(`${PRERENDER_URL}?path=/`, { headers: { Accept: "text/html" } });
if (!prerenderProbe) {
  console.warn("[article-seo] prerender unreachable — skipping article checks (offline build).");
  process.exit(0);
}

const failures: ArticleFailure[] = [];
const skipped: { slug: string; reason: string }[] = [];
let validatedCount = 0;

for (const a of articlesJson) {
  const guard = isPublicArticle(a);
  if (!guard.ok) {
    skipped.push({ slug: a.slug || "(empty)", reason: guard.reason });
    continue;
  }
  const path = `/blog/${a.slug}`;
  const expectedKeywords = buildArticleKeywords({
    focusKeyword: a.focus_keyword,
    tags: a.tags,
    category: a.category,
  });
  if (expectedKeywords.length === 0) {
    skipped.push({ slug: a.slug, reason: "buildArticleKeywords returned empty (off-schema)" });
    continue;
  }
  const expectedKeywordsMeta = serializeKeywordsMeta(expectedKeywords);

  let html: string;
  try {
    const res = await fetch(`${PRERENDER_URL}?path=${encodeURIComponent(path)}`, {
      headers: { Accept: "text/html" },
    });
    if (!res.ok) {
      failures.push({
        slug: a.slug, url: path, category: a.category,
        expectedKeywords, expectedKeywordsMeta,
        reasons: [`prerender HTTP ${res.status}`],
        prerenderHeadSnippet: "",
      });
      continue;
    }
    html = await res.text();
  } catch (err) {
    failures.push({
      slug: a.slug, url: path, category: a.category,
      expectedKeywords, expectedKeywordsMeta,
      reasons: [`prerender fetch failed: ${(err as Error).message}`],
      prerenderHeadSnippet: "",
    });
    continue;
  }

  const meta = extractMeta(html);
  const reasons: string[] = [];

  // 1. <meta name="keywords"> — compare via parseKeywordsMeta to ignore casing/spacing.
  if (!meta.keywords) {
    reasons.push("missing <meta name=\"keywords\"> in prerender output");
  } else {
    const got = parseKeywordsMeta(meta.keywords);
    if (JSON.stringify(got) !== JSON.stringify(expectedKeywords)) {
      reasons.push(
        `<meta name="keywords"> mismatch\n            expected (normalized): ${JSON.stringify(expectedKeywords)}\n            got (normalized):      ${JSON.stringify(got)}`,
      );
    }
  }

  // 2. article:tag list mirrors keywords (normalized + ordered).
  const gotTags = normalizeKeywords(meta.articleTags);
  if (JSON.stringify(gotTags) !== JSON.stringify(expectedKeywords)) {
    reasons.push(
      `<meta property="article:tag"> set ≠ keywords\n            expected: ${JSON.stringify(expectedKeywords)}\n            got:      ${JSON.stringify(gotTags)}`,
    );
  }

  // 3. og + twitter parity.
  if (meta.ogType !== "article") reasons.push(`og:type should be "article" — got "${meta.ogType}"`);
  if (!meta.ogTitle || !meta.twitterTitle || meta.ogTitle !== meta.twitterTitle)
    reasons.push(`og:title ≠ twitter:title  ("${meta.ogTitle}" vs "${meta.twitterTitle}")`);
  if (!meta.ogDescription || !meta.twitterDescription || meta.ogDescription !== meta.twitterDescription)
    reasons.push("og:description ≠ twitter:description");
  if (!meta.ogImage) reasons.push("missing og:image");
  if (!meta.twitterImage) reasons.push("missing twitter:image");
  if (!meta.canonical || !meta.ogUrl || meta.canonical !== meta.ogUrl)
    reasons.push(`canonical ≠ og:url  ("${meta.canonical}" vs "${meta.ogUrl}")`);

  // 4. article-specific meta.
  for (const [k, v] of Object.entries({
    "article:published_time": meta.articlePublished,
    "article:modified_time": meta.articleModified,
    "article:author": meta.articleAuthor,
    "article:section": meta.articleSection,
  })) {
    if (!v) reasons.push(`missing <meta property="${k}">`);
  }

  if (reasons.length > 0) {
    failures.push({
      slug: a.slug, url: path, category: a.category,
      expectedKeywords, expectedKeywordsMeta,
      reasons,
      prerenderHeadSnippet: extractHead(html),
    });
  }
  validatedCount++;
}

/* ------------------------------------------------------------------ *
 *  Reports.
 * ------------------------------------------------------------------ */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

if (failures.length > 0) {
  const report = {
    generatedAt: new Date().toISOString(),
    validated: validatedCount,
    failed: failures.length,
    skipped,
    failures,
  };
  writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), "utf-8");

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>SEO Report — ${failures.length} artigo(s) com problemas</title>
<style>
  body{font:14px/1.5 ui-monospace,Menlo,monospace;max-width:1100px;margin:32px auto;padding:0 16px;color:#111}
  h1{font-size:22px;margin-bottom:4px}
  h2{font-size:16px;margin:32px 0 8px;border-top:1px solid #ddd;padding-top:16px}
  .meta{color:#666;font-size:12px}
  .reason{background:#fee;border:1px solid #fbb;border-radius:4px;padding:8px;margin:6px 0;white-space:pre-wrap}
  details{margin:8px 0}
  pre{background:#f5f5f5;border:1px solid #ddd;border-radius:4px;padding:12px;overflow:auto;font-size:12px}
  .skip{color:#888;font-size:12px}
</style></head><body>
<h1>SEO Report</h1>
<p class="meta">Geração: ${report.generatedAt} — validados: ${validatedCount}, falhas: ${failures.length}, ignorados: ${skipped.length}</p>
${skipped.length ? `<p class="skip">Ignorados: ${skipped.map((s) => `${s.slug} (${s.reason})`).join("; ")}</p>` : ""}
${failures.map((f) => `
<h2>${escapeHtml(f.slug)} <span class="meta">— ${escapeHtml(f.category)} — ${escapeHtml(f.url)}</span></h2>
<p class="meta">Esperado <code>&lt;meta name="keywords"&gt;</code>: <code>${escapeHtml(f.expectedKeywordsMeta)}</code></p>
${f.reasons.map((r) => `<div class="reason">${escapeHtml(r)}</div>`).join("")}
<details><summary>HTML &lt;head&gt; do prerender</summary><pre>${escapeHtml(f.prerenderHeadSnippet)}</pre></details>
`).join("")}
</body></html>`;
  writeFileSync(REPORT_HTML, html, "utf-8");

  console.error(
    `\n[article-seo] ${failures.length} article(s) failed validation (validated ${validatedCount}, skipped ${skipped.length}).\n` +
    `              Report: ${REPORT_JSON}\n` +
    `              Report: ${REPORT_HTML}\n`,
  );
  for (const f of failures) {
    console.error(`  - ${f.url}\n      ${f.reasons.join("\n      ")}`);
  }
  process.exit(1);
}

console.log(
  `[article-seo] ✓ ${validatedCount} article(s) validated — keywords + OG + Twitter consistent` +
  (skipped.length ? ` (${skipped.length} skipped: ${skipped.map((s) => s.reason).join(", ")})` : "") +
  ".",
);
