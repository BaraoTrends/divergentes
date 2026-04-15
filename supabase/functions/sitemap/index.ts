import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_URL = "https://neurorotina.com";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
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

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: articles } = await supabase
      .from("articles")
      .select("slug, title, updated_at, image_url, excerpt")
      .eq("published", true)
      .order("updated_at", { ascending: false });

    // Use the most recent article date for dynamic pages, or today for static
    const latestArticleDate = articles?.[0]?.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

    for (const page of STATIC_PAGES) {
      // Blog and category pages use the latest article date; others use a fixed date
      const lastmod = ["/blog", "/tdah", "/tea", "/dislexia", "/altas-habilidades", "/toc"].includes(page.path)
        ? latestArticleDate
        : today;

      xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    if (articles) {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      for (const article of articles) {
        const lastmod = article.updated_at.split("T")[0];
        const articleDate = new Date(article.updated_at);

        xml += `  <url>
    <loc>${SITE_URL}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>`;

        // Add image sitemap data if article has an image
        if (article.image_url) {
          xml += `
    <image:image>
      <image:loc>${escapeXml(article.image_url)}</image:loc>
      <image:title>${escapeXml(article.title)}</image:title>
    </image:image>`;
        }

        // Add Google News sitemap for articles published in last 2 days
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
