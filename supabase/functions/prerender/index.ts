import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_URL = "https://neurodivergencias.com.br";
const SITE_NAME = "Neurodivergências";
const SITE_DESC = "Portal informativo sobre neurodivergências: TDAH, TEA, Dislexia, Altas Habilidades, TOC e mais.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES: Record<string, { name: string; shortName: string; description: string; icon: string }> = {
  tdah: { name: "Transtorno de Déficit de Atenção e Hiperatividade", shortName: "TDAH", description: "Entenda o TDAH: sintomas, diagnóstico, tratamento e como conviver com o transtorno no dia a dia.", icon: "⚡" },
  tea: { name: "Transtorno do Espectro Autista", shortName: "TEA", description: "Informações sobre o espectro autista: características, diagnóstico, intervenções e inclusão.", icon: "🧩" },
  dislexia: { name: "Dislexia", shortName: "Dislexia", description: "Saiba mais sobre dislexia: sinais, avaliação, estratégias de aprendizagem e apoio escolar.", icon: "📖" },
  "altas-habilidades": { name: "Altas Habilidades / Superdotação", shortName: "Altas Habilidades", description: "Descubra as características das altas habilidades, identificação precoce e enriquecimento educacional.", icon: "🌟" },
  toc: { name: "Transtorno Obsessivo-Compulsivo", shortName: "TOC", description: "Compreenda o TOC: obsessões, compulsões, tratamento e qualidade de vida.", icon: "🔄" },
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function buildHtml(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: string;
  body: string;
  noindex?: boolean;
  schemas?: object[];
  article?: { datePublished: string; dateModified: string; author: string };
}): string {
  const fullTitle = opts.path === "/" ? `${SITE_NAME} — ${opts.title}` : `${opts.title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}${opts.path}`;
  const ogImage = opts.image || `${SITE_URL}/og-default.jpg`;
  const desc = opts.description.length > 160 ? opts.description.slice(0, 157) + "..." : opts.description;
  const ogType = opts.type || "website";

  const schemaScripts = (opts.schemas || [])
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n");

  const articleMeta = opts.article
    ? `<meta property="article:published_time" content="${opts.article.datePublished}" />
       <meta property="article:modified_time" content="${opts.article.dateModified}" />
       <meta property="article:author" content="${escapeHtml(opts.article.author)}" />`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="${opts.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"}" />

  <meta property="og:title" content="${escapeHtml(fullTitle)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="pt_BR" />
  ${articleMeta}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="${ogImage}" />

  ${schemaScripts}
</head>
<body>
  ${opts.body}
  <noscript>
    <p>Este site funciona melhor com JavaScript habilitado. Visite <a href="${canonical}">${canonical}</a></p>
  </noscript>
</body>
</html>`;
}

function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

function buildArticleSchema(data: {
  title: string; description: string; url: string; image: string;
  datePublished: string; dateModified: string; author: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.description,
    image: data.image,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    author: { "@type": "Person", name: data.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${data.url}` },
  };
}

function buildOrgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  };
}

function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESC,
  };
}

// Convert markdown content to basic HTML for prerendering
function markdownToHtml(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("### ")) return `<h3>${escapeHtml(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith("## ")) return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith("- ")) return `<li>${escapeHtml(trimmed.slice(2))}</li>`;
      if (/^\d+\.\s/.test(trimmed)) return `<li>${escapeHtml(trimmed.replace(/^\d+\.\s/, ""))}</li>`;
      if (trimmed.startsWith("> ")) return `<blockquote>${escapeHtml(trimmed.slice(2))}</blockquote>`;
      if (trimmed === "---") return "<hr />";
      return `<p>${escapeHtml(trimmed)}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // HOME PAGE
    if (path === "/") {
      const { data: articles } = await supabase
        .from("articles")
        .select("slug, title, excerpt, category, created_at, image_url")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(6);

      const articleListHtml = (articles || [])
        .map((a) => `<article><h3><a href="/blog/${a.slug}">${escapeHtml(a.title)}</a></h3><p>${escapeHtml(a.excerpt || "")}</p></article>`)
        .join("\n");

      const categoriesHtml = Object.entries(CATEGORIES)
        .map(([slug, cat]) => `<section><h3><a href="/${slug}">${cat.icon} ${escapeHtml(cat.shortName)}</a></h3><p>${escapeHtml(cat.description)}</p></section>`)
        .join("\n");

      return new Response(
        buildHtml({
          title: "Informação acessível sobre neurodivergências",
          description: SITE_DESC,
          path: "/",
          body: `
            <header><nav><a href="/">${SITE_NAME}</a></nav></header>
            <main>
              <h1>Entendendo as neurodivergências</h1>
              <p>${SITE_DESC}</p>
              <h2>Explore por categoria</h2>
              ${categoriesHtml}
              <h2>Artigos recentes</h2>
              ${articleListHtml}
            </main>
          `,
          schemas: [buildWebSiteSchema(), buildOrgSchema()],
        }),
        { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
      );
    }

    // CATEGORY PAGES
    if (CATEGORIES[path.slice(1)]) {
      const slug = path.slice(1);
      const cat = CATEGORIES[slug];

      const { data: articles } = await supabase
        .from("articles")
        .select("slug, title, excerpt, created_at")
        .eq("published", true)
        .eq("category", slug)
        .order("created_at", { ascending: false })
        .limit(20);

      const articleListHtml = (articles || [])
        .map((a) => `<article><h3><a href="/blog/${a.slug}">${escapeHtml(a.title)}</a></h3><p>${escapeHtml(a.excerpt || "")}</p></article>`)
        .join("\n");

      return new Response(
        buildHtml({
          title: `${cat.shortName} — ${cat.name}`,
          description: cat.description,
          path,
          body: `
            <header><nav><a href="/">${SITE_NAME}</a></nav></header>
            <main>
              <h1>${escapeHtml(cat.name)}</h1>
              <p>${escapeHtml(cat.description)}</p>
              <h2>Artigos sobre ${escapeHtml(cat.shortName)}</h2>
              ${articleListHtml}
            </main>
          `,
          schemas: [buildBreadcrumbSchema([{ name: "Início", url: "/" }, { name: cat.shortName, url: path }])],
        }),
        { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
      );
    }

    // BLOG LISTING
    if (path === "/blog") {
      const { data: articles } = await supabase
        .from("articles")
        .select("slug, title, excerpt, category, created_at, image_url")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(50);

      const articleListHtml = (articles || [])
        .map((a) => `<article><h3><a href="/blog/${a.slug}">${escapeHtml(a.title)}</a></h3><p>${escapeHtml(a.excerpt || "")}</p><span>${a.category}</span></article>`)
        .join("\n");

      return new Response(
        buildHtml({
          title: "Blog — Artigos sobre Neurodivergências",
          description: "Artigos informativos sobre TDAH, TEA, Dislexia, Altas Habilidades, TOC e outras neurodivergências.",
          path: "/blog",
          body: `
            <header><nav><a href="/">${SITE_NAME}</a></nav></header>
            <main>
              <h1>Blog</h1>
              <p>Artigos informativos sobre neurodivergências.</p>
              ${articleListHtml}
            </main>
          `,
          schemas: [buildBreadcrumbSchema([{ name: "Início", url: "/" }, { name: "Blog", url: "/blog" }])],
        }),
        { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=1800, s-maxage=43200" } }
      );
    }

    // BLOG POST
    const blogMatch = path.match(/^\/blog\/(.+)$/);
    if (blogMatch) {
      const slug = blogMatch[1];
      const { data: article } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (!article) {
        return new Response(
          buildHtml({
            title: "Artigo não encontrado",
            description: "O artigo que você procura não foi encontrado.",
            path,
            noindex: true,
            body: `<main><h1>Artigo não encontrado</h1><p>Voltar ao <a href="/blog">blog</a>.</p></main>`,
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      const isHtml = /^<[a-z][\s\S]*>/i.test((article.content || "").trim());
      const contentHtml = isHtml ? article.content : markdownToHtml(article.content);
      const supabaseOgUrl = `${supabaseUrl}/functions/v1/og-image?slug=${encodeURIComponent(slug)}`;
      const image = article.image_url || supabaseOgUrl;
      const datePublished = article.created_at.split("T")[0];
      const dateModified = article.updated_at.split("T")[0];
      const author = "Equipe Neurodivergências";

      return new Response(
        buildHtml({
          title: article.title,
          description: article.excerpt || "",
          path,
          image,
          type: "article",
          article: { datePublished, dateModified, author },
          body: `
            <header><nav><a href="/">${SITE_NAME}</a> &rsaquo; <a href="/blog">Blog</a></nav></header>
            <main>
              <article>
                <h1>${escapeHtml(article.title)}</h1>
                <p>Por ${escapeHtml(author)} &bull; ${datePublished} &bull; ${article.read_time} min de leitura</p>
                ${article.image_url ? `<img src="${escapeHtml(article.image_url)}" alt="${escapeHtml(article.title)}" width="1200" height="672" />` : ""}
                <div>${contentHtml}</div>
              </article>
            </main>
          `,
          schemas: [
            buildBreadcrumbSchema([
              { name: "Início", url: "/" },
              { name: "Blog", url: "/blog" },
              { name: article.title, url: path },
            ]),
            buildArticleSchema({
              title: article.title,
              description: article.excerpt || "",
              url: path,
              image,
              datePublished,
              dateModified,
              author,
            }),
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
      );
    }

    // STATIC PAGES (FAQ, Glossário, Sobre, Contato)
    const staticPages: Record<string, { title: string; description: string }> = {
      "/perguntas-frequentes": { title: "Perguntas Frequentes sobre Neurodivergências", description: "Respostas para as dúvidas mais comuns sobre TDAH, TEA, Dislexia, Altas Habilidades e TOC." },
      "/glossario": { title: "Glossário de Neurodivergências", description: "Termos e definições importantes sobre neurodivergências." },
      "/sobre": { title: "Sobre o Neurodivergências", description: "Conheça o projeto Neurodivergências e nossa missão de levar informação acessível." },
      "/contato": { title: "Contato", description: "Entre em contato com a equipe do Neurodivergências." },
    };

    if (staticPages[path]) {
      const page = staticPages[path];
      return new Response(
        buildHtml({
          title: page.title,
          description: page.description,
          path,
          body: `
            <header><nav><a href="/">${SITE_NAME}</a></nav></header>
            <main><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p></main>
          `,
          schemas: [buildBreadcrumbSchema([{ name: "Início", url: "/" }, { name: page.title, url: path }])],
        }),
        { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=86400" } }
      );
    }

    // 404
    return new Response(
      buildHtml({
        title: "Página não encontrada",
        description: "A página que você procura não existe.",
        path,
        noindex: true,
        body: `<main><h1>Página não encontrada</h1><p>Voltar à <a href="/">página inicial</a>.</p></main>`,
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e) {
    console.error("prerender error:", e);
    return new Response("Error rendering page", { status: 500, headers: corsHeaders });
  }
});
