import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useArticles } from "@/hooks/useArticles";
import { SITE_URL } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Globe,
  Bot,
  ShieldCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface InspectionResult {
  url: string;
  status: string;
  verdict?: string;
  coverageState?: string;
  indexingState?: string;
  lastCrawlTime?: string | null;
  pageFetchState?: string;
  robotsTxtState?: string;
  crawledAs?: string;
  error?: string;
}

const VERDICT_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  PASS: { label: "Indexado", color: "text-green-600 bg-green-500/10 border-green-500/20", icon: CheckCircle2 },
  PARTIAL: { label: "Parcial", color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20", icon: AlertTriangle },
  FAIL: { label: "Não indexado", color: "text-red-600 bg-red-500/10 border-red-500/20", icon: XCircle },
  NEUTRAL: { label: "Neutro", color: "text-muted-foreground bg-muted/50 border-border", icon: Clock },
  VERDICT_UNSPECIFIED: { label: "Desconhecido", color: "text-muted-foreground bg-muted/50 border-border", icon: Clock },
  UNKNOWN: { label: "Pendente", color: "text-muted-foreground bg-muted/50 border-border", icon: Clock },
};

const COVERAGE_LABELS: Record<string, string> = {
  "Submitted and indexed": "Enviada e indexada",
  "Indexed, not submitted in sitemap": "Indexada, não enviada no sitemap",
  "Crawled - currently not indexed": "Rastreada, mas não indexada",
  "Discovered - currently not indexed": "Descoberta, mas não indexada",
  "URL is unknown to Google": "URL desconhecida pelo Google",
  "Excluded by 'noindex' tag": "Excluída por tag noindex",
  "Blocked by robots.txt": "Bloqueada pelo robots.txt",
  "Page with redirect": "Página com redirecionamento",
  "Soft 404": "Soft 404",
  "Not found (404)": "Não encontrada (404)",
  "Server error (5xx)": "Erro de servidor (5xx)",
};

const IndexingStatusSection = () => {
  const { data: articles = [] } = useArticles({ publishedOnly: true });
  const [results, setResults] = useState<Record<string, InspectionResult>>({});
  const [loading, setLoading] = useState(false);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const { toast } = useToast();

  const checkAll = async () => {
    setLoading(true);
    try {
      const urls = articles.map((a) => `${SITE_URL}/blog/${a.slug}`);
      // Process in batches of 5 to avoid timeouts
      const batchSize = 5;
      const allResults: InspectionResult[] = [];

      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        const res = await supabase.functions.invoke("indexing-status", {
          body: { urls: batch, siteUrl: `${SITE_URL}/` },
        });

        if (res.error) throw res.error;
        const data = res.data as { results: InspectionResult[]; error?: string };
        if (data.error) throw new Error(data.error);
        allResults.push(...data.results);
      }

      const map: Record<string, InspectionResult> = {};
      allResults.forEach((r) => {
        const slug = r.url.replace(`${SITE_URL}/blog/`, "");
        map[slug] = r;
      });
      setResults(map);

      const indexed = allResults.filter((r) => r.verdict === "PASS").length;
      toast({
        title: "Verificação concluída",
        description: `${indexed}/${allResults.length} URLs indexadas`,
      });
    } catch (e: any) {
      toast({ title: "Erro ao verificar", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const checkOne = async (slug: string) => {
    setLoadingSlug(slug);
    try {
      const url = `${SITE_URL}/blog/${slug}`;
      const res = await supabase.functions.invoke("indexing-status", {
        body: { urls: [url], siteUrl: `${SITE_URL}/` },
      });

      if (res.error) throw res.error;
      const data = res.data as { results: InspectionResult[]; error?: string };
      if (data.error) throw new Error(data.error);

      setResults((prev) => ({ ...prev, [slug]: data.results[0] }));
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoadingSlug(null);
    }
  };

  const indexedCount = Object.values(results).filter((r) => r.verdict === "PASS").length;
  const errorCount = Object.values(results).filter((r) => r.verdict === "FAIL").length;
  const pendingCount = articles.length - Object.keys(results).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Consulta o status de indexação de cada artigo via Google Search Console API.
          </p>
        </div>
        <Button
          size="sm"
          onClick={checkAll}
          disabled={loading || articles.length === 0}
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? "Verificando..." : "Verificar Todos"}
        </Button>
      </div>

      {/* Summary cards */}
      {Object.keys(results).length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="border rounded-lg p-3 bg-green-500/5 border-green-500/20">
            <p className="text-xs text-muted-foreground">Indexados</p>
            <p className="text-xl font-bold text-green-600">{indexedCount}</p>
          </div>
          <div className="border rounded-lg p-3 bg-red-500/5 border-red-500/20">
            <p className="text-xs text-muted-foreground">Não indexados</p>
            <p className="text-xl font-bold text-red-600">{errorCount}</p>
          </div>
          <div className="border rounded-lg p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground">Não verificados</p>
            <p className="text-xl font-bold text-muted-foreground">{pendingCount}</p>
          </div>
        </div>
      )}

      {/* Article list */}
      <div className="space-y-1.5">
        {articles.map((article) => {
          const result = results[article.slug];
          const verdictInfo = result ? VERDICT_MAP[result.verdict || "UNKNOWN"] || VERDICT_MAP.UNKNOWN : null;
          const isChecking = loadingSlug === article.slug;

          return (
            <div
              key={article.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/20 transition-colors"
            >
              {/* Status indicator */}
              <div className="shrink-0">
                {isChecking ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : result ? (
                  <verdictInfo!.icon className={`h-5 w-5 ${verdictInfo!.color.split(" ")[0]}`} />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground/40" />
                )}
              </div>

              {/* Article info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{article.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    /blog/{article.slug}
                  </span>
                  {result && verdictInfo && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${verdictInfo.color}`}
                    >
                      {verdictInfo.label}
                    </Badge>
                  )}
                  {result?.coverageState && (
                    <span className="text-[10px] text-muted-foreground">
                      {COVERAGE_LABELS[result.coverageState] || result.coverageState}
                    </span>
                  )}
                </div>

                {/* Detail row */}
                {result && result.status === "ok" && (
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {result.lastCrawlTime && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        Último rastreio: {new Date(result.lastCrawlTime).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {result.crawledAs && result.crawledAs !== "UNKNOWN" && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {result.crawledAs}
                      </span>
                    )}
                    {result.robotsTxtState === "ALLOWED" && (
                      <span className="text-[10px] text-green-600 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        robots.txt OK
                      </span>
                    )}
                  </div>
                )}

                {result?.status === "error" && (
                  <p className="text-[10px] text-destructive mt-1">{result.error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => checkOne(article.slug)}
                  disabled={isChecking}
                  title="Verificar esta URL"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Ver no Google">
                  <a
                    href={`https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(SITE_URL + "/")}&id=${encodeURIComponent(SITE_URL + "/blog/" + article.slug)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          );
        })}

        {articles.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum artigo publicado encontrado.
          </p>
        )}
      </div>
    </div>
  );
};

export default IndexingStatusSection;
