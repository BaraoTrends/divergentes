#!/usr/bin/env node
/**
 * Generates Open Graph images from theme tokens in src/index.css.
 *
 * Outputs (in /public):
 *   - og-default.jpg / og-default.webp                (neutral, all 5 category circles)
 *   - og-tdah.jpg / .webp
 *   - og-tea.jpg / .webp
 *   - og-dislexia.jpg / .webp
 *   - og-altas-habilidades.jpg / .webp
 *   - og-toc.jpg / .webp
 *   - og-default.version.json                        (per-variant content hashes)
 *
 * - Parses :root HSL tokens with a robust line-by-line scan (order-independent).
 * - Builds a textless SVG and rasterizes to JPG (mozjpeg) + WebP via sharp.
 * - Hashes a canonicalized snapshot of the relevant tokens (sorted keys), so any
 *   change to a relevant HSL value triggers regeneration regardless of CSS order.
 * - Post-generation QA: asserts each output is exactly 1200x630 and contains no
 *   text-like high-density regions. Fails the build if any variant breaks.
 *
 * Usage: node scripts/generate-og-default.mjs [--force]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CSS_PATH = resolve(ROOT, "src/index.css");
const PUBLIC_DIR = resolve(ROOT, "public");
const OUT_VER = resolve(PUBLIC_DIR, "og-default.version.json");

const WIDTH = 1200;
const HEIGHT = 630;
const FORCE = process.argv.includes("--force");

// Tokens that influence the visual output. ANY change here = regenerate.
const RELEVANT_TOKENS = [
  "background",
  "accent",
  "primary",
  "cat-tdah",
  "cat-tea",
  "cat-dislexia",
  "cat-ah",
  "cat-toc",
];

// Variants to render. `featured` = which category color to amplify (or null = neutral).
const VARIANTS = [
  { name: "og-default", featured: null },
  { name: "og-tdah", featured: "cat-tdah" },
  { name: "og-tea", featured: "cat-tea" },
  { name: "og-dislexia", featured: "cat-dislexia" },
  { name: "og-altas-habilidades", featured: "cat-ah" },
  { name: "og-toc", featured: "cat-toc" },
];

// ---------- Robust :root token parser ----------

/**
 * Extract ONLY the first :root { ... } block (light theme). Order-independent:
 * we scan every `--name: H S% L%;` declaration regardless of position and
 * canonicalize the result by sorting keys before hashing.
 */
function parseTokens(css) {
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootMatch) throw new Error("Could not find :root block in src/index.css");
  const block = rootMatch[1];

  const tokens = {};
  // Match `--name: H S% L%;` allowing extra whitespace and decimals.
  const re = /--([a-z][a-z0-9-]*)\s*:\s*([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)%\s+([0-9]*\.?[0-9]+)%\s*;/gi;
  let m;
  while ((m = re.exec(block))) {
    tokens[m[1].toLowerCase()] = {
      h: +m[2],
      s: +m[3],
      l: +m[4],
    };
  }

  // Fail loudly if a relevant token is missing — better than silently bad output.
  const missing = RELEVANT_TOKENS.filter((k) => !tokens[k]);
  if (missing.length) {
    throw new Error(
      `[og-default] Missing required theme token(s) in :root → ${missing.join(", ")}`
    );
  }
  return tokens;
}

/**
 * Canonical, order-independent snapshot of relevant tokens for hashing.
 * Sorting the keys ensures CSS reordering doesn't change the hash.
 */
function canonicalSnapshot(tokens) {
  const subset = {};
  for (const k of [...RELEVANT_TOKENS].sort()) {
    const t = tokens[k];
    subset[k] = { h: round(t.h), s: round(t.s), l: round(t.l) };
  }
  return JSON.stringify(subset);
}
const round = (n) => Math.round(n * 100) / 100;

const hsl = (t, alpha = 1) =>
  alpha === 1
    ? `hsl(${t.h} ${t.s}% ${t.l}%)`
    : `hsla(${t.h} ${t.s}% ${t.l}% / ${alpha})`;

// ---------- SVG composer (textless, theme-driven) ----------

function buildSvg(tokens, featured) {
  const bg = tokens["background"];
  const accent = tokens["accent"];
  const primary = tokens["primary"];
  const tdah = tokens["cat-tdah"];
  const tea = tokens["cat-tea"];
  const dislex = tokens["cat-dislexia"];
  const ah = tokens["cat-ah"];
  const toc = tokens["cat-toc"];

  const bgDark = { ...bg, l: Math.max(0, bg.l - 6) };
  const featuredColor = featured ? tokens[featured] : null;

  // For category variants, soften background tint with a hint of the featured hue.
  const bgTinted = featuredColor
    ? { h: featuredColor.h, s: Math.min(20, featuredColor.s * 0.25), l: bg.l }
    : bg;

  // Scale alphas: featured circle is loud, others are quiet supporting accents.
  const alphaFor = (key, base) => {
    if (!featured) return base;
    return key === featured ? Math.min(0.85, base + 0.3) : Math.max(0.18, base - 0.18);
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${hsl(bgTinted)}"/>
      <stop offset="100%" stop-color="${hsl(bgDark)}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.18" cy="0.22" r="0.7">
      <stop offset="0%" stop-color="${hsl(accent, 0.55)}"/>
      <stop offset="100%" stop-color="${hsl(accent, 0)}"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.2"/>
    </filter>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>

  <g filter="url(#soft)">
    <circle cx="820"  cy="200" r="180" fill="${hsl(tdah,   alphaFor("cat-tdah",     0.45))}"/>
    <circle cx="970"  cy="360" r="155" fill="${hsl(tea,    alphaFor("cat-tea",      0.45))}"/>
    <circle cx="700"  cy="430" r="165" fill="${hsl(dislex, alphaFor("cat-dislexia", 0.40))}"/>
    <circle cx="1060" cy="180" r="120" fill="${hsl(ah,     alphaFor("cat-ah",       0.45))}"/>
    <circle cx="880"  cy="510" r="135" fill="${hsl(toc,    alphaFor("cat-toc",      0.40))}"/>
  </g>

  <rect x="48" y="48" width="${WIDTH - 96}" height="${HEIGHT - 96}"
        fill="none" stroke="${hsl(primary, 0.18)}" stroke-width="1.5"/>
  <line x1="48" y1="${HEIGHT - 110}" x2="240" y2="${HEIGHT - 110}"
        stroke="${hsl(primary, 0.5)}" stroke-width="2"/>
</svg>`;
}

// ---------- Rasterize ----------

async function rasterize(svg, baseName) {
  const buf = Buffer.from(svg);
  const jpgPath = resolve(PUBLIC_DIR, `${baseName}.jpg`);
  const webpPath = resolve(PUBLIC_DIR, `${baseName}.webp`);
  await sharp(buf).jpeg({ quality: 88, progressive: true, mozjpeg: true }).toFile(jpgPath);
  await sharp(buf).webp({ quality: 86, effort: 4 }).toFile(webpPath);
  return { jpgPath, webpPath };
}

// ---------- Post-generation QA ----------

/**
 * Asserts:
 *   1. Image is exactly 1200x630.
 *   2. Image is "textless" — no high-density edge regions that would indicate
 *      glyph strokes. Heuristic: downscale to small grayscale, run a Sobel-ish
 *      neighbor delta, and reject if too many high-contrast small features
 *      cluster (the signature of text).
 */
async function assertValidOgImage(filePath, label) {
  const meta = await sharp(filePath).metadata();
  if (meta.width !== WIDTH || meta.height !== HEIGHT) {
    throw new Error(
      `[og-default] ${label}: dimensions ${meta.width}x${meta.height} ≠ ${WIDTH}x${HEIGHT}`
    );
  }

  // Downscale to 200x105 grayscale for a cheap text-density probe.
  const W = 200;
  const H = 105;
  const { data } = await sharp(filePath)
    .resize(W, H, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Edge density: fraction of pixels with |Δ| > threshold to right + bottom neighbor.
  const EDGE_THRESHOLD = 35; // 0..255 grayscale delta
  let edgePixels = 0;
  let total = 0;
  for (let y = 0; y < H - 1; y++) {
    for (let x = 0; x < W - 1; x++) {
      const i = y * W + x;
      const c = data[i];
      const r = data[i + 1];
      const b = data[i + W];
      if (Math.abs(c - r) > EDGE_THRESHOLD || Math.abs(c - b) > EDGE_THRESHOLD) {
        edgePixels++;
      }
      total++;
    }
  }
  const density = edgePixels / total;

  // Our textless OG (gradient + soft circles) measures ~0.005-0.02 in tests.
  // A page full of text glyphs at this resolution sits well above 0.08.
  // We choose 0.06 as a generous ceiling that allows the soft circle edges
  // while catching anything resembling type.
  const MAX_EDGE_DENSITY = 0.06;
  if (density > MAX_EDGE_DENSITY) {
    throw new Error(
      `[og-default] ${label}: edge density ${density.toFixed(4)} > ${MAX_EDGE_DENSITY} ` +
      `— image likely contains text or unintended detail.`
    );
  }
  return { width: meta.width, height: meta.height, edgeDensity: round(density) };
}

// ---------- Version file ----------

function readPrevVersion() {
  if (!existsSync(OUT_VER)) return null;
  try {
    return JSON.parse(readFileSync(OUT_VER, "utf-8"));
  } catch {
    return null;
  }
}

// ---------- Main ----------

async function main() {
  const css = readFileSync(CSS_PATH, "utf-8");
  const tokens = parseTokens(css);

  if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

  const prev = readPrevVersion();
  const variants = {};
  let regenerated = 0;

  for (const v of VARIANTS) {
    const svg = buildSvg(tokens, v.featured);
    const snapshot = canonicalSnapshot(tokens) + `|featured=${v.featured ?? "none"}`;
    const hash = createHash("sha256").update(snapshot + svg).digest("hex").slice(0, 12);

    const jpgPath = resolve(PUBLIC_DIR, `${v.name}.jpg`);
    const webpPath = resolve(PUBLIC_DIR, `${v.name}.webp`);
    const prevHash = prev?.variants?.[v.name]?.hash;
    const upToDate =
      !FORCE && prevHash === hash && existsSync(jpgPath) && existsSync(webpPath);

    if (upToDate) {
      console.log(`[og-default] ${v.name}: up-to-date (${hash})`);
    } else {
      await rasterize(svg, v.name);
      regenerated++;
      console.log(
        `[og-default] ${v.name}: regenerated (${prevHash ?? "∅"} → ${hash})`
      );
    }

    // QA EVERY variant on every run (fast; catches drift even when not regenerated).
    const qaJpg = await assertValidOgImage(jpgPath, `${v.name}.jpg`);
    const qaWebp = await assertValidOgImage(webpPath, `${v.name}.webp`);

    variants[v.name] = {
      hash,
      featured: v.featured,
      qa: { jpg: qaJpg, webp: qaWebp },
    };
  }

  writeFileSync(
    OUT_VER,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        width: WIDTH,
        height: HEIGHT,
        source: "src/index.css",
        relevantTokens: RELEVANT_TOKENS,
        variants,
      },
      null,
      2
    ) + "\n"
  );

  console.log(
    `[og-default] done: ${regenerated} regenerated, ${VARIANTS.length - regenerated} cached, all QA passed`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
