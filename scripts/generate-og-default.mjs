#!/usr/bin/env node
/**
 * Generates /public/og-default.jpg (1200x630) from theme colors in src/index.css.
 *
 * - Parses HSL tokens (--background, --primary, --accent, category colors)
 * - Composes a textless SVG with a soft gradient + abstract shapes
 * - Rasterizes to JPG via sharp
 * - Versions the file: writes a content hash to /public/og-default.version.json
 *   so we can detect drift and skip regeneration when nothing changed.
 *
 * Usage: node scripts/generate-og-default.mjs [--force]
 * Runs automatically as part of `npm run build` (see prebuild step).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CSS_PATH = resolve(ROOT, "src/index.css");
const OUT_IMG = resolve(ROOT, "public/og-default.jpg");
const OUT_VER = resolve(ROOT, "public/og-default.version.json");

const WIDTH = 1200;
const HEIGHT = 630;

const FORCE = process.argv.includes("--force");

// ---------- Parse theme tokens (only the :root / light block) ----------

function parseTokens(css) {
  // Capture the FIRST :root { ... } block (light theme).
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootMatch) throw new Error("Could not find :root block in index.css");
  const block = rootMatch[1];
  const tokens = {};
  const re = /--([a-z0-9-]+)\s*:\s*([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%\s*;/gi;
  let m;
  while ((m = re.exec(block))) {
    tokens[m[1]] = { h: +m[2], s: +m[3], l: +m[4] };
  }
  return tokens;
}

const hsl = (t, alpha = 1) =>
  alpha === 1
    ? `hsl(${t.h} ${t.s}% ${t.l}%)`
    : `hsla(${t.h} ${t.s}% ${t.l}% / ${alpha})`;

// ---------- Build SVG (textless, theme-driven) ----------

function buildSvg(tokens) {
  const bg = tokens["background"] ?? { h: 40, s: 20, l: 96 };
  const accent = tokens["accent"] ?? { h: 28, s: 15, l: 85 };
  const primary = tokens["primary"] ?? { h: 30, s: 8, l: 35 };
  const tdah = tokens["cat-tdah"] ?? { h: 25, s: 70, l: 55 };
  const tea = tokens["cat-tea"] ?? { h: 200, s: 55, l: 50 };
  const dislex = tokens["cat-dislexia"] ?? { h: 280, s: 40, l: 55 };
  const ah = tokens["cat-ah"] ?? { h: 150, s: 45, l: 45 };
  const toc = tokens["cat-toc"] ?? { h: 340, s: 50, l: 55 };

  // Slightly darker top corner of bg for diagonal gradient
  const bgDark = { ...bg, l: Math.max(0, bg.l - 6) };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${hsl(bg)}"/>
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

  <!-- Base -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>

  <!-- Five overlapping translucent circles, one per neurodivergence category -->
  <g filter="url(#soft)" opacity="0.85">
    <circle cx="820"  cy="200" r="180" fill="${hsl(tdah, 0.45)}"/>
    <circle cx="970"  cy="360" r="155" fill="${hsl(tea, 0.45)}"/>
    <circle cx="700"  cy="430" r="165" fill="${hsl(dislex, 0.4)}"/>
    <circle cx="1060" cy="180" r="120" fill="${hsl(ah, 0.45)}"/>
    <circle cx="880"  cy="510" r="135" fill="${hsl(toc, 0.4)}"/>
  </g>

  <!-- Quiet geometric anchor: thin frame + corner mark -->
  <rect x="48" y="48" width="${WIDTH - 96}" height="${HEIGHT - 96}"
        fill="none" stroke="${hsl(primary, 0.18)}" stroke-width="1.5"/>
  <line x1="48" y1="${HEIGHT - 110}" x2="240" y2="${HEIGHT - 110}"
        stroke="${hsl(primary, 0.5)}" stroke-width="2"/>
</svg>`;
}

// ---------- Hash & version ----------

function computeHash(input) {
  return createHash("sha256").update(input).digest("hex").slice(0, 12);
}

function readPrevHash() {
  if (!existsSync(OUT_VER)) return null;
  try {
    return JSON.parse(readFileSync(OUT_VER, "utf-8")).hash ?? null;
  } catch {
    return null;
  }
}

// ---------- Main ----------

async function main() {
  const css = readFileSync(CSS_PATH, "utf-8");
  const tokens = parseTokens(css);
  const svg = buildSvg(tokens);

  // Hash inputs (CSS tokens snapshot + svg recipe) so we regenerate only on change.
  const tokensSnapshot = JSON.stringify(tokens);
  const hash = computeHash(tokensSnapshot + svg);
  const prevHash = readPrevHash();

  const imgExists = existsSync(OUT_IMG);
  if (!FORCE && imgExists && prevHash === hash) {
    console.log(`[og-default] up-to-date (hash ${hash})`);
    return;
  }

  if (!existsSync(dirname(OUT_IMG))) mkdirSync(dirname(OUT_IMG), { recursive: true });

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 88, progressive: true, mozjpeg: true })
    .toFile(OUT_IMG);

  writeFileSync(
    OUT_VER,
    JSON.stringify(
      {
        hash,
        generatedAt: new Date().toISOString(),
        width: WIDTH,
        height: HEIGHT,
        source: "src/index.css",
      },
      null,
      2
    ) + "\n"
  );

  console.log(
    `[og-default] regenerated → ${OUT_IMG} (hash ${prevHash ?? "∅"} → ${hash})`
  );
}

main().catch((err) => {
  console.error("[og-default] failed:", err);
  process.exit(1);
});
