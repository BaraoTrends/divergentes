import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");

const fallbackFunctionUrl = "https://wmdjjvjmwvsceqbcmksb.supabase.co/functions/v1/sitemap";
const baseFunctionUrl = process.env.SITEMAP_FUNCTION_URL
  || (process.env.VITE_SUPABASE_URL ? `${process.env.VITE_SUPABASE_URL}/functions/v1/sitemap` : fallbackFunctionUrl);

// sitemap.xml is the index; the others are the leaf sub-sitemaps.
const SITEMAP_FILES = [
  { file: "sitemap.xml",            type: "index" },
  { file: "sitemap-pages.xml",      type: "pages" },
  { file: "sitemap-categories.xml", type: "categories" },
  { file: "sitemap-posts.xml",      type: "posts" },
  { file: "sitemap-news.xml",       type: "news" },
];

async function fileExists(filePath) {
  try { await readFile(filePath, "utf8"); return true; } catch { return false; }
}

async function fetchOne({ file, type }) {
  const dest = path.join(publicDir, file);
  const url = `${baseFunctionUrl}?type=${type}`;
  try {
    const response = await fetch(url, { headers: { Accept: "application/xml, text/xml;q=0.9, */*;q=0.8" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    if (!xml.trim().startsWith("<?xml")) throw new Error("Resposta recebida não é XML válido");
    if (type === "index" && !xml.includes("<sitemapindex")) throw new Error("Índice esperado mas resposta não contém <sitemapindex>");
    if (type !== "index" && !xml.includes("<urlset")) throw new Error("Sub-sitemap esperado mas resposta não contém <urlset>");
    await writeFile(dest, xml, "utf8");
    console.log(`✓ ${file} sincronizado`);
  } catch (error) {
    if (await fileExists(dest)) {
      console.warn(`Falha ao sincronizar ${file} (${error instanceof Error ? error.message : String(error)}). Mantendo arquivo existente.`);
      return;
    }
    throw error;
  }
}

async function syncSitemap() {
  await mkdir(publicDir, { recursive: true });
  for (const entry of SITEMAP_FILES) {
    await fetchOne(entry);
  }
}

await syncSitemap();
