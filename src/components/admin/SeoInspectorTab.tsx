import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useArticles } from "@/hooks/useArticles";
import {
  buildArticleKeywords,
  serializeKeywordsMeta,
  parseKeywordsMeta,
  normalizeKeywords,
  CATEGORY_KEYWORDS,
} from "@/lib/keywords";
import { SITE_URL } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

const PRERENDER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prerender`;

const BOTS = {
  googlebot: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  bingbot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/W.X.Y.Z Safari/537.36",
};

interface InspectionResult {
  slug: string;
  category: string;
  expectedKeywords: string[];
  bots: Record<keyof typeof BOTS, BotView | { error: string }>;
}

interface BotView {
  title: string | null;
  description: string | null;
  canonical: string | null;
  ogImage: string | null;
  keywords: string[];
  articleTags: string[];
  diff: string[];
}

const pickAttr = (html: string, regex: RegExp): string | null => {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
};
const pickAll = (html: string, regex: RegExp): string[] => {
  const out: string[] = [];
  for (const m of html.matchAll(regex)) out.push(m[1].trim());
  return out;
};

async function inspectAsBot(slug: string, ua: string, expected: string[]): Promise<BotView | { error: string }> {
  try {
    const res = await fetch(`${PRERENDER_URL}?path=${encodeURIComponent(`/blog/${slug}`)}`, {
      headers: { Accept: "text/html", "User-Agent": ua },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const html = await res.text();
    const keywords = parseKeywordsMeta(pickAttr(html, /<meta\s+name="keywords"\s+content="([^"]*)"/i) || "");
    const articleTags = normalizeKeywords(pickAll(html, /<meta\s+property="article:tag"\s+content="([^"]*)"/gi));
    const diff: string[] = [];
    if (JSON.stringify(keywords) !== JSON.stringify(expected))
      diff.push(`keywords ≠ esperado (${keywords.length} vs ${expected.length})`);
    if (JSON.stringify(articleTags) !== JSON.stringify(expected))
      diff.push(`article:tag ≠ esperado (${articleTags.length} vs ${expected.length})`);
    return {
      title: pickAttr(html, /<title>([\s\S]*?)<\/title>/i),
      description: pickAttr(html, /<meta\s+name="description"\s+content="([^"]*)"/i),
      canonical: pickAttr(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i),
      ogImage: pickAttr(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i),
      keywords,
      articleTags,
      diff,
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

const SeoInspectorTab = () => {
  const { data: articles = [], isLoading } = useArticles({ publishedOnly: true });
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const inspectable = articles.filter((a) => a.category in CATEGORY_KEYWORDS);

  const inspection = useQuery<InspectionResult | null>({
    queryKey: ["seo-inspect", selectedSlug],
    enabled: !!selectedSlug,
    queryFn: async () => {
      const article = inspectable.find((a) => a.slug === selectedSlug);
      if (!article) return null;
      const expected = buildArticleKeywords({
        focusKeyword: article.focus_keyword,
        tags: article.tags,
        category: article.category,
      });
      const [google, bing] = await Promise.all([
        inspectAsBot(article.slug, BOTS.googlebot, expected),
        inspectAsBot(article.slug, BOTS.bingbot, expected),
      ]);
      return {
        slug: article.slug,
        category: article.category,
        expectedKeywords: expected,
        bots: { googlebot: google, bingbot: bing },
      };
    },
  });

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">SEO Inspector</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Veja exatamente o que Googlebot e Bingbot recebem para cada artigo publicado.
          Compara com a lista de keywords esperada por <code>buildArticleKeywords</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* article list */}
        <Card className="p-2 max-h-[600px] overflow-y-auto">
          <div className="text-xs text-muted-foreground px-2 py-1">
            {inspectable.length} artigo(s) elegível(is)
          </div>
          {inspectable.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedSlug(a.slug)}
              className={`w-full text-left px-2 py-2 rounded text-sm hover:bg-accent transition-colors ${
                selectedSlug === a.slug ? "bg-accent font-medium" : ""
              }`}
            >
              <div className="truncate">{a.title}</div>
              <div className="text-xs text-muted-foreground">{a.category} · /{a.slug}</div>
            </button>
          ))}
        </Card>

        {/* inspection panel */}
        <div>
          {!selectedSlug && (
            <Card className="p-8 text-center text-muted-foreground">
              Selecione um artigo para inspecionar.
            </Card>
          )}
          {selectedSlug && inspection.isLoading && (
            <Card className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></Card>
          )}
          {selectedSlug && inspection.data && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Esperado</h3>
                  <Button size="sm" variant="ghost" onClick={() => inspection.refetch()}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Recarregar
                  </Button>
                </div>
                <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                  {serializeKeywordsMeta(inspection.data.expectedKeywords)}
                </div>
              </Card>

              {(["googlebot", "bingbot"] as const).map((bot) => {
                const view = inspection.data!.bots[bot];
                const hasError = "error" in view;
                return (
                  <Card key={bot} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold capitalize flex items-center gap-2">
                        {bot}
                        {hasError ? (
                          <Badge variant="destructive" className="text-xs">Erro</Badge>
                        ) : view.diff.length > 0 ? (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" /> {view.diff.length} diff
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </Badge>
                        )}
                      </h3>
                      <a
                        href={`${PRERENDER_URL}?path=${encodeURIComponent(`/blog/${selectedSlug}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        ver HTML <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {hasError ? (
                      <p className="text-sm text-destructive">{view.error}</p>
                    ) : (
                      <dl className="space-y-2 text-sm">
                        <Field label="title" value={view.title} />
                        <Field label="description" value={view.description} />
                        <Field label="canonical" value={view.canonical} />
                        <Field label="og:image" value={view.ogImage} mono />
                        <Field label="keywords" value={view.keywords.join(", ")} mono />
                        <Field label="article:tag" value={view.articleTags.join(", ")} mono />
                        {view.diff.length > 0 && (
                          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded">
                            <p className="text-xs font-semibold text-destructive mb-1">Divergências</p>
                            <ul className="text-xs list-disc list-inside text-destructive">
                              {view.diff.map((d) => <li key={d}>{d}</li>)}
                            </ul>
                          </div>
                        )}
                      </dl>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) => (
  <div className="grid grid-cols-[100px_1fr] gap-2">
    <dt className="text-xs text-muted-foreground pt-0.5">{label}</dt>
    <dd className={`text-xs ${mono ? "font-mono" : ""} ${value ? "" : "text-muted-foreground italic"} break-all`}>
      {value || "(ausente)"}
    </dd>
  </div>
);

export default SeoInspectorTab;
