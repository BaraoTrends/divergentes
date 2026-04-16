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
  article?: { datePublished: string; dateModified: string; author: string };
}): string {
  const rawTitle = opts.path === "/" ? `${SITE_NAME} — ${opts.title}` : `${opts.title} | ${SITE_NAME}`;
  const fullTitle = rawTitle.length > 60 ? opts.title : rawTitle;
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
  ${keywordsMeta}
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
  keywords?: string[]; articleSection?: string; wordCount?: number;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
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
      const contentHtml = isHtml ? article.content : markdownToHtml(article.content);
      const supabaseOgUrl = `${supabaseUrl}/functions/v1/og-image?slug=${encodeURIComponent(slug)}`;
      const image = article.image_url || supabaseOgUrl;
      const datePublished = article.created_at.split("T")[0];
      const dateModified = article.updated_at.split("T")[0];
      const author = "Equipe Neurodivergências";
      const plainContent = (isHtml ? contentHtml : article.content).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const wordCount = plainContent ? plainContent.split(/\s+/).filter(Boolean).length : 0;
      const articleKeywords = [
        ...(article.focus_keyword ? [article.focus_keyword] : []),
        ...(article.tags || []),
      ].filter(Boolean) as string[];

      return new Response(
        buildHtml({
          title: article.title,
          description: article.excerpt || "",
          path,
          image,
          type: "article",
          article: { datePublished, dateModified, author },
          keywords: articleKeywords,
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
              keywords: articleKeywords,
              articleSection: article.category,
              wordCount,
            }),
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
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
      return new Response(
        buildHtml({
          title: page.title,
          description: page.description,
          path,
          body: `
            <header><nav><a href="/">${SITE_NAME}</a></nav></header>
            <main>${page.body}</main>
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
