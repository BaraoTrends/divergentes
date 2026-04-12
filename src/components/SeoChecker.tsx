import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle, Search } from "lucide-react";

interface SeoCheckerProps {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  imageUrl: string;
  focusKeyword?: string;
}

interface SeoCheck {
  id: string;
  label: string;
  status: "good" | "warning" | "error";
  message: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  const clean = stripHtml(text);
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

function getHeadings(html: string): string[] {
  const matches = html.match(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi) || [];
  return matches.map((m) => m.replace(/<[^>]*>/g, "").trim());
}

function hasImages(html: string): boolean {
  return /<img\s/i.test(html);
}

function hasLinks(html: string): boolean {
  return /<a\s/i.test(html);
}

function analyzeSeo({ title, excerpt, content, slug, imageUrl, focusKeyword }: SeoCheckerProps): SeoCheck[] {
  const checks: SeoCheck[] = [];
  const titleLen = title.trim().length;
  const excerptLen = excerpt.trim().length;
  const plainContent = stripHtml(content).toLowerCase();
  const wordCount = countWords(content);
  const headings = getHeadings(content);
  const kw = (focusKeyword || "").trim().toLowerCase();

  // Title
  if (!titleLen) {
    checks.push({ id: "title-missing", label: "Título", status: "error", message: "Adicione um título ao artigo." });
  } else if (titleLen < 30) {
    checks.push({ id: "title-short", label: "Título", status: "warning", message: `Título curto (${titleLen} chars). Ideal: 30–60 caracteres.` });
  } else if (titleLen > 60) {
    checks.push({ id: "title-long", label: "Título", status: "warning", message: `Título longo (${titleLen} chars). Google trunca acima de 60.` });
  } else {
    checks.push({ id: "title-ok", label: "Título", status: "good", message: `Tamanho ideal (${titleLen} chars).` });
  }

  // Meta description (excerpt)
  if (!excerptLen) {
    checks.push({ id: "excerpt-missing", label: "Meta descrição", status: "error", message: "Adicione um resumo para ser usado como meta description." });
  } else if (excerptLen < 70) {
    checks.push({ id: "excerpt-short", label: "Meta descrição", status: "warning", message: `Resumo curto (${excerptLen} chars). Ideal: 70–155.` });
  } else if (excerptLen > 155) {
    checks.push({ id: "excerpt-long", label: "Meta descrição", status: "warning", message: `Resumo longo (${excerptLen} chars). Google trunca acima de 155.` });
  } else {
    checks.push({ id: "excerpt-ok", label: "Meta descrição", status: "good", message: `Tamanho ideal (${excerptLen} chars).` });
  }

  // Slug
  if (!slug.trim()) {
    checks.push({ id: "slug-missing", label: "Slug (URL)", status: "error", message: "Defina um slug para a URL do artigo." });
  } else if (slug.length > 75) {
    checks.push({ id: "slug-long", label: "Slug (URL)", status: "warning", message: "Slug muito longo. Prefira até 75 caracteres." });
  } else {
    checks.push({ id: "slug-ok", label: "Slug (URL)", status: "good", message: "Slug adequado." });
  }

  // Word count
  if (wordCount < 300) {
    checks.push({ id: "words-low", label: "Conteúdo", status: "error", message: `Apenas ${wordCount} palavras. Mínimo recomendado: 300.` });
  } else if (wordCount < 800) {
    checks.push({ id: "words-medium", label: "Conteúdo", status: "warning", message: `${wordCount} palavras. Para rankear bem, tente 800+.` });
  } else {
    checks.push({ id: "words-ok", label: "Conteúdo", status: "good", message: `${wordCount} palavras — bom volume de conteúdo.` });
  }

  // Headings
  if (headings.length === 0 && wordCount > 200) {
    checks.push({ id: "headings-missing", label: "Subtítulos", status: "warning", message: "Adicione subtítulos (H2/H3) para melhorar escaneabilidade." });
  } else if (headings.length >= 2) {
    checks.push({ id: "headings-ok", label: "Subtítulos", status: "good", message: `${headings.length} subtítulos encontrados.` });
  } else if (headings.length === 1) {
    checks.push({ id: "headings-few", label: "Subtítulos", status: "warning", message: "Apenas 1 subtítulo. Adicione mais para estruturar o conteúdo." });
  }

  // Cover image
  if (!imageUrl.trim()) {
    checks.push({ id: "cover-missing", label: "Imagem de capa", status: "warning", message: "Adicione uma imagem de capa para compartilhamento social." });
  } else {
    checks.push({ id: "cover-ok", label: "Imagem de capa", status: "good", message: "Imagem de capa definida." });
  }

  // Internal images
  if (wordCount > 500 && !hasImages(content)) {
    checks.push({ id: "images-missing", label: "Imagens no conteúdo", status: "warning", message: "Adicione imagens ao corpo do artigo para engajamento." });
  } else if (hasImages(content)) {
    checks.push({ id: "images-ok", label: "Imagens no conteúdo", status: "good", message: "Conteúdo possui imagens." });
  }

  // Links
  if (wordCount > 300 && !hasLinks(content)) {
    checks.push({ id: "links-missing", label: "Links", status: "warning", message: "Adicione links internos ou externos para autoridade." });
  } else if (hasLinks(content)) {
    checks.push({ id: "links-ok", label: "Links", status: "good", message: "Links encontrados no conteúdo." });
  }

  // Paragraph length check
  const paragraphs = content.split(/<\/p>/i).filter((p) => stripHtml(p).length > 0);
  const longParas = paragraphs.filter((p) => countWords(p) > 150);
  if (longParas.length > 0) {
    checks.push({ id: "para-long", label: "Parágrafos", status: "warning", message: `${longParas.length} parágrafo(s) muito longo(s). Divida para facilitar a leitura.` });
  } else if (paragraphs.length > 0) {
    checks.push({ id: "para-ok", label: "Parágrafos", status: "good", message: "Parágrafos com tamanho adequado." });
  }

  // Focus keyword checks
  if (kw) {
    // Keyword in title
    if (title.toLowerCase().includes(kw)) {
      checks.push({ id: "kw-title", label: "Keyword no título", status: "good", message: `"${focusKeyword}" encontrada no título.` });
    } else {
      checks.push({ id: "kw-title", label: "Keyword no título", status: "error", message: `"${focusKeyword}" não aparece no título.` });
    }

    // Keyword in excerpt
    if (excerpt.toLowerCase().includes(kw)) {
      checks.push({ id: "kw-excerpt", label: "Keyword na meta descrição", status: "good", message: `"${focusKeyword}" encontrada no resumo.` });
    } else {
      checks.push({ id: "kw-excerpt", label: "Keyword na meta descrição", status: "warning", message: `"${focusKeyword}" não aparece no resumo.` });
    }

    // Keyword in slug
    const kwSlug = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
    if (slug.toLowerCase().includes(kwSlug)) {
      checks.push({ id: "kw-slug", label: "Keyword na URL", status: "good", message: `Keyword encontrada no slug.` });
    } else {
      checks.push({ id: "kw-slug", label: "Keyword na URL", status: "warning", message: `Considere incluir "${focusKeyword}" no slug.` });
    }

    // Keyword in headings
    const kwInHeadings = headings.some((h) => h.toLowerCase().includes(kw));
    if (kwInHeadings) {
      checks.push({ id: "kw-headings", label: "Keyword nos subtítulos", status: "good", message: `Keyword presente em pelo menos um subtítulo.` });
    } else if (headings.length > 0) {
      checks.push({ id: "kw-headings", label: "Keyword nos subtítulos", status: "warning", message: `Adicione "${focusKeyword}" em pelo menos um H2/H3.` });
    }

    // Keyword in first paragraph
    const firstPara = stripHtml(content.split(/<\/p>/i)[0] || "").toLowerCase();
    if (firstPara.includes(kw)) {
      checks.push({ id: "kw-intro", label: "Keyword na introdução", status: "good", message: `Keyword presente no primeiro parágrafo.` });
    } else {
      checks.push({ id: "kw-intro", label: "Keyword na introdução", status: "warning", message: `Inclua "${focusKeyword}" no primeiro parágrafo.` });
    }

    // Keyword density
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

const statusIcon = {
  good: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />,
  error: <XCircle className="h-4 w-4 text-red-500 shrink-0" />,
};

const SeoChecker = (props: SeoCheckerProps) => {
  const [expanded, setExpanded] = useState(false);
  const checks = useMemo(() => analyzeSeo(props), [props.title, props.excerpt, props.content, props.slug, props.imageUrl, props.focusKeyword]);

  const goodCount = checks.filter((c) => c.status === "good").length;
  const total = checks.length;
  const score = total > 0 ? Math.round((goodCount / total) * 100) : 0;

  const scoreColor = score >= 80 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Search className="h-4 w-4 text-primary" />
          Verificador SEO
          <span className={`text-xs font-bold ${scoreColor}`}>{score}%</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-3 pt-0 space-y-1.5">
          {checks.map((check) => (
            <div key={check.id} className="flex items-start gap-2 py-1.5 border-b last:border-0 border-border/50">
              {statusIcon[check.status]}
              <div className="min-w-0">
                <span className="text-xs font-medium text-foreground">{check.label}</span>
                <p className="text-xs text-muted-foreground">{check.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeoChecker;
