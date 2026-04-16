import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useArticles, useUpdateArticle, type Article } from "@/hooks/useArticles";
import { useAiWriter } from "@/hooks/useAiWriter";
import { supabase } from "@/integrations/supabase/client";
import { countWords } from "@/lib/seoAnalysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
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
  Wand2,
  Loader2,
} from "lucide-react";

type FixableId = "missing-excerpt" | "missing-keyword" | "thin-content";

interface Suggestion {
  id: string;
  severity: "critical" | "warning" | "tip";
  category: string;
  icon: typeof FileText;
  title: string;
  description: string;
  affectedSlugs: string[];
  action: string;
  fixable?: FixableId;
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
  const updateArticle = useUpdateArticle();
  const { toast } = useToast();
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixProgress, setFixProgress] = useState<{ done: number; total: number } | null>(null);

  const published = articles.filter((a) => a.published);
  const drafts = articles.filter((a) => !a.published);

  const suggestions = useMemo(() => {
    const result: Suggestion[] = [];

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
        fixable: "missing-excerpt",
      });
    }

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
        fixable: "thin-content",
      });
    }

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
        fixable: "missing-keyword",
      });
    }

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

    const order = { critical: 0, warning: 1, tip: 2 };
    result.sort((a, b) => order[a.severity] - order[b.severity]);
    return result;
  }, [published, drafts]);

  const handleAutoFix = async (sug: Suggestion) => {
    if (!sug.fixable) return;
    const affected = sug.affectedSlugs
      .map((slug) => articles.find((a) => a.slug === slug))
      .filter(Boolean) as Article[];

    if (affected.length === 0) return;

    setFixingId(sug.id);
    setFixProgress({ done: 0, total: affected.length });

    let successCount = 0;

    for (let i = 0; i < affected.length; i++) {
      const article = affected[i];
      try {
        if (sug.fixable === "missing-excerpt") {
          const excerpt = await generateExcerpt(article);
          if (excerpt) {
            await updateArticle.mutateAsync({ id: article.id, excerpt });
            successCount++;
          }
        } else if (sug.fixable === "missing-keyword") {
          const keyword = await generateFocusKeyword(article);
          if (keyword) {
            await updateArticle.mutateAsync({ id: article.id, focus_keyword: keyword });
            successCount++;
          }
        } else if (sug.fixable === "thin-content") {
          const expanded = await expandContent(article);
          if (expanded) {
            await updateArticle.mutateAsync({ id: article.id, content: expanded });
            successCount++;
          }
        }
      } catch (err) {
        console.error(`Auto-fix failed for ${article.slug}:`, err);
      }
      setFixProgress({ done: i + 1, total: affected.length });
      // Small delay to avoid rate limits
      if (i < affected.length - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setFixingId(null);
    setFixProgress(null);

    toast({
      title: "Correção automática concluída",
      description: `${successCount} de ${affected.length} artigo(s) corrigido(s) com sucesso.`,
    });
  };

  const generateExcerpt = async (article: Article): Promise<string | null> => {
    const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-writer`;
    const resp = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        action: "generate_excerpt",
        content: article.content.slice(0, 5000),
        focusKeyword: article.focus_keyword || undefined,
      }),
    });
    if (!resp.ok || !resp.body) return null;
    return await collectStream(resp.body);
  };

  const generateFocusKeyword = async (article: Article): Promise<string | null> => {
    const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-writer`;
    const resp = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        action: "generate_focus_keyword",
        topic: article.title,
        content: article.content.slice(0, 3000),
      }),
    });
    if (!resp.ok || !resp.body) return null;
    return await collectStream(resp.body);
  };

  const expandContent = async (article: Article): Promise<string | null> => {
    const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-writer`;
    const resp = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        action: "expand_text",
        content: article.content,
        focusKeyword: article.focus_keyword || undefined,
      }),
    });
    if (!resp.ok || !resp.body) return null;
    return await collectStream(resp.body);
  };

  const collectStream = async (body: ReadableStream<Uint8Array>): Promise<string> => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") break;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) result += content;
        } catch {}
      }
    }
    return result.trim();
  };

  const criticalCount = suggestions.filter((s) => s.severity === "critical").length;
  const warningCount = suggestions.filter((s) => s.severity === "warning").length;
  const tipCount = suggestions.filter((s) => s.severity === "tip").length;
  const totalAffected = new Set(suggestions.flatMap((s) => s.affectedSlugs)).size;

  // Health score: weighted per-article checks
  const healthScore = useMemo(() => {
    if (published.length === 0) return 100;
    const WEIGHTS: Record<string, number> = { critical: 3, warning: 2, tip: 1 };
    const checkCount = 10;
    const maxPoints = published.length * checkCount * 3;
    let lostPoints = 0;
    for (const sug of suggestions) {
      lostPoints += sug.affectedSlugs.length * (WEIGHTS[sug.severity] || 1);
    }
    return Math.max(0, Math.round((1 - lostPoints / maxPoints) * 100));
  }, [published, suggestions]);

  // Save today's score to history (upsert by date)
  useEffect(() => {
    if (published.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("indexing_health_history" as any)
      .upsert(
        {
          score: healthScore,
          total_articles: published.length,
          critical_count: criticalCount,
          warning_count: warningCount,
          tip_count: tipCount,
          recorded_at: today,
        },
        { onConflict: "recorded_at" }
      )
      .then(() => queryClient.invalidateQueries({ queryKey: ["health-history"] }));
  }, [healthScore, published.length, criticalCount, warningCount, tipCount]);

  const queryClient = useQueryClient();
  const { data: history = [] } = useQuery({
    queryKey: ["health-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indexing_health_history" as any)
        .select("score, recorded_at, total_articles, critical_count, warning_count, tip_count")
        .order("recorded_at", { ascending: true })
        .limit(90);
      if (error) throw error;
      return (data || []) as unknown as Array<{
        score: number;
        recorded_at: string;
        total_articles: number;
        critical_count: number;
        warning_count: number;
        tip_count: number;
      }>;
    },
  });

  const chartData = history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    score: h.score,
    artigos: h.total_articles,
  }));

  const scoreColor = healthScore >= 80 ? "text-green-600" : healthScore >= 50 ? "text-yellow-600" : "text-red-600";
  const scoreBorder = healthScore >= 80 ? "border-green-500/30" : healthScore >= 50 ? "border-yellow-500/30" : "border-red-500/30";
  const scoreBg = healthScore >= 80 ? "bg-green-500/5" : healthScore >= 50 ? "bg-yellow-500/5" : "bg-red-500/5";
  const scoreRing = healthScore >= 80 ? "stroke-green-500" : healthScore >= 50 ? "stroke-yellow-500" : "stroke-red-500";
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  const FIXABLE_LABELS: Record<FixableId, string> = {
    "missing-excerpt": "Gerar meta descriptions com IA",
    "missing-keyword": "Gerar focus keywords com IA",
    "thin-content": "Expandir conteúdo com IA",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ações concretas para remover bloqueios e melhorar a indexação. Baseado na análise de{" "}
        <strong>{published.length}</strong> artigos publicados e <strong>{drafts.length}</strong> rascunhos.
      </p>

      {/* Health Score Ring */}
      <div className={`border rounded-xl p-4 ${scoreBorder} ${scoreBg} flex items-center gap-4`}>
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
            <circle cx="44" cy="44" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-border opacity-30" />
            <circle
              cx="44" cy="44" r="40" fill="none" strokeWidth="6" strokeLinecap="round"
              className={scoreRing}
              style={{ strokeDasharray: circumference, strokeDashoffset, transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold ${scoreColor}`}>{healthScore}%</span>
          </div>
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">Saúde de Indexação</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {healthScore >= 90
              ? "Excelente! Seus artigos estão bem otimizados para indexação."
              : healthScore >= 70
              ? "Bom, mas há melhorias que podem aumentar suas páginas indexadas."
              : healthScore >= 50
              ? "Atenção: vários artigos precisam de ajustes para serem indexados."
              : "Crítico: muitos bloqueios impedem a indexação. Resolva os itens críticos primeiro."}
          </p>
        </div>
      </div>

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
            const isFixing = fixingId === sug.id;

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

                      {/* Auto-fix button */}
                      {sug.fixable && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!fixingId}
                            onClick={() => handleAutoFix(sug)}
                            className="gap-2 text-xs h-8"
                          >
                            {isFixing ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {fixProgress
                                  ? `Corrigindo ${fixProgress.done}/${fixProgress.total}…`
                                  : "Iniciando…"}
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-3.5 w-3.5" />
                                {FIXABLE_LABELS[sug.fixable]} ({sug.affectedSlugs.length})
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

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
