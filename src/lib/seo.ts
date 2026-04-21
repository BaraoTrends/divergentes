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
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/busca?q={search_term_string}`,
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

export function generateArticleSchema(data: {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: string;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
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
  if (data.keywords && data.keywords.length > 0) {
    schema.keywords = data.keywords;
  }
  if (data.articleSection) {
    schema.articleSection = data.articleSection;
  }
  if (data.wordCount && data.wordCount > 0) {
    schema.wordCount = data.wordCount;
  }
  return schema;
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
