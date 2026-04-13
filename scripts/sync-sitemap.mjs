import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");
const sitemapPath = path.join(publicDir, "sitemap.xml");

const fallbackFunctionUrl = "https://wmdjjvjmwvsceqbcmksb.supabase.co/functions/v1/sitemap";
const sitemapUrl = process.env.SITEMAP_FUNCTION_URL
  || (process.env.VITE_SUPABASE_URL ? `${process.env.VITE_SUPABASE_URL}/functions/v1/sitemap` : fallbackFunctionUrl);

async function fileExists(filePath) {
  try {
    await readFile(filePath, "utf8");
    return true;
  } catch {
    return false;
  }
}

async function syncSitemap() {
  await mkdir(publicDir, { recursive: true });

  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        Accept: "application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();

    if (!xml.trim().startsWith("<?xml") || !xml.includes("<urlset")) {
      throw new Error("Resposta recebida não é um sitemap XML válido");
    }

    await writeFile(sitemapPath, xml, "utf8");
    console.log(`Sitemap sincronizado em ${sitemapPath}`);
  } catch (error) {
    if (await fileExists(sitemapPath)) {
      console.warn(`Falha ao sincronizar sitemap (${error instanceof Error ? error.message : String(error)}). Mantendo sitemap.xml existente.`);
      return;
    }

    throw error;
  }
}

await syncSitemap();