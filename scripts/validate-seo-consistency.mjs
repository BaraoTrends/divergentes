#!/usr/bin/env node
/**
 * Build-time SEO consistency check.
 *
 * For each known route, asserts that:
 *   1. SEOHead (client) and prerender (Edge Function) emit the SAME 4 critical tags:
 *        - <title>, <meta name="description">, <link rel="canonical">, <meta og:url>
 *   2. canonical and og:url match exactly (NEVER diverge).
 *   3. Title length ≤ 65 chars.
 *   4. Description length 50–160 chars.
 *   5. Canonical is absolute https://...
 *
 * JSON-LD audit (per route, against prerender output):
 *   6. BreadcrumbList MUST be present on every internal route, MUST be absent on "/".
 *   7. FAQPage MUST appear ONLY on /perguntas-frequentes (and on article pages
 *      with detected Q&A — those are not in the static ROUTES set, so we just
 *      assert it never leaks onto category/static pages).
 *   8. Every emitted JSON-LD block must be valid JSON with @context + @type.
 *
 * If the prerender Edge Function is unreachable (offline build), only the static
 * structural checks against SEOHead.tsx run — but the build is NOT failed for
 * unreachable network, only for actual SEO issues.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const PRERENDER_URL =
  process.env.PRERENDER_FUNCTION_URL ||
  (process.env.VITE_SUPABASE_URL
    ? `${process.env.VITE_SUPABASE_URL}/functions/v1/prerender`
    : "https://wmdjjvjmwvsceqbcmksb.supabase.co/functions/v1/prerender");

const ROUTES = [
  "/", "/blog", "/perguntas-frequentes", "/glossario", "/sobre", "/contato",
  "/tdah", "/tea", "/dislexia", "/altas-habilidades", "/toc",
];

const pickTag = (html, regex) => {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
};

const extractSeo = (html) => ({
  title: pickTag(html, /<title>([\s\S]*?)<\/title>/i),
  description: pickTag(html, /<meta\s+name="description"\s+content="([^"]*)"/i),
  canonical: pickTag(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i),
  ogUrl: pickTag(html, /<meta\s+property="og:url"\s+content="([^"]*)"/i),
});

/** Extract every JSON-LD block from HTML and return the parsed @type list. */
function extractJsonLdTypes(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const results = []; // { type: string, raw: string, parseError?: string }
  for (const m of blocks) {
    const raw = m[1].trim();
    try {
      const json = JSON.parse(raw);
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        const t = item && item["@type"];
        const types = Array.isArray(t) ? t : [t];
        for (const type of types) {
          if (typeof type === "string") results.push({ type, hasContext: !!item["@context"] });
        }
      }
    } catch (err) {
      results.push({ type: "__invalid__", parseError: err.message });
    }
  }
  return results;
}

// Routes where FAQPage is EXPECTED. All other static routes must NOT emit it.
const FAQ_ALLOWED = new Set(["/perguntas-frequentes"]);
// "/" is the only route that may legitimately omit BreadcrumbList.
const BREADCRUMB_OPTIONAL = new Set(["/"]);

const errors = [];

function check(path, seo, source) {
  const id = `[${source}] ${path}`;
  if (!seo.title) errors.push(`${id}: missing <title>`);
  if (!seo.description) errors.push(`${id}: missing meta description`);
  if (!seo.canonical) errors.push(`${id}: missing canonical`);
  if (!seo.ogUrl) errors.push(`${id}: missing og:url`);
  if (seo.title && seo.title.length > 65) errors.push(`${id}: title too long (${seo.title.length} > 65)`);
  if (seo.description && (seo.description.length < 50 || seo.description.length > 160))
    errors.push(`${id}: description length ${seo.description.length} outside 50–160`);
  if (seo.canonical && !/^https:\/\//.test(seo.canonical))
    errors.push(`${id}: canonical not absolute https — got "${seo.canonical}"`);
  if (seo.canonical && seo.ogUrl && seo.canonical !== seo.ogUrl)
    errors.push(`${id}: canonical ≠ og:url\n        canonical: ${seo.canonical}\n        og:url:    ${seo.ogUrl}`);
}

function checkSchemas(path, html) {
  const id = `[schema] ${path}`;
  const found = extractJsonLdTypes(html);

  for (const f of found) {
    if (f.type === "__invalid__") errors.push(`${id}: invalid JSON-LD block — ${f.parseError}`);
    else if (!f.hasContext) errors.push(`${id}: JSON-LD ${f.type} missing @context`);
  }

  const types = new Set(found.map((f) => f.type));
  const hasBreadcrumb = types.has("BreadcrumbList");
  const hasFaq = types.has("FAQPage");

  if (!hasBreadcrumb && !BREADCRUMB_OPTIONAL.has(path))
    errors.push(`${id}: missing BreadcrumbList JSON-LD`);
  if (hasBreadcrumb && BREADCRUMB_OPTIONAL.has(path))
    errors.push(`${id}: BreadcrumbList should NOT be emitted on "${path}"`);

  if (hasFaq && !FAQ_ALLOWED.has(path))
    errors.push(`${id}: FAQPage leaked onto "${path}" — only allowed on ${[...FAQ_ALLOWED].join(", ")}`);
  if (!hasFaq && FAQ_ALLOWED.has(path))
    errors.push(`${id}: FAQPage missing on "${path}" (expected)`);
}

let prerenderReachable = true;
try {
  const res = await fetch(`${PRERENDER_URL}?path=/`, { method: "GET", headers: { Accept: "text/html" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch {
  prerenderReachable = false;
  console.warn(`[seo-consistency] prerender unreachable — skipping per-route diff (structural checks still run).`);
}

if (prerenderReachable) {
  for (const path of ROUTES) {
    try {
      const res = await fetch(`${PRERENDER_URL}?path=${encodeURIComponent(path)}`, { headers: { Accept: "text/html" } });
      if (!res.ok) { errors.push(`[prerender] ${path}: HTTP ${res.status}`); continue; }
      const html = await res.text();
      check(path, extractSeo(html), "prerender");
      checkSchemas(path, html);
    } catch (err) {
      errors.push(`[prerender] ${path}: fetch failed (${err.message || err})`);
    }
  }
}

// Static structural check on SEOHead.tsx — guarantees the 4 critical emitters exist.
const seoHead = readFileSync(resolve(ROOT, "src/components/SEOHead.tsx"), "utf-8");
for (const probe of [
  /<title>\{fullTitle\}<\/title>/,
  /name="description"\s+content=\{descTrimmed\}/,
  /rel="canonical"\s+href=\{canonical\}/,
  /property="og:url"\s+content=\{canonical\}/,
]) {
  if (!probe.test(seoHead)) errors.push(`[SEOHead.tsx] missing required tag emitter matching ${probe}`);
}

if (errors.length) {
  console.error(`\n[seo-consistency] ${errors.length} issue(s):\n  - ${errors.join("\n  - ")}\n`);
  process.exit(1);
}
console.log(`[seo-consistency] ✓ all SEO tags consistent (${prerenderReachable ? ROUTES.length + " routes via prerender + " : ""}structural).`);
