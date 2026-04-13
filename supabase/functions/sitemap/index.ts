import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_URL = "https://neurorotina.com";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/tdah", priority: "0.8", changefreq: "monthly" },
  { path: "/tea", priority: "0.8", changefreq: "monthly" },
  { path: "/dislexia", priority: "0.8", changefreq: "monthly" },
  { path: "/altas-habilidades", priority: "0.8", changefreq: "monthly" },
  { path: "/toc", priority: "0.8", changefreq: "monthly" },
  { path: "/perguntas-frequentes", priority: "0.7", changefreq: "monthly" },
  { path: "/glossario", priority: "0.6", changefreq: "monthly" },
  { path: "/sobre", priority: "0.5", changefreq: "yearly" },
  { path: "/contato", priority: "0.4", changefreq: "yearly" },
  { path: "/termos-de-uso", priority: "0.3", changefreq: "yearly" },
  { path: "/politica-de-privacidade", priority: "0.3", changefreq: "yearly" },
];

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: articles } = await supabase
      .from("articles")
      .select("slug, updated_at")
      .eq("published", true)
      .order("updated_at", { ascending: false });

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    for (const page of STATIC_PAGES) {
      xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    if (articles) {
      for (const article of articles) {
        const lastmod = article.updated_at.split("T")[0];
        xml += `  <url>
    <loc>${SITE_URL}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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
