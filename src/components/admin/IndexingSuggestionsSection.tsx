import { useMemo } from "react";
import { useArticles } from "@/hooks/useArticles";
import { analyzeSeo, calculateScore, countWords, stripHtml } from "@/lib/seoAnalysis";
import { SITE_URL } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Image,
  Link2,
  Tag,
  Hash,
  Globe,
  Heading,
  Type,
  ExternalLink,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

interface Suggestion {
  id: string;
  severity: "critical" | "warning" | "tip";
  category: string;
  icon: typeof FileText;
  title: string;
  description: string;
  affectedSlugs: string[];
  action: string;
}

const SEVERITY_STYLES = {
  critical: {
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    icon: XCircle,
    iconColor: "text-red-600",
    badge: "bg-red-500/15 text-red-700 border-red-500/30",
    label: "Crítico",
  },
  warning: {
    border: "border-yellow-500/20",
    bg: "bg-yellow-500/5",
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    badge: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
    label: "Atenção",
  },
  tip: {
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    icon: Lightbulb,
    iconColor: "text-blue-600",
    badge: "bg-blue-500/15 text-blue-700 border-blue-500/30",
    label: "Dica",
  },
};

const IndexingSuggestionsSection = () => {
  const { data: articles = [] } = useArticles();
  const published = articles.filter((a) => a.published);
  const drafts = articles.filter((a) => !a.published);

  const suggestions = useMemo(() => {
    const result: Suggestion[] = [];

    // 1. Drafts that could be published
    if (drafts.length > 0) {
      const readyDrafts = drafts.filter((d) => {
        const wc = countWords(d.content);
        return wc >= 300 && d.title.length >= 20 && (d.excerpt || "").length >= 50;
      });
      if (readyDrafts.length > 0) {
        result.push({
          id: "publish-drafts",
          severity: "tip",
          category: "Conteúdo",
          icon: FileText,
          title: `${readyDrafts.length} rascunho(s) pronto(s) para publicar`,
          description: "Estes rascunhos têm conteúdo suficiente (300+ palavras, título e resumo). Publicá-los aumentará suas páginas indexáveis.",
          affectedSlugs: readyDrafts.map((d) => d.slug),
          action: "Publique estes artigos para que o Google possa indexá-los.",
        });
      }
    }

    // 2. Articles without meta description
    const noExcerpt = published.filter((a) => !a.excerpt || a.excerpt.trim().length < 30);
    if (noExcerpt.length > 0) {
      result.push({
        id: "missing-excerpt",
        severity: "critical",
        category: "Meta Description",
        icon: Type,
        title: `${noExcerpt.length} artigo(s) sem meta description adequada`,
        description: "Artigos sem meta description podem ter CTR baixo nos resultados do Google e dificultar a indexação.",
        affectedSlugs: noExcerpt.map((a) => a.slug),
        action: "Adicione um resumo de 70-155 caracteres em cada artigo.",
      });
    }

    // 3. Articles without cover image
    const noImage = published.filter((a) => !a.image_url || a.image_url.trim() === "");
    if (noImage.length > 0) {
      result.push({
        id: "missing-image",
        severity: "warning",
        category: "Imagens",
        icon: Image,
        title: `${noImage.length} artigo(s) sem imagem de capa`,
        description: "Artigos sem imagem de capa perdem destaque no Google Discover e em compartilhamentos sociais.",
        affectedSlugs: noImage.map((a) => a.slug),
        action: "Adicione uma imagem de capa (1200×672px) a cada artigo.",
      });
    }

    // 4. Articles with thin content
    const thinContent = published.filter((a) => countWords(a.content) < 300);
    if (thinContent.length > 0) {
      result.push({
        id: "thin-content",
        severity: "critical",
        category: "Conteúdo",
        icon: FileText,
        title: `${thinContent.length} artigo(s) com conteúdo insuficiente (<300 palavras)`,
        description: "Conteúdo muito curto raramente é indexado. O Google prioriza artigos com profundidade e relevância.",
        affectedSlugs: thinContent.map((a) => a.slug),
        action: "Expanda o conteúdo para pelo menos 800 palavras com informações úteis.",
      });
    }

    // 5. Articles without focus keyword
    const noKeyword = published.filter((a) => !a.focus_keyword || a.focus_keyword.trim() === "");
    if (noKeyword.length > 0) {
      result.push({
        id: "missing-keyword",
        severity: "warning",
        category: "SEO On-Page",
        icon: Tag,
        title: `${noKeyword.length} artigo(s) sem focus keyword definida`,
        description: "Sem uma keyword foco, o Google pode não entender o tema principal do artigo.",
        affectedSlugs: noKeyword.map((a) => a.slug),
        action: "Defina uma keyword foco e inclua-a no título, resumo e primeiro parágrafo.",
      });
    }

    // 6. Articles without tags
    const noTags = published.filter((a) => !a.tags || a.tags.length === 0);
    if (noTags.length > 0) {
      result.push({
        id: "missing-tags",
        severity: "tip",
        category: "Taxonomia",
        icon: Hash,
        title: `${noTags.length} artigo(s) sem tags`,
        description: "Tags ajudam motores de busca a entender a estrutura temática do site e melhoram a linkagem interna.",
        affectedSlugs: noTags.map((a) => a.slug),
        action: "Adicione 3-5 tags relevantes a cada artigo.",
      });
    }

    // 7. Articles without internal links in content
    const noLinks = published.filter((a) => {
      const hasLink = /<a\s/i.test(a.content);
      return !hasLink && countWords(a.content) > 300;
    });
    if (noLinks.length > 0) {
      result.push({
        id: "missing-links",
        severity: "warning",
        category: "Links Internos",
        icon: Link2,
        title: `${noLinks.length} artigo(s) sem links internos`,
        description: "Links internos ajudam o Googlebot a descobrir e rastrear mais páginas do seu site, além de distribuir autoridade.",
        affectedSlugs: noLinks.map((a) => a.slug),
        action: "Adicione 2-3 links internos relevantes no corpo de cada artigo.",
      });
    }

    // 8. Articles without headings (H2/H3)
    const noHeadings = published.filter((a) => {
      const hasH2 = /<h[23][^>]*>/i.test(a.content);
      return !hasH2 && countWords(a.content) > 200;
    });
    if (noHeadings.length > 0) {
      result.push({
        id: "missing-headings",
        severity: "warning",
        category: "Estrutura",
        icon: Heading,
        title: `${noHeadings.length} artigo(s) sem subtítulos (H2/H3)`,
        description: "Subtítulos ajudam o Google a entender a hierarquia do conteúdo e podem gerar featured snippets.",
        affectedSlugs: noHeadings.map((a) => a.slug),
        action: "Adicione subtítulos H2/H3 a cada 200-300 palavras.",
      });
    }

    // 9. Long slugs
    const longSlugs = published.filter((a) => a.slug.length > 75);
    if (longSlugs.length > 0) {
      result.push({
        id: "long-slugs",
        severity: "tip",
        category: "URL",
        icon: Globe,
        title: `${longSlugs.length} artigo(s) com slug muito longo`,
        description: "URLs longas podem ser truncadas nos resultados de busca e são mais difíceis de compartilhar.",
        affectedSlugs: longSlugs.map((a) => a.slug),
        action: "Encurte o slug para 3-5 palavras-chave separadas por hífens.",
      });
    }

    // 10. Titles too short or too long
    const badTitles = published.filter((a) => a.title.length < 30 || a.title.length > 60);
    if (badTitles.length > 0) {
      result.push({
        id: "title-length",
        severity: "warning",
        category: "Título",
        icon: Type,
        title: `${badTitles.length} artigo(s) com título fora do ideal (30-60 chars)`,
        description: "Títulos muito curtos ou longos perdem cliques nos resultados do Google.",
        affectedSlugs: badTitles.map((a) => a.slug),
        action: "Ajuste títulos para 30-60 caracteres, incluindo a keyword foco.",
      });
    }

    // Sort: critical first, then warning, then tip
    const order = { critical: 0, warning: 1, tip: 2 };
    result.sort((a, b) => order[a.severity] - order[b.severity]);

    return result;
  }, [published, drafts]);

  const criticalCount = suggestions.filter((s) => s.severity === "critical").length;
  const warningCount = suggestions.filter((s) => s.severity === "warning").length;
  const tipCount = suggestions.filter((s) => s.severity === "tip").length;
  const totalAffected = new Set(suggestions.flatMap((s) => s.affectedSlugs)).size;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ações concretas para remover bloqueios e melhorar a indexação. Baseado na análise de{" "}
        <strong>{published.length}</strong> artigos publicados e <strong>{drafts.length}</strong> rascunhos.
      </p>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="border rounded-lg p-3 bg-card">
          <p className="text-[11px] text-muted-foreground font-medium">Sugestões</p>
          <p className="text-xl font-bold text-foreground">{suggestions.length}</p>
        </div>
        <div className="border rounded-lg p-3 bg-red-500/5 border-red-500/20">
          <p className="text-[11px] text-muted-foreground font-medium">Críticos</p>
          <p className="text-xl font-bold text-red-600">{criticalCount}</p>
        </div>
        <div className="border rounded-lg p-3 bg-yellow-500/5 border-yellow-500/20">
          <p className="text-[11px] text-muted-foreground font-medium">Atenção</p>
          <p className="text-xl font-bold text-yellow-600">{warningCount}</p>
        </div>
        <div className="border rounded-lg p-3 bg-blue-500/5 border-blue-500/20">
          <p className="text-[11px] text-muted-foreground font-medium">Dicas</p>
          <p className="text-xl font-bold text-blue-600">{tipCount}</p>
        </div>
      </div>

      {totalAffected > 0 && (
        <p className="text-xs text-muted-foreground">
          <strong>{totalAffected}</strong> artigo(s) afetado(s) por pelo menos uma sugestão.
        </p>
      )}

      {/* Suggestion Cards */}
      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-xl bg-card">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600 opacity-60" />
          <p className="text-sm font-medium">Tudo certo!</p>
          <p className="text-xs mt-1">Nenhum bloqueio ou melhoria identificada no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((sug) => {
            const style = SEVERITY_STYLES[sug.severity];
            const SevIcon = style.icon;
            const SugIcon = sug.icon;

            return (
              <div key={sug.id} className={`border rounded-xl ${style.border} ${style.bg} overflow-hidden`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <SevIcon className={`h-5 w-5 ${style.iconColor} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-sm font-semibold text-foreground">{sug.title}</h4>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${style.badge}`}>
                          {style.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          <SugIcon className="h-2.5 w-2.5 mr-1" />
                          {sug.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{sug.description}</p>
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <ArrowRight className="h-3 w-3" />
                        {sug.action}
                      </div>
                    </div>
                  </div>

                  {/* Affected articles */}
                  {sug.affectedSlugs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-[11px] text-muted-foreground font-medium mb-1.5">
                        Artigos afetados ({sug.affectedSlugs.length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {sug.affectedSlugs.slice(0, 8).map((slug) => {
                          const article = articles.find((a) => a.slug === slug);
                          return (
                            <a
                              key={slug}
                              href={`/blog/${slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-background border hover:bg-accent/50 transition-colors truncate max-w-[200px]"
                              title={article?.title || slug}
                            >
                              {article?.title || slug}
                              <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-50" />
                            </a>
                          );
                        })}
                        {sug.affectedSlugs.length > 8 && (
                          <span className="text-[10px] text-muted-foreground px-2 py-1">
                            +{sug.affectedSlugs.length - 8} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IndexingSuggestionsSection;
