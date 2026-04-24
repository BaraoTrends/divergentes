import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_URL = "https://neurorotina.com";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/buscar", priority: "0.6", changefreq: "weekly" },
  { path: "/tdah", priority: "0.8", changefreq: "weekly" },
  { path: "/tea", priority: "0.8", changefreq: "weekly" },
  { path: "/dislexia", priority: "0.8", changefreq: "weekly" },
  { path: "/altas-habilidades", priority: "0.8", changefreq: "weekly" },
  { path: "/toc", priority: "0.8", changefreq: "weekly" },
  { path: "/perguntas-frequentes", priority: "0.7", changefreq: "monthly" },
  { path: "/glossario", priority: "0.6", changefreq: "monthly" },
  { path: "/sobre", priority: "0.5", changefreq: "yearly" },
  { path: "/contato", priority: "0.4", changefreq: "yearly" },
  { path: "/termos-de-uso", priority: "0.3", changefreq: "yearly" },
  { path: "/politica-de-privacidade", priority: "0.3", changefreq: "yearly" },
];

// Slugs allowed for indexable articles. Mirrors src/lib/keywords.ts CATEGORY_KEYWORDS.
const VALID_CATEGORY_SLUGS = new Set(["tdah", "tea", "dislexia", "altas-habilidades", "toc"]);
const VALID_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/**
 * Article priority: recency-aware so newer/featured articles surface first.
 *  - featured                       → 0.9
 *  - updated within last 7 days     → 0.85
 *  - updated within last 30 days    → 0.8
 *  - updated within last 180 days   → 0.7
 *  - older                          → 0.6
 */
function articlePriority(article: { updated_at: string; featured?: boolean }): string {
  if (article.featured) return "0.9";
  const ageMs = Date.now() - new Date(article.updated_at).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (ageMs <= 7 * day) return "0.85";
  if (ageMs <= 30 * day) return "0.80";
  if (ageMs <= 180 * day) return "0.70";
  return "0.60";
}

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: rawArticles } = await supabase
      .from("articles")
      .select("slug, title, updated_at, image_url, excerpt, category, featured, published")
      .eq("published", true)
      .order("updated_at", { ascending: false });

    // Filter: only published + valid slug + on-schema category. Drafts and
    // off-schema content NEVER make it into the sitemap (would emit canonicals
    // for pages that intentionally lack <meta keywords>).
    const articles = (rawArticles || []).filter(
      (a) =>
        a.published === true &&
        typeof a.slug === "string" &&
        VALID_SLUG_RE.test(a.slug) &&
        typeof a.category === "string" &&
        VALID_CATEGORY_SLUGS.has(a.category),
    );

    const latestArticleDate = articles[0]?.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    // Per-category latest date so each hub's lastmod tracks its own newest article.
    const categoryLastmod = new Map<string, string>();
    for (const a of articles) {
      const d = a.updated_at.split("T")[0];
      if (!categoryLastmod.has(a.category)) categoryLastmod.set(a.category, d);
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

    for (const page of STATIC_PAGES) {
      let lastmod = today;
      if (page.path === "/blog") {
        lastmod = latestArticleDate;
      } else if (VALID_CATEGORY_SLUGS.has(page.path.replace(/^\//, ""))) {
        const slug = page.path.replace(/^\//, "");
        lastmod = categoryLastmod.get(slug) || latestArticleDate;
      }

      xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    for (const article of articles) {
      const lastmod = article.updated_at.split("T")[0];
      const articleDate = new Date(article.updated_at);
      const priority = articlePriority(article);

      xml += `  <url>
    <loc>${SITE_URL}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>`;

      if (article.image_url) {
        xml += `
    <image:image>
      <image:loc>${escapeXml(article.image_url)}</image:loc>
      <image:title>${escapeXml(article.title)}</image:title>
    </image:image>`;
      }

      // Google News: only articles published in last 2 days qualify.
      if (articleDate >= twoDaysAgo) {
        xml += `
    <news:news>
      <news:publication>
        <news:name>Neuro Rotina</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${article.updated_at}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>`;
      }

      xml += `
  </url>
`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("sitemap error:", e);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
