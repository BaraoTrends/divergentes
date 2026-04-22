import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_URL = "https://neurorotina.com";
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

/**
 * Validate and sanitize an external image URL before exposing it to crawlers.
 * - Only http(s) allowed (https preferred — http upgraded silently to https for og:image:secure_url).
 * - Blocks javascript:, data:, file:, vbscript: and any non-URL value.
 * - Rejects URLs with embedded credentials (user:pass@host).
 * Returns null if the URL is unsafe — caller should fall back to a default OG image.
 */
function sanitizeImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Block obvious dangerous schemes early (case-insensitive, ignore whitespace).
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed.replace(/\s+/g, ""))) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (parsed.username || parsed.password) return null;
  // Force https output so og:image is always over secure transport.
  if (parsed.protocol === "http:") parsed.protocol = "https:";
  return parsed.toString();
}

/**
 * Pick the best OG image URL for a crawler.
 * Prefers a same-origin .webp variant when the image lives in /public,
 * since most modern social crawlers (Facebook, X, LinkedIn, Slack, Discord)
 * advertise WebP support. JPG remains the og:image fallback.
 */
function preferWebpVariant(url: string): string {
  // Only auto-promote known same-origin OG defaults shipped in /public.
  if (!url.startsWith(`${SITE_URL}/og-`)) return url;
  if (!url.endsWith(".jpg")) return url;
  return url.replace(/\.jpg$/, ".webp");
}

/**
 * Sanitize article HTML before serving it to bots.
 * Removes <script>, <style>, <iframe>, event handlers and javascript: URLs.
 * Keeps a safe subset of tags/attrs commonly used in articles.
 */
function sanitizeArticleHtml(html: string): string {
  if (!html) return "";
  let out = html;
  // Strip dangerous blocks entirely
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  out = out.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "");
  out = out.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
  out = out.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "");
  out = out.replace(/<embed\b[^>]*\/?>/gi, "");
  out = out.replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, "");
  // Strip inline event handlers (on*="...")
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");
  // Neutralize javascript:/data:text/html in href/src
  out = out.replace(/(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"');
  out = out.replace(/(href|src)\s*=\s*'\s*javascript:[^']*'/gi, "$1='#'");
  out = out.replace(/(href|src)\s*=\s*"\s*data:text\/html[^"]*"/gi, '$1="#"');
  // Remove HTML comments
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  return out;
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
  keywords?: string[];
  article?: { datePublished: string; dateModified: string; author: string; section?: string };
}): string {
  const rawTitle = opts.path === "/" ? `${SITE_NAME} — ${opts.title}` : `${opts.title} | ${SITE_NAME}`;
  const fullTitle = rawTitle.length > 60 ? opts.title : rawTitle;
  const canonical = `${SITE_URL}${opts.path}`;

  // Sanitize → fall back to default. Default is also normalized through the same path.
  const safeImage = sanitizeImageUrl(opts.image) || `${SITE_URL}/og-default.jpg`;
  const ogImage = safeImage;
  const ogImageWebp = preferWebpVariant(safeImage);

  const desc = opts.description.length > 160 ? opts.description.slice(0, 157) + "..." : opts.description;
  const ogType = opts.type || "website";

  const schemaScripts = (opts.schemas || [])
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n");

  const keywordsMeta = opts.keywords && opts.keywords.length > 0
    ? `<meta name="keywords" content="${escapeHtml(opts.keywords.join(", "))}" />`
    : "";

  const articleMeta = opts.article
    ? `<meta property="article:published_time" content="${opts.article.datePublished}" />
       <meta property="article:modified_time" content="${opts.article.dateModified}" />
       <meta property="article:author" content="${escapeHtml(opts.article.author)}" />
       ${opts.article.section ? `<meta property="article:section" content="${escapeHtml(opts.article.section)}" />` : ""}
       ${(opts.keywords || []).map((k) => `<meta property="article:tag" content="${escapeHtml(k)}" />`).join("\n       ")}`
    : "";

  // When a WebP variant is available we advertise it FIRST as og:image (most
  // modern crawlers honor whichever appears first / use the secure_url variant).
  // The JPG remains as a guaranteed fallback for older crawlers.
  const hasWebp = ogImageWebp !== ogImage;
  const ogImagePrimary = hasWebp ? ogImageWebp : ogImage;
  const ogImageFallback = ogImage;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="${opts.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"}" />
  ${keywordsMeta}
  <meta property="og:title" content="${escapeHtml(fullTitle)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:image" content="${ogImagePrimary}" />
  <meta property="og:image:secure_url" content="${ogImagePrimary}" />
  <meta property="og:image:type" content="${hasWebp ? "image/webp" : "image/jpeg"}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(opts.title)}" />
  ${hasWebp ? `<meta property="og:image" content="${ogImageFallback}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(opts.title)}" />` : ""}
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="pt_BR" />
  ${articleMeta}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="${ogImageFallback}" />
  <meta name="twitter:image:alt" content="${escapeHtml(opts.title)}" />

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
  keywords?: string[]; articleSection?: string; wordCount?: number;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: data.title,
    description: data.description,
    image: data.image,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    inLanguage: "pt-BR",
    author: { "@type": "Person", name: data.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${data.url}` },
  };
  if (data.keywords && data.keywords.length > 0) schema.keywords = data.keywords;
  if (data.articleSection) schema.articleSection = data.articleSection;
  if (data.wordCount && data.wordCount > 0) schema.wordCount = data.wordCount;
  return schema;
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
          title: "Informação sobre neurodivergências",
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
          title: cat.shortName,
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
      const rawContentHtml = isHtml ? article.content : markdownToHtml(article.content);
      const contentHtml = sanitizeArticleHtml(rawContentHtml);
      const supabaseOgUrl = `${supabaseUrl}/functions/v1/og-image?slug=${encodeURIComponent(slug)}`;
      // Sanitize the article's image_url before falling back. If unsafe, use the
      // category-themed default OG (auto-generated, textless, 1200x630).
      const safeArticleImage = sanitizeImageUrl(article.image_url);
      const themedDefault = `${SITE_URL}/og-${article.category}.jpg`;
      const image = safeArticleImage || supabaseOgUrl || themedDefault;
      const bodyImage = safeArticleImage; // only render <img> in body if URL is safe
      const datePublished = article.created_at.split("T")[0];
      const dateModified = article.updated_at.split("T")[0];
      const author = "Equipe Neurodivergências";
      const plainContent = stripHtml(contentHtml);
      const wordCount = plainContent ? plainContent.split(/\s+/).filter(Boolean).length : 0;
      const articleKeywords = [
        ...(article.focus_keyword ? [article.focus_keyword] : []),
        ...(article.tags || []),
      ].filter(Boolean) as string[];
      const categoryShortName = CATEGORIES[article.category]?.shortName || article.category;

      return new Response(
        buildHtml({
          title: article.title,
          description: article.excerpt || "",
          path,
          image,
          type: "article",
          article: { datePublished, dateModified, author, section: categoryShortName },
          keywords: articleKeywords,
          body: `
            <header><nav><a href="/">${SITE_NAME}</a> &rsaquo; <a href="/blog">Blog</a></nav></header>
            <main>
              <article>
                <h1>${escapeHtml(article.title)}</h1>
                <p>Por ${escapeHtml(author)} &bull; ${datePublished} &bull; ${article.read_time} min de leitura</p>
                ${bodyImage ? `<img src="${escapeHtml(bodyImage)}" alt="${escapeHtml(article.title)}" width="1200" height="672" loading="eager" fetchpriority="high" decoding="async" />` : ""}
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
              keywords: articleKeywords,
              articleSection: article.category,
              wordCount,
            }),
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
      );
    }

    // SEARCH PAGE — bots see a noindex shell + SearchAction-enabled WebSite schema.
    // Real search runs client-side from useArticles; we don't pre-resolve hits here
    // because the long-tail of /buscar?q=... URLs should not be indexed.
    if (path === "/buscar" || path.startsWith("/buscar?")) {
      const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESC,
        inLanguage: "pt-BR",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/buscar?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      };
      return new Response(
        buildHtml({
          title: "Buscar no site",
          description:
            "Busque por temas, sintomas ou termos relacionados a TDAH, TEA, Dislexia, Altas Habilidades, TOC e neurodivergências.",
          path: "/buscar",
          noindex: true,
          schemas: [
            websiteSchema,
            buildBreadcrumbSchema([
              { name: "Início", url: "/" },
              { name: "Buscar", url: "/buscar" },
            ]),
          ],
          body: `
            <header><nav><a href="/">${SITE_NAME}</a></nav></header>
            <main>
              <h1>Buscar no site</h1>
              <p>Procure por artigos, categorias, perguntas frequentes e termos do glossário.</p>
              <form role="search" action="/buscar" method="get">
                <label for="q">Termo de busca</label>
                <input id="q" name="q" type="search" placeholder="Ex.: TDAH em adultos" />
                <button type="submit">Buscar</button>
              </form>
            </main>
          `,
        }),
        { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=86400" } }
      );
    }

    // STATIC PAGES (FAQ, Glossário, Sobre, Contato)
    const staticPages: Record<string, { title: string; description: string; body: string }> = {
      "/perguntas-frequentes": {
        title: "Perguntas Frequentes",
        description: "Respostas para as dúvidas mais comuns sobre TDAH, TEA, Dislexia, Altas Habilidades e TOC.",
        body: `<h1>Perguntas Frequentes</h1>
          <p>Respostas claras e baseadas em evidências para as dúvidas mais comuns sobre neurodivergências.</p>
          <h2>O que são neurodivergências?</h2><p>Neurodivergência reconhece que os cérebros humanos funcionam de maneiras diferentes. TDAH, autismo (TEA), dislexia, altas habilidades e TOC são variações neurológicas da diversidade humana.</p>
          <h2>Neurodivergência é uma doença?</h2><p>Não. O paradigma da neurodiversidade entende essas condições como variações naturais do funcionamento cerebral.</p>
          <h2>Como saber se sou neurodivergente?</h2><p>A identificação requer avaliação profissional por psicólogos, neuropsicólogos, psiquiatras ou neurologistas.</p>
          <h2>TDAH tem cura?</h2><p>O TDAH não tem cura, pois é uma condição neurobiológica. Com tratamento adequado é possível ter uma vida plena e produtiva.</p>
          <h2>Qual a diferença entre autismo leve e severo?</h2><p>A classificação atual utiliza níveis de suporte (1, 2 e 3) em vez de termos como leve ou severo.</p>
          <h2>Dislexia afeta a inteligência?</h2><p>Não. A dislexia é uma dificuldade específica de aprendizagem que não está relacionada à inteligência.</p>`,
      },
      "/glossario": {
        title: "Glossário de Neurodivergências",
        description: "Glossário com os principais termos relacionados a neurodivergências: definições claras e acessíveis.",
        body: `<h1>Glossário de Neurodivergências</h1>
          <p>Termos importantes para entender o universo das neurodivergências.</p>
          <dl>
            <dt><strong>Neurodiversidade</strong></dt><dd>Conceito que reconhece a variação natural no funcionamento neurológico humano como parte da biodiversidade.</dd>
            <dt><strong>Neurodivergente</strong></dt><dd>Pessoa cujo funcionamento neurológico difere significativamente do padrão típico.</dd>
            <dt><strong>Neurotípico</strong></dt><dd>Pessoa cujo funcionamento neurológico se enquadra nos padrões considerados típicos.</dd>
            <dt><strong>Comorbidade</strong></dt><dd>Ocorrência simultânea de duas ou mais condições em uma mesma pessoa.</dd>
            <dt><strong>Hiperfoco</strong></dt><dd>Estado de concentração intensa e prolongada em uma atividade de interesse.</dd>
            <dt><strong>Stimming</strong></dt><dd>Comportamentos repetitivos de autoestimulação usados para autorregulação sensorial.</dd>
            <dt><strong>Masking</strong></dt><dd>Estratégia de esconder características neurodivergentes para se adequar às expectativas sociais.</dd>
            <dt><strong>Disfunção executiva</strong></dt><dd>Dificuldade em funções cerebrais de planejamento, organização e controle de impulsos.</dd>
          </dl>`,
      },
      "/sobre": {
        title: "Sobre",
        description: "Conheça o Neurodivergências: portal dedicado a informação acessível e confiável sobre neurodivergências para o público brasileiro.",
        body: `<h1>Sobre o projeto</h1>
          <p>O Neurodivergências nasceu da necessidade de oferecer informação acessível, confiável e em português brasileiro sobre as diversas formas de neurodiversidade.</p>
          <h2>Nossa missão</h2>
          <p>Democratizar o acesso à informação de qualidade sobre TDAH, Autismo (TEA), Dislexia, Altas Habilidades/Superdotação, TOC e outras condições neurodivergentes. Acreditamos que o conhecimento é o primeiro passo para a inclusão e o acolhimento.</p>
          <h2>Nossos valores</h2>
          <ul>
            <li><strong>Acessibilidade</strong> — conteúdo pensado para todos, incluindo pessoas neurodivergentes.</li>
            <li><strong>Base em evidências</strong> — informações fundamentadas em pesquisa científica atual.</li>
            <li><strong>Acolhimento</strong> — linguagem respeitosa e empática, sem julgamentos.</li>
            <li><strong>Inclusão</strong> — reconhecimento da neurodiversidade como parte da diversidade humana.</li>
          </ul>
          <h2>Aviso importante</h2>
          <p>Este site tem caráter exclusivamente informativo e educacional. O conteúdo não substitui avaliação, diagnóstico ou tratamento profissional.</p>`,
      },
      "/contato": {
        title: "Contato",
        description: "Entre em contato com a equipe do Neurodivergências. Envie dúvidas, sugestões ou colaborações.",
        body: `<h1>Contato</h1>
          <p>Tem alguma dúvida, sugestão ou quer colaborar com o projeto? Entre em contato conosco.</p>
          <p>O Neurodivergências é um projeto dedicado a oferecer informação acessível sobre TDAH, TEA, Dislexia, Altas Habilidades e TOC. Valorizamos o contato com nossos leitores e estamos sempre abertos a sugestões, correções e propostas de colaboração.</p>
          <p>Responderemos sua mensagem o mais breve possível. Agradecemos seu interesse em contribuir com a disseminação de informação de qualidade sobre neurodivergências no Brasil.</p>`,
      },
    };

    if (staticPages[path]) {
      const page = staticPages[path];
      const schemas: object[] = [
        buildBreadcrumbSchema([{ name: "Início", url: "/" }, { name: page.title, url: path }]),
      ];
      // Emit FAQPage JSON-LD ONLY on /perguntas-frequentes, derived from <h2>?</h2><p>…</p> pairs in the body.
      if (path === "/perguntas-frequentes") {
        const pairs: { question: string; answer: string }[] = [];
        const re = /<h2[^>]*>([\s\S]*?)<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(page.body)) !== null) {
          const q = stripHtml(m[1]);
          const a = stripHtml(m[2]);
          if (q.endsWith("?") && a.length >= 20) pairs.push({ question: q, answer: a });
        }
        if (pairs.length > 0) {
          schemas.push({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: pairs.map((p) => ({
              "@type": "Question",
              name: p.question,
              acceptedAnswer: { "@type": "Answer", text: p.answer },
            })),
          });
        }
      }
      return new Response(
        buildHtml({
          title: page.title,
          description: page.description,
          path,
          body: `
            <header><nav><a href="/">${SITE_NAME}</a></nav></header>
            <main>${page.body}</main>
          `,
          schemas,
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
