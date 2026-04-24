/**
 * Renders SEOHead with realistic article inputs and asserts the FINAL <head>
 * markup contains:
 *   - <meta name="keywords"> with the EXACT serializeKeywordsMeta() output
 *   - one <meta property="article:tag"> per normalized keyword
 *   - BreadcrumbList JSON-LD
 *   - BlogPosting JSON-LD with author/image/keywords
 *   - FAQPage JSON-LD when ≥2 Q&A pairs are detected in content
 *
 * This is the unit-test counterpart of scripts/validate-article-seo.ts —
 * together they guarantee client output and prerender output stay in lock-step.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import {
  buildArticleKeywords,
  serializeKeywordsMeta,
} from "@/lib/keywords";
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  extractFAQsFromHtml,
  SITE_URL,
} from "@/lib/seo";

const SAMPLE_ARTICLE = {
  slug: "como-identificar-tdah-adulto",
  title: "Como identificar TDAH em adulto: sinais, avaliação e próximos passos",
  excerpt:
    "Guia prático com sinais de TDAH em adultos, como buscar avaliação no Brasil e o que esperar do diagnóstico clínico.",
  category: "tdah",
  focus_keyword: "tdah adulto",
  tags: ["diagnóstico tdah", "sintomas tdah"],
  datePublished: "2026-01-12",
  dateModified: "2026-04-20",
  author: "Equipe Neurodivergências",
  imageUrl: "https://example.com/cover.jpg",
  // Two Q&A pairs → FAQPage schema must be emitted.
  contentHtml: `
    <h2>Quais são os sinais de TDAH em adultos?</h2>
    <p>Os sinais incluem desatenção persistente, dificuldade de organização e impulsividade. Esses sintomas precisam estar presentes desde a infância.</p>
    <h2>Como funciona a avaliação clínica no Brasil?</h2>
    <p>A avaliação envolve entrevista clínica detalhada, escalas validadas e descarte de diagnósticos diferenciais por um profissional especializado.</p>
  `,
};

function renderHead(children: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  // jsdom: ensure document.head is clean each test
  document.head.innerHTML = "";
});
afterEach(() => cleanup());

describe("Article SEO emission", () => {
  it("emits keywords matching serializeKeywordsMeta(buildArticleKeywords(...))", async () => {
    const expectedKeywords = buildArticleKeywords({
      focusKeyword: SAMPLE_ARTICLE.focus_keyword,
      tags: SAMPLE_ARTICLE.tags,
      category: SAMPLE_ARTICLE.category,
    });
    expect(expectedKeywords.length).toBeGreaterThan(0);
    const expectedSerialized = serializeKeywordsMeta(expectedKeywords);

    const breadcrumb = generateBreadcrumbSchema([
      { name: "Início", url: "/" },
      { name: "Blog", url: "/blog" },
      { name: SAMPLE_ARTICLE.title, url: `/blog/${SAMPLE_ARTICLE.slug}` },
    ]);
    const article = generateArticleSchema({
      title: SAMPLE_ARTICLE.title,
      description: SAMPLE_ARTICLE.excerpt,
      url: `/blog/${SAMPLE_ARTICLE.slug}`,
      image: SAMPLE_ARTICLE.imageUrl,
      datePublished: SAMPLE_ARTICLE.datePublished,
      dateModified: SAMPLE_ARTICLE.dateModified,
      author: SAMPLE_ARTICLE.author,
      keywords: expectedKeywords,
      articleSection: "TDAH",
      wordCount: 800,
    });
    const faqs = extractFAQsFromHtml(SAMPLE_ARTICLE.contentHtml);
    const schemas: object[] = [breadcrumb, article];
    if (faqs.length >= 2) schemas.push(generateFAQSchema(faqs));

    renderHead(
      <SEOHead
        title={SAMPLE_ARTICLE.title}
        description={SAMPLE_ARTICLE.excerpt}
        path={`/blog/${SAMPLE_ARTICLE.slug}`}
        image={SAMPLE_ARTICLE.imageUrl}
        type="article"
        schemas={schemas}
        keywords={expectedKeywords}
        article={{
          datePublished: SAMPLE_ARTICLE.datePublished,
          dateModified: SAMPLE_ARTICLE.dateModified,
          author: SAMPLE_ARTICLE.author,
          category: SAMPLE_ARTICLE.category,
        }}
      />,
    );

    // react-helmet-async writes async; flush microtasks.
    await new Promise((r) => setTimeout(r, 0));

    // 1. <meta name="keywords">
    const kwTag = document.head.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
    expect(kwTag, "meta[name=keywords] must be present").not.toBeNull();
    expect(kwTag!.content).toBe(expectedSerialized);

    // 2. article:tag — one per normalized keyword.
    const articleTagEls = document.head.querySelectorAll('meta[property="article:tag"]');
    expect(articleTagEls.length).toBe(expectedKeywords.length);
    const gotTags = Array.from(articleTagEls).map((el) => (el as HTMLMetaElement).content);
    expect(gotTags).toEqual(expectedKeywords);

    // 3. JSON-LD blocks.
    const ldNodes = Array.from(
      document.head.querySelectorAll('script[type="application/ld+json"]'),
    );
    const types = ldNodes.flatMap((n) => {
      try {
        const j = JSON.parse(n.textContent || "");
        return Array.isArray(j) ? j.map((x) => x["@type"]) : [j["@type"]];
      } catch { return []; }
    });
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("BlogPosting");
    expect(types).toContain("FAQPage");

    // 4. BlogPosting structure: author + image as objects, keywords as string.
    const blogPosting = ldNodes
      .map((n) => { try { return JSON.parse(n.textContent || ""); } catch { return null; } })
      .find((j) => j && j["@type"] === "BlogPosting");
    expect(blogPosting).toBeTruthy();
    expect(blogPosting.author).toMatchObject({ "@type": "Person", name: SAMPLE_ARTICLE.author });
    expect(blogPosting.image).toMatchObject({ "@type": "ImageObject", url: SAMPLE_ARTICLE.imageUrl });
    expect(typeof blogPosting.keywords).toBe("string");
    expect(blogPosting.keywords).toBe(expectedKeywords.join(", "));
    expect(blogPosting.url).toBe(`${SITE_URL}/blog/${SAMPLE_ARTICLE.slug}`);

    // 5. canonical === og:url
    const canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const ogUrl = document.head.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
    expect(canonical?.href).toBeTruthy();
    expect(canonical!.href).toBe(ogUrl!.content);
  });

  it("does NOT emit FAQPage when content has no Q&A pairs", async () => {
    const noFaqs = extractFAQsFromHtml("<p>Texto comum sem perguntas.</p>");
    expect(noFaqs.length).toBe(0);

    const expectedKeywords = buildArticleKeywords({
      focusKeyword: SAMPLE_ARTICLE.focus_keyword,
      tags: SAMPLE_ARTICLE.tags,
      category: SAMPLE_ARTICLE.category,
    });
    const breadcrumb = generateBreadcrumbSchema([
      { name: "Início", url: "/" },
      { name: "Blog", url: "/blog" },
      { name: SAMPLE_ARTICLE.title, url: `/blog/${SAMPLE_ARTICLE.slug}` },
    ]);
    const article = generateArticleSchema({
      title: SAMPLE_ARTICLE.title,
      description: SAMPLE_ARTICLE.excerpt,
      url: `/blog/${SAMPLE_ARTICLE.slug}`,
      image: SAMPLE_ARTICLE.imageUrl,
      datePublished: SAMPLE_ARTICLE.datePublished,
      dateModified: SAMPLE_ARTICLE.dateModified,
      author: SAMPLE_ARTICLE.author,
      keywords: expectedKeywords,
    });

    renderHead(
      <SEOHead
        title={SAMPLE_ARTICLE.title}
        description={SAMPLE_ARTICLE.excerpt}
        path={`/blog/${SAMPLE_ARTICLE.slug}`}
        type="article"
        schemas={[breadcrumb, article]}
        keywords={expectedKeywords}
        article={{
          datePublished: SAMPLE_ARTICLE.datePublished,
          dateModified: SAMPLE_ARTICLE.dateModified,
          author: SAMPLE_ARTICLE.author,
          category: SAMPLE_ARTICLE.category,
        }}
      />,
    );
    await new Promise((r) => setTimeout(r, 0));

    const types = Array.from(document.head.querySelectorAll('script[type="application/ld+json"]'))
      .flatMap((n) => {
        try { const j = JSON.parse(n.textContent || ""); return Array.isArray(j) ? j.map((x) => x["@type"]) : [j["@type"]]; }
        catch { return []; }
      });
    expect(types).not.toContain("FAQPage");
  });

  it("buildArticleKeywords skips off-schema categories", () => {
    const result = buildArticleKeywords({
      focusKeyword: "qualquer",
      tags: ["a", "b"],
      category: "categoria-inexistente",
    });
    expect(result).toEqual([]);
  });
});
