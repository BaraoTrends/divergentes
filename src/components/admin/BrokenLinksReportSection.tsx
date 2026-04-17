import { useEffect, useMemo, useState } from "react";
import { useArticles, useUpdateArticle, type Article } from "@/hooks/useArticles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link2Off,
  Loader2,
  Pencil,
  RefreshCw,
  Replace,
  Scissors,
  Sparkles,
  Wand2,
} from "lucide-react";

const FIX_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fix-broken-link`;

interface AiSuggestion {
  action: "replace" | "remove";
  slug?: string;
  confidence: number;
  reason: string;
}

const SITE_URL = "https://neurorotina.com";

// Rotas estáticas conhecidas — espelha o seo-audit
const STATIC_PATHS = new Set<string>([
  "/",
  "/blog",
  "/tdah",
  "/tea",
  "/dislexia",
  "/altas-habilidades",
  "/toc",
  "/perguntas-frequentes",
  "/glossario",
  "/sobre",
  "/contato",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/admin",
  "/admin/login",
]);

interface BrokenLink {
  href: string;            // exact href as written in content
  normalizedPath: string;  // path part, no query/hash, no trailing slash
  anchorText: string;
  fullAnchor: string;      // full <a ...>text</a> match
}

interface ArticleReport {
  article: Article;
  brokenLinks: BrokenLink[];
}

function normalizeHref(href: string): string | null {
  if (!href) return null;
  if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  let path = href;
  if (path.startsWith("http")) {
    if (!path.startsWith(SITE_URL)) return null;
    path = path.slice(SITE_URL.length) || "/";
  }
  if (!path.startsWith("/")) return null;
  path = path.split(/[?#]/)[0];
  // strip trailing slash except root
  if (path.length > 1) path = path.replace(/\/$/, "");
  return path;
}

function extractAnchors(html: string): { full: string; href: string; text: string }[] {
  const out: { full: string; href: string; text: string }[] = [];
  const regex = /<a\b[^>]*\shref\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    out.push({ full: m[0], href: m[1], text: m[2].replace(/<[^>]*>/g, "").trim() });
  }
  return out;
}

const BrokenLinksReportSection = () => {
  const { data: articles = [], isLoading, refetch } = useArticles();
  const updateArticle = useUpdateArticle();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replaceInputs, setReplaceInputs] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AiSuggestion>>({});

  const publishedSlugCandidates = useMemo(
    () =>
      articles
        .filter((a) => a.published)
        .map((a) => ({
          slug: `blog/${a.slug}`,
          title: a.title,
          category: a.category,
          excerpt: a.excerpt || undefined,
        })),
    [articles]
  );

  const validPaths = useMemo(() => {
    const set = new Set<string>(STATIC_PATHS);
    articles.filter((a) => a.published).forEach((a) => set.add(`/blog/${a.slug}`));
    return set;
  }, [articles]);

  const reports = useMemo<ArticleReport[]>(() => {
    if (!articles.length) return [];
    return articles
      .map((article) => {
        const anchors = extractAnchors(article.content || "");
        const broken: BrokenLink[] = [];
        const seen = new Set<string>();
        for (const a of anchors) {
          const norm = normalizeHref(a.href);
          if (!norm) continue;
          if (validPaths.has(norm)) continue;
          // dedupe by href + anchor text
          const key = `${a.href}::${a.text}`;
          if (seen.has(key)) continue;
          seen.add(key);
          broken.push({
            href: a.href,
            normalizedPath: norm,
            anchorText: a.text || "(sem texto)",
            fullAnchor: a.full,
          });
        }
        return { article, brokenLinks: broken };
      })
      .filter((r) => r.brokenLinks.length > 0)
      .sort((a, b) => b.brokenLinks.length - a.brokenLinks.length);
  }, [articles, validPaths]);

  const totalBroken = reports.reduce((sum, r) => sum + r.brokenLinks.length, 0);

  // Group broken targets globally to show "most cited orphan slugs"
  const orphanFrequency = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach((r) => {
      r.brokenLinks.forEach((b) => {
        map.set(b.normalizedPath, (map.get(b.normalizedPath) || 0) + 1);
      });
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [reports]);

  const updateContent = async (article: Article, newContent: string, successMsg: string, key: string) => {
    setBusyKey(key);
    try {
      await new Promise<void>((resolve, reject) => {
        updateArticle.mutate(
          { id: article.id, content: newContent },
          { onSuccess: () => resolve(), onError: (e) => reject(e) }
        );
      });
      toast({ title: successMsg });
    } catch (e: any) {
      toast({ title: "Erro ao atualizar artigo", description: e?.message, variant: "destructive" });
    } finally {
      setBusyKey(null);
    }
  };

  const handleRemoveLink = (article: Article, link: BrokenLink) => {
    const key = `${article.id}::${link.href}::remove`;
    // Replace <a ...>text</a> with just the text (keep content readable)
    const newContent = article.content.split(link.fullAnchor).join(link.anchorText);
    updateContent(article, newContent, "Link removido (texto preservado)", key);
  };

  const handleReplaceLink = (article: Article, link: BrokenLink) => {
    const key = `${article.id}::${link.href}::replace`;
    const inputKey = `${article.id}::${link.href}`;
    const target = (replaceInputs[inputKey] || "").trim();
    if (!target) {
      toast({ title: "Informe o novo slug ou path", variant: "destructive" });
      return;
    }
    let newPath = target;
    if (!newPath.startsWith("/") && !newPath.startsWith("http")) {
      // assume it's a blog slug
      newPath = `/blog/${newPath.replace(/^\/+/, "")}`;
    }
    if (newPath.startsWith("/") && !validPaths.has(newPath.replace(/\/$/, ""))) {
      toast({
        title: "Destino também inválido",
        description: `${newPath} não corresponde a nenhuma rota publicada.`,
        variant: "destructive",
      });
      return;
    }
    // Replace href inside the anchor tag only
    const newAnchor = link.fullAnchor.replace(
      /(href\s*=\s*")([^"]+)(")/i,
      (_, p1, _old, p3) => `${p1}${newPath}${p3}`
    );
    const newContent = article.content.split(link.fullAnchor).join(newAnchor);
    updateContent(article, newContent, `Link substituído por ${newPath}`, key);
  };

  const handleOpenInEditor = (article: Article) => {
    window.dispatchEvent(
      new CustomEvent("admin:open-article-editor", { detail: { articleId: article.id } })
    );
  };

  const handleAiFix = async (article: Article, link: BrokenLink, autoApply = false) => {
    const key = `${article.id}::${link.href}::ai`;
    const sugKey = `${article.id}::${link.href}`;
    setBusyKey(key);
    try {
      const resp = await fetch(FIX_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          brokenPath: link.normalizedPath,
          anchorText: link.anchorText,
          sourceTitle: article.title,
          candidates: publishedSlugCandidates,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast({
          title: resp.status === 402 ? "Créditos esgotados" : resp.status === 429 ? "Limite excedido" : "Erro na IA",
          description: err.error || `HTTP ${resp.status}`,
          variant: "destructive",
        });
        return;
      }
      const suggestion: AiSuggestion = await resp.json();
      setAiSuggestions((p) => ({ ...p, [sugKey]: suggestion }));

      if (autoApply || suggestion.confidence >= 0.75) {
        if (suggestion.action === "replace" && suggestion.slug) {
          const newPath = `/${suggestion.slug.replace(/^\/+/, "")}`;
          const newAnchor = link.fullAnchor.replace(
            /(href\s*=\s*")([^"]+)(")/i,
            (_, p1, _old, p3) => `${p1}${newPath}${p3}`
          );
          const newContent = article.content.split(link.fullAnchor).join(newAnchor);
          await updateContent(article, newContent, `IA: link substituído por ${newPath}`, key);
        } else {
          const newContent = article.content.split(link.fullAnchor).join(link.anchorText);
          await updateContent(article, newContent, "IA: link removido (texto preservado)", key);
        }
      } else {
        toast({
          title: "Sugestão pronta — confiança baixa",
          description: `${suggestion.action === "replace" ? `Trocar por /${suggestion.slug}` : "Remover link"} (${Math.round(suggestion.confidence * 100)}%) — revise antes de aplicar.`,
        });
      }
    } catch (e: any) {
      toast({ title: "Erro ao consultar IA", description: e?.message, variant: "destructive" });
    } finally {
      setBusyKey(null);
    }
  };

  const applySuggestion = (article: Article, link: BrokenLink) => {
    const sugKey = `${article.id}::${link.href}`;
    const s = aiSuggestions[sugKey];
    if (!s) return;
    const key = `${article.id}::${link.href}::apply`;
    if (s.action === "replace" && s.slug) {
      const newPath = `/${s.slug.replace(/^\/+/, "")}`;
      const newAnchor = link.fullAnchor.replace(
        /(href\s*=\s*")([^"]+)(")/i,
        (_, p1, _old, p3) => `${p1}${newPath}${p3}`
      );
      const newContent = article.content.split(link.fullAnchor).join(newAnchor);
      updateContent(article, newContent, `IA: link substituído por ${newPath}`, key);
    } else {
      const newContent = article.content.split(link.fullAnchor).join(link.anchorText);
      updateContent(article, newContent, "IA: link removido", key);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Analisando artigos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-foreground">Relatório de Links Internos Quebrados</p>
          <p className="text-[11px] text-muted-foreground">
            Analisa o HTML de cada artigo publicado e identifica links que apontam para slugs ou rotas inexistentes.
          </p>
        </div>
        <Button onClick={() => refetch()} size="sm" variant="outline" className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Reanalisar
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="border rounded-lg p-3 bg-card text-center">
          <p className="text-[11px] text-muted-foreground">Artigos com links quebrados</p>
          <p className={`text-lg font-bold ${reports.length > 0 ? "text-red-600" : "text-green-600"}`}>
            {reports.length}
          </p>
        </div>
        <div className="border rounded-lg p-3 bg-card text-center">
          <p className="text-[11px] text-muted-foreground">Total de links órfãos</p>
          <p className={`text-lg font-bold ${totalBroken > 0 ? "text-red-600" : "text-green-600"}`}>
            {totalBroken}
          </p>
        </div>
        <div className="border rounded-lg p-3 bg-card text-center">
          <p className="text-[11px] text-muted-foreground">Rotas válidas conhecidas</p>
          <p className="text-lg font-bold text-foreground">{validPaths.size}</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-green-500/30 bg-green-500/5 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Nenhum link interno quebrado encontrado. 🎉
        </div>
      ) : (
        <>
          {/* Top orphan slugs */}
          {orphanFrequency.length > 0 && (
            <div className="border rounded-lg p-3 bg-accent/20">
              <p className="text-[11px] font-semibold text-foreground mb-2">
                Slugs órfãos mais citados
              </p>
              <div className="flex flex-wrap gap-1.5">
                {orphanFrequency.map(([path, count]) => (
                  <Badge key={path} variant="outline" className="text-[10px] gap-1 font-mono">
                    {path}
                    <span className="text-muted-foreground">×{count}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reports list */}
          <div className="space-y-1.5">
            {reports.map(({ article, brokenLinks }) => {
              const isExpanded = expanded === article.id;
              return (
                <div key={article.id} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : article.id)}
                    className="w-full flex items-center gap-2.5 p-2.5 hover:bg-accent/30 transition-colors text-left"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{article.title}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">/blog/{article.slug}</p>
                    </div>
                    <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 shrink-0">
                      {brokenLinks.length} link(s)
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-accent/10">
                      <div className="flex items-center gap-2 px-3 py-2 border-b bg-background/40">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => handleOpenInEditor(article)}
                        >
                          <Pencil className="h-3 w-3" /> Abrir no editor
                        </Button>
                        <a
                          href={`${SITE_URL}/blog/${article.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Ver artigo público <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      <ul className="divide-y">
                        {brokenLinks.map((link, idx) => {
                          const inputKey = `${article.id}::${link.href}`;
                          const removeKey = `${article.id}::${link.href}::remove`;
                          const replaceKey = `${article.id}::${link.href}::replace`;
                          const aiKey = `${article.id}::${link.href}::ai`;
                          const applyKey = `${article.id}::${link.href}::apply`;
                          const suggestion = aiSuggestions[inputKey];
                          return (
                            <li key={`${link.href}-${idx}`} className="px-3 py-2.5 space-y-2">
                              <div className="flex items-start gap-2">
                                <Link2Off className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-mono text-red-600 break-all">
                                    {link.normalizedPath}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground break-words">
                                    Texto âncora: <span className="text-foreground">"{link.anchorText}"</span>
                                  </p>
                                </div>
                              </div>

                              {suggestion && (() => {
                                const suggestedTitle =
                                  suggestion.action === "replace" && suggestion.slug
                                    ? publishedSlugCandidates.find((c) => c.slug === suggestion.slug)?.title
                                    : null;
                                return (
                                <div className="ml-5 p-2 rounded-md border border-primary/30 bg-primary/5 space-y-1.5">
                                  <div className="flex items-start gap-1.5">
                                    <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                                    <div className="flex-1 text-[11px]">
                                      <p className="text-foreground">
                                        <span className="font-semibold">IA sugere:</span>{" "}
                                        {suggestion.action === "replace" ? (
                                          <>trocar por <span className="font-mono text-primary">/{suggestion.slug}</span></>
                                        ) : (
                                          <>remover o link</>
                                        )}{" "}
                                        <span className="text-muted-foreground">({Math.round(suggestion.confidence * 100)}%)</span>
                                      </p>
                                      {suggestedTitle && (
                                        <p className="text-foreground mt-0.5">
                                          <span className="text-muted-foreground">Destino:</span>{" "}
                                          <span className="font-medium">"{suggestedTitle}"</span>
                                        </p>
                                      )}
                                      <p className="text-muted-foreground italic">{suggestion.reason}</p>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="default"
                                      disabled={busyKey === applyKey}
                                      onClick={() => applySuggestion(article, link)}
                                      className="h-6 text-[10px] px-2 gap-1 shrink-0"
                                    >
                                      {busyKey === applyKey ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="h-3 w-3" />
                                      )}
                                      Aplicar
                                    </Button>
                                  </div>
                                </div>
                                );
                              })()}

                              <div className="flex flex-wrap items-center gap-2 pl-5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="default"
                                  disabled={busyKey === aiKey}
                                  onClick={() => handleAiFix(article, link)}
                                  className="h-7 text-[11px] gap-1"
                                >
                                  {busyKey === aiKey ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Wand2 className="h-3 w-3" />
                                  )}
                                  Corrigir com IA
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={busyKey === removeKey}
                                  onClick={() => handleRemoveLink(article, link)}
                                  className="h-7 text-[11px] gap-1"
                                >
                                  {busyKey === removeKey ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Scissors className="h-3 w-3" />
                                  )}
                                  Remover
                                </Button>
                                <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                                  <Input
                                    value={replaceInputs[inputKey] || ""}
                                    onChange={(e) =>
                                      setReplaceInputs((p) => ({ ...p, [inputKey]: e.target.value }))
                                    }
                                    placeholder="novo-slug ou /caminho"
                                    className="h-7 text-[11px] font-mono"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={busyKey === replaceKey}
                                    onClick={() => handleReplaceLink(article, link)}
                                    className="h-7 text-[11px] gap-1 shrink-0"
                                  >
                                    {busyKey === replaceKey ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Replace className="h-3 w-3" />
                                    )}
                                    Substituir
                                  </Button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default BrokenLinksReportSection;
