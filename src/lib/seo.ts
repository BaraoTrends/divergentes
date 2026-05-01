export const SITE_URL = "https://neurorotina.com";
export const SITE_NAME = "Neuro Rotina";
export const SITE_DESCRIPTION = "Guia completo sobre TDAH, Autismo (TEA), Dislexia, Altas Habilidades e TOC. Artigos baseados em evidências, glossário e recursos para famílias brasileiras.";

export interface SEOData {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  article?: {
    datePublished: string;
    dateModified: string;
    author: string;
    category: string;
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
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
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      "https://instagram.com/neurodivergencias",
      "https://twitter.com/neurodiv_br",
    ],
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
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

/**
 * Map our internal categories to schema.org / Wikidata entities.
 * This powers the `about` property of Article schema, which LLMs
 * (ChatGPT, Perplexity, Claude, Gemini) use to ground citations.
 */
export const CATEGORY_ENTITIES: Record<string, { name: string; sameAs: string[] }> = {
  TDAH: {
    name: "Transtorno do Déficit de Atenção com Hiperatividade",
    sameAs: [
      "https://pt.wikipedia.org/wiki/Transtorno_do_d%C3%A9ficit_de_aten%C3%A7%C3%A3o_com_hiperatividade",
      "https://www.wikidata.org/wiki/Q181923",
    ],
  },
  TEA: {
    name: "Transtorno do Espectro Autista",
    sameAs: [
      "https://pt.wikipedia.org/wiki/Transtorno_do_espectro_autista",
      "https://www.wikidata.org/wiki/Q38404",
    ],
  },
  Dislexia: {
    name: "Dislexia",
    sameAs: [
      "https://pt.wikipedia.org/wiki/Dislexia",
      "https://www.wikidata.org/wiki/Q170518",
    ],
  },
  "Altas Habilidades": {
    name: "Altas Habilidades / Superdotação",
    sameAs: [
      "https://pt.wikipedia.org/wiki/Superdota%C3%A7%C3%A3o",
      "https://www.wikidata.org/wiki/Q733312",
    ],
  },
  TOC: {
    name: "Transtorno Obsessivo-Compulsivo",
    sameAs: [
      "https://pt.wikipedia.org/wiki/Transtorno_obsessivo-compulsivo",
      "https://www.wikidata.org/wiki/Q177719",
    ],
  },
};

export function generateArticleSchema(data: {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: string;
  authorUrl?: string;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
  tldr?: string;
}) {
  const absoluteUrl = `${SITE_URL}${data.url}`;
  // image as ImageObject (Google rich results prefer structured)
  const imageObj = {
    "@type": "ImageObject",
    url: data.image,
    width: 1200,
    height: 630,
  };
  const author = {
    "@type": "Person",
    name: data.author,
    ...(data.authorUrl ? { url: data.authorUrl } : { url: `${SITE_URL}/sobre` }),
  };
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: data.title.slice(0, 110), // Google truncates >110
    description: data.description,
    image: imageObj,
    url: absoluteUrl,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    inLanguage: "pt-BR",
    author,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl },
    // GEO/AEO: SpeakableSpecification helps voice assistants & LLMs
    // identify the most extractable parts of the page.
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "[data-tldr]", "[data-faq-answer]"],
    },
  };
  // GEO: ground the article to a known entity (Wikipedia/Wikidata)
  if (data.articleSection && CATEGORY_ENTITIES[data.articleSection]) {
    const entity = CATEGORY_ENTITIES[data.articleSection];
    schema.about = {
      "@type": "Thing",
      name: entity.name,
      sameAs: entity.sameAs,
    };
  }
  // AEO: short, model-friendly summary at the top of the schema
  if (data.tldr && data.tldr.trim().length > 0) {
    schema.abstract = data.tldr.trim();
  }
  if (data.keywords && data.keywords.length > 0) {
    // Schema.org spec: comma-separated string. Mirror the EXACT formatting we
    // ship in <meta name="keywords"> so crawlers see one consistent list.
    schema.keywords = data.keywords.join(", ");
  }
  if (data.articleSection) {
    schema.articleSection = data.articleSection;
  }
  if (data.wordCount && data.wordCount > 0) {
    schema.wordCount = data.wordCount;
  }
  return schema;
}

/**
 * GEO/AEO: build a TL;DR / direct-answer summary from the article excerpt
 * or the first meaningful paragraph. LLMs (ChatGPT, Perplexity, Claude)
 * heavily favor short, self-contained summaries when citing sources.
 */
export function buildTLDR(excerpt: string, content: string, maxLen = 320): string {
  const stripTags = (s: string) =>
    s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  let base = (excerpt || "").trim();
  if (base.length < 80) {
    const firstP = content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    if (firstP) base = stripTags(firstP[1]);
    else base = stripTags(content).slice(0, maxLen);
  }
  if (base.length > maxLen) base = base.slice(0, maxLen - 1).trimEnd() + "…";
  return base;
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export interface HowToStep {
  name: string;
  text?: string;
  image?: string;
  url?: string;
}

export function generateHowToSchema(data: {
  name: string;
  description?: string;
  image?: string;
  totalTime?: string;
  steps: HowToStep[];
  pageUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.name,
    ...(data.description ? { description: data.description } : {}),
    ...(data.image ? { image: data.image } : {}),
    ...(data.totalTime ? { totalTime: data.totalTime } : {}),
    inLanguage: "pt-BR",
    step: data.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      ...(s.text ? { text: s.text } : {}),
      ...(s.image ? { image: s.image } : {}),
      url: s.url || `${data.pageUrl}#step-${i + 1}`,
    })),
  };
}

/**
 * Detect Q&A blocks in article HTML.
 * Patterns recognized:
 *  - <h2>/<h3> ending with "?" followed by paragraph(s) → Q&A pair
 *  - <strong>Pergunta?</strong> followed by text → Q&A pair (bolded inline questions)
 * Returns sanitized plain-text pairs (HTML stripped from answers).
 */
export function extractFAQsFromHtml(html: string): { question: string; answer: string }[] {
  if (!html || typeof html !== "string") return [];
  const faqs: { question: string; answer: string }[] = [];
  const stripTags = (s: string) =>
    s
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();

  // Pattern 1: heading-based Q&A (<h2>...?</h2><p>...</p>)
  const headingRe = /<(h[2-4])[^>]*>([\s\S]*?)<\/\1>\s*([\s\S]*?)(?=<h[2-4]\b|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(html)) !== null) {
    const question = stripTags(m[2]);
    if (!question.endsWith("?") || question.length < 8 || question.length > 200) continue;
    // Take the immediate paragraph(s) up to next heading
    const block = m[3];
    const pMatch = block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi);
    if (!pMatch) continue;
    const answer = stripTags(pMatch.slice(0, 2).join(" "));
    if (answer.length < 20) continue;
    faqs.push({ question, answer: answer.slice(0, 1000) });
  }

  // De-duplicate by question
  const seen = new Set<string>();
  return faqs.filter((f) => {
    const k = f.question.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 10);
}

