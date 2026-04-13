/** Shared SEO analysis utilities — used by SeoChecker and admin SEO tab */

export interface SeoCheck {
  id: string;
  label: string;
  status: "good" | "warning" | "error";
  message: string;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function countWords(text: string): number {
  const clean = stripHtml(text);
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

export function getHeadings(html: string): string[] {
  const matches = html.match(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi) || [];
  return matches.map((m) => m.replace(/<[^>]*>/g, "").trim());
}

export function hasImages(html: string): boolean {
  return /<img\s/i.test(html);
}

export function hasLinks(html: string): boolean {
  return /<a\s/i.test(html);
}

export interface ArticleSeoInput {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  imageUrl: string;
  focusKeyword?: string;
}

export function analyzeSeo({ title, excerpt, content, slug, imageUrl, focusKeyword }: ArticleSeoInput): SeoCheck[] {
  const checks: SeoCheck[] = [];
  const titleLen = title.trim().length;
  const excerptLen = excerpt.trim().length;
  const plainContent = stripHtml(content).toLowerCase();
  const wordCount = countWords(content);
  const headings = getHeadings(content);
  const kw = (focusKeyword || "").trim().toLowerCase();

  if (!titleLen) {
    checks.push({ id: "title-missing", label: "Título", status: "error", message: "Adicione um título ao artigo." });
  } else if (titleLen < 30) {
    checks.push({ id: "title-short", label: "Título", status: "warning", message: `Título curto (${titleLen} chars). Ideal: 30–60 caracteres.` });
  } else if (titleLen > 60) {
    checks.push({ id: "title-long", label: "Título", status: "warning", message: `Título longo (${titleLen} chars). Google trunca acima de 60.` });
  } else {
    checks.push({ id: "title-ok", label: "Título", status: "good", message: `Tamanho ideal (${titleLen} chars).` });
  }

  if (!excerptLen) {
    checks.push({ id: "excerpt-missing", label: "Meta descrição", status: "error", message: "Adicione um resumo para ser usado como meta description." });
  } else if (excerptLen < 70) {
    checks.push({ id: "excerpt-short", label: "Meta descrição", status: "warning", message: `Resumo curto (${excerptLen} chars). Ideal: 70–155.` });
  } else if (excerptLen > 155) {
    checks.push({ id: "excerpt-long", label: "Meta descrição", status: "warning", message: `Resumo longo (${excerptLen} chars). Google trunca acima de 155.` });
  } else {
    checks.push({ id: "excerpt-ok", label: "Meta descrição", status: "good", message: `Tamanho ideal (${excerptLen} chars).` });
  }

  if (!slug.trim()) {
    checks.push({ id: "slug-missing", label: "Slug (URL)", status: "error", message: "Defina um slug para a URL do artigo." });
  } else if (slug.length > 75) {
    checks.push({ id: "slug-long", label: "Slug (URL)", status: "warning", message: "Slug muito longo. Prefira até 75 caracteres." });
  } else {
    checks.push({ id: "slug-ok", label: "Slug (URL)", status: "good", message: "Slug adequado." });
  }

  if (wordCount < 300) {
    checks.push({ id: "words-low", label: "Conteúdo", status: "error", message: `Apenas ${wordCount} palavras. Mínimo recomendado: 300.` });
  } else if (wordCount < 800) {
    checks.push({ id: "words-medium", label: "Conteúdo", status: "warning", message: `${wordCount} palavras. Para rankear bem, tente 800+.` });
  } else {
    checks.push({ id: "words-ok", label: "Conteúdo", status: "good", message: `${wordCount} palavras — bom volume de conteúdo.` });
  }

  if (headings.length === 0 && wordCount > 200) {
    checks.push({ id: "headings-missing", label: "Subtítulos", status: "warning", message: "Adicione subtítulos (H2/H3) para melhorar escaneabilidade." });
  } else if (headings.length >= 2) {
    checks.push({ id: "headings-ok", label: "Subtítulos", status: "good", message: `${headings.length} subtítulos encontrados.` });
  } else if (headings.length === 1) {
    checks.push({ id: "headings-few", label: "Subtítulos", status: "warning", message: "Apenas 1 subtítulo. Adicione mais para estruturar o conteúdo." });
  }

  if (!imageUrl.trim()) {
    checks.push({ id: "cover-missing", label: "Imagem de capa", status: "warning", message: "Adicione uma imagem de capa para compartilhamento social." });
  } else {
    checks.push({ id: "cover-ok", label: "Imagem de capa", status: "good", message: "Imagem de capa definida." });
  }

  if (wordCount > 500 && !hasImages(content)) {
    checks.push({ id: "images-missing", label: "Imagens no conteúdo", status: "warning", message: "Adicione imagens ao corpo do artigo para engajamento." });
  } else if (hasImages(content)) {
    checks.push({ id: "images-ok", label: "Imagens no conteúdo", status: "good", message: "Conteúdo possui imagens." });
  }

  if (wordCount > 300 && !hasLinks(content)) {
    checks.push({ id: "links-missing", label: "Links", status: "warning", message: "Adicione links internos ou externos para autoridade." });
  } else if (hasLinks(content)) {
    checks.push({ id: "links-ok", label: "Links", status: "good", message: "Links encontrados no conteúdo." });
  }

  const pTagMatches = content.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
  const longParas = pTagMatches.filter((p) => countWords(p) > 150);
  if (longParas.length > 0) {
    checks.push({ id: "para-long", label: "Parágrafos", status: "warning", message: `${longParas.length} parágrafo(s) muito longo(s). Divida para facilitar a leitura.` });
  } else if (pTagMatches.length > 0) {
    checks.push({ id: "para-ok", label: "Parágrafos", status: "good", message: "Parágrafos com tamanho adequado." });
  }

  if (kw) {
    if (title.toLowerCase().includes(kw)) {
      checks.push({ id: "kw-title", label: "Keyword no título", status: "good", message: `"${focusKeyword}" encontrada no título.` });
    } else {
      checks.push({ id: "kw-title", label: "Keyword no título", status: "error", message: `"${focusKeyword}" não aparece no título.` });
    }

    if (excerpt.toLowerCase().includes(kw)) {
      checks.push({ id: "kw-excerpt", label: "Keyword na meta descrição", status: "good", message: `"${focusKeyword}" encontrada no resumo.` });
    } else {
      checks.push({ id: "kw-excerpt", label: "Keyword na meta descrição", status: "warning", message: `"${focusKeyword}" não aparece no resumo.` });
    }

    const kwSlug = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
    if (slug.toLowerCase().includes(kwSlug)) {
      checks.push({ id: "kw-slug", label: "Keyword na URL", status: "good", message: "Keyword encontrada no slug." });
    } else {
      checks.push({ id: "kw-slug", label: "Keyword na URL", status: "warning", message: `Considere incluir "${focusKeyword}" no slug.` });
    }

    const kwInHeadings = headings.some((h) => h.toLowerCase().includes(kw));
    if (kwInHeadings) {
      checks.push({ id: "kw-headings", label: "Keyword nos subtítulos", status: "good", message: "Keyword presente em pelo menos um subtítulo." });
    } else if (headings.length > 0) {
      checks.push({ id: "kw-headings", label: "Keyword nos subtítulos", status: "warning", message: `Adicione "${focusKeyword}" em pelo menos um H2/H3.` });
    }

    const firstPara = stripHtml(content.split(/<\/p>/i)[0] || "").toLowerCase();
    if (firstPara.includes(kw)) {
      checks.push({ id: "kw-intro", label: "Keyword na introdução", status: "good", message: "Keyword presente no primeiro parágrafo." });
    } else {
      checks.push({ id: "kw-intro", label: "Keyword na introdução", status: "warning", message: `Inclua "${focusKeyword}" no primeiro parágrafo.` });
    }

    if (wordCount > 0) {
      const kwWords = kw.split(/\s+/).length;
      let kwCount = 0;
      const words = plainContent.split(/\s+/);
      for (let i = 0; i <= words.length - kwWords; i++) {
        if (words.slice(i, i + kwWords).join(" ") === kw) kwCount++;
      }
      const density = (kwCount / wordCount) * 100;
      if (density === 0) {
        checks.push({ id: "kw-density", label: "Densidade da keyword", status: "error", message: `"${focusKeyword}" não aparece no conteúdo.` });
      } else if (density < 0.5) {
        checks.push({ id: "kw-density", label: "Densidade da keyword", status: "warning", message: `Densidade baixa (${density.toFixed(1)}%). Ideal: 0.5–2.5%.` });
      } else if (density > 2.5) {
        checks.push({ id: "kw-density", label: "Densidade da keyword", status: "warning", message: `Densidade alta (${density.toFixed(1)}%). Risco de keyword stuffing.` });
      } else {
        checks.push({ id: "kw-density", label: "Densidade da keyword", status: "good", message: `Densidade ideal (${density.toFixed(1)}%). ${kwCount} ocorrência(s).` });
      }
    }
  }

  return checks;
}

export function calculateScore(checks: SeoCheck[]): number {
  const total = checks.length;
  if (total === 0) return 0;
  const goodCount = checks.filter((c) => c.status === "good").length;
  return Math.round((goodCount / total) * 100);
}
