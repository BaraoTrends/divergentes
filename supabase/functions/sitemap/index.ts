import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_URL = "https://neurorotina.com";

/**
 * Sitemap architecture (Google-friendly):
 *
 *   /sitemap.xml                → sitemap INDEX (sitemapindex)
 *     ├── /sitemap-pages.xml         → static pages
 *     ├── /sitemap-categories.xml    → category hubs (/tdah, /tea, …)
 *     ├── /sitemap-posts.xml         → blog articles (with image:image)
 *     └── /sitemap-news.xml          → Google News (only last 48h)
 *
 * The edge function dispatches by `?type=` query param:
 *   ?type=index | pages | categories | posts | news
 * Default = index (so /functions/v1/sitemap and /sitemap.xml both return the index).
 *
 * The Cloudflare worker / static `public/sitemap.xml` proxy must rewrite
 * each sub-sitemap path to `?type=<name>` when calling this function.
 */

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/buscar", priority: "0.6", changefreq: "weekly" },
  { path: "/perguntas-frequentes", priority: "0.7", changefreq: "monthly" },
  { path: "/glossario", priority: "0.6", changefreq: "monthly" },
  { path: "/sobre", priority: "0.5", changefreq: "yearly" },
  { path: "/contato", priority: "0.4", changefreq: "yearly" },
  { path: "/termos-de-uso", priority: "0.3", changefreq: "yearly" },
  { path: "/politica-de-privacidade", priority: "0.3", changefreq: "yearly" },
];

const CATEGORY_PAGES = [
  { path: "/tdah", priority: "0.8", changefreq: "weekly" },
  { path: "/tea", priority: "0.8", changefreq: "weekly" },
  { path: "/dislexia", priority: "0.8", changefreq: "weekly" },
  { path: "/altas-habilidades", priority: "0.8", changefreq: "weekly" },
  { path: "/toc", priority: "0.8", changefreq: "weekly" },
];

// Slugs allowed for indexable articles. Mirrors src/lib/keywords.ts CATEGORY_KEYWORDS.
const VALID_CATEGORY_SLUGS = new Set(["tdah", "tea", "dislexia", "altas-habilidades", "toc"]);
const VALID_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const COMMON_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=300",
  "Access-Control-Allow-Origin": "*",
};

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function articlePriority(article: { updated_at: string; featured?: boolean }): string {
  if (article.featured) return "0.9";
  const ageMs = Date.now() - new Date(article.updated_at).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (ageMs <= 7 * day) return "0.85";
  if (ageMs <= 30 * day) return "0.80";
  if (ageMs <= 180 * day) return "0.70";
  return "0.60";
}

type Article = {
  slug: string;
  title: string;
  updated_at: string;
  image_url: string | null;
  excerpt: string | null;
  category: string;
  featured: boolean | null;
  published: boolean;
};

async function fetchArticles(supabase: ReturnType<typeof createClient>): Promise<Article[]> {
  const { data } = await supabase
    .from("articles")
    .select("slug, title, updated_at, image_url, excerpt, category, featured, published")
    .eq("published", true)
    .order("updated_at", { ascending: false });

  return ((data || []) as Article[]).filter(
    (a) =>
      a.published === true &&
      typeof a.slug === "string" &&
      VALID_SLUG_RE.test(a.slug) &&
      typeof a.category === "string" &&
      VALID_CATEGORY_SLUGS.has(a.category),
  );
}

function urlsetOpen(extraNs = ""): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${extraNs}>
`;
}

function buildPagesSitemap(latestArticleDate: string): string {
  const today = new Date().toISOString().split("T")[0];
  let xml = urlsetOpen();
  for (const page of STATIC_PAGES) {
    const lastmod = page.path === "/blog" ? latestArticleDate : today;
    xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }
  xml += `</urlset>`;
  return xml;
}

function buildCategoriesSitemap(categoryLastmod: Map<string, string>, latestArticleDate: string): string {
  let xml = urlsetOpen();
  for (const page of CATEGORY_PAGES) {
    const slug = page.path.replace(/^\//, "");
    const lastmod = categoryLastmod.get(slug) || latestArticleDate;
    xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }
  xml += `</urlset>`;
  return xml;
}

function buildPostsSitemap(articles: Article[]): string {
  let xml = urlsetOpen(`
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`);
  for (const article of articles) {
    const lastmod = article.updated_at.split("T")[0];
    xml += `  <url>
    <loc>${SITE_URL}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${articlePriority(article)}</priority>`;
    if (article.image_url) {
      xml += `
    <image:image>
      <image:loc>${escapeXml(article.image_url)}</image:loc>
      <image:title>${escapeXml(article.title)}</image:title>
    </image:image>`;
    }
    xml += `
  </url>
`;
  }
  xml += `</urlset>`;
  return xml;
}

function buildNewsSitemap(articles: Article[]): string {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const recent = articles.filter((a) => new Date(a.updated_at) >= twoDaysAgo);
  let xml = urlsetOpen(`
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"`);
  for (const article of recent) {
    xml += `  <url>
    <loc>${SITE_URL}/blog/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Neuro Rotina</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${article.updated_at}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>
  </url>
`;
  }
  xml += `</urlset>`;
  return xml;
}

function buildIndex(latestArticleDate: string): string {
  const today = new Date().toISOString().split("T")[0];
  const subs = [
    { loc: `${SITE_URL}/sitemap-pages.xml`, lastmod: today },
    { loc: `${SITE_URL}/sitemap-categories.xml`, lastmod: latestArticleDate },
    { loc: `${SITE_URL}/sitemap-posts.xml`, lastmod: latestArticleDate },
    { loc: `${SITE_URL}/sitemap-news.xml`, lastmod: latestArticleDate },
  ];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (const s of subs) {
    xml += `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>
`;
  }
  xml += `</sitemapindex>`;
  return xml;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    // Accept both ?type=posts and pathname-based hints (e.g. /sitemap-posts.xml).
    let type = (url.searchParams.get("type") || "").toLowerCase();
    if (!type) {
      const m = url.pathname.match(/sitemap-(pages|categories|posts|news)/i);
      if (m) type = m[1].toLowerCase();
    }
    if (!type) type = "index";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const articles = await fetchArticles(supabase);
    const latestArticleDate = articles[0]?.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0];

    const categoryLastmod = new Map<string, string>();
    for (const a of articles) {
      const d = a.updated_at.split("T")[0];
      if (!categoryLastmod.has(a.category)) categoryLastmod.set(a.category, d);
    }

    let xml: string;
    switch (type) {
      case "pages":      xml = buildPagesSitemap(latestArticleDate); break;
      case "categories": xml = buildCategoriesSitemap(categoryLastmod, latestArticleDate); break;
      case "posts":      xml = buildPostsSitemap(articles); break;
      case "news":       xml = buildNewsSitemap(articles); break;
      case "index":
      default:           xml = buildIndex(latestArticleDate); break;
    }

    return new Response(xml, { headers: COMMON_HEADERS });
  } catch (e) {
    console.error("sitemap error:", e);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
