import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  ExternalLink,
  MousePointerClick,
  Eye,
} from "lucide-react";

interface KeywordRow {
  id: string;
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date: string;
}

type SortField = "clicks" | "impressions" | "position" | "ctr";
type SortDir = "asc" | "desc";

const KeywordRankingsSection = () => {
  const [rows, setRows] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("clicks");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const { toast } = useToast();

  const fetchRankings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("keyword_rankings")
      .select("*")
      .order("date", { ascending: false })
      .limit(500);

    if (error) {
      toast({ title: "Erro ao carregar rankings", description: error.message, variant: "destructive" });
    } else {
      setRows((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const syncFromGoogle = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("keyword-rankings", {
        body: { rowLimit: 200 },
      });

      if (error) throw error;
      toast({ title: `${data.totalRows} keywords sincronizadas!` });
      fetchRankings();
    } catch (err: any) {
      toast({ title: "Erro ao sincronizar", description: err.message, variant: "destructive" });
    }
    setSyncing(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir(field === "position" ? "asc" : "desc");
    }
  };

  // Aggregate by query (latest date)
  const aggregated = Object.values(
    rows.reduce<Record<string, KeywordRow>>((acc, r) => {
      const key = `${r.query}||${r.page}`;
      if (!acc[key] || r.date > acc[key].date) {
        acc[key] = r;
      }
      return acc;
    }, {})
  );

  const filtered = aggregated
    .filter((r) => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return r.query.toLowerCase().includes(q) || (r.page && r.page.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1;
      return (a[sortField] - b[sortField]) * mul;
    });

  const positionBadge = (pos: number) => {
    if (pos <= 3) return <Badge className="bg-green-500/15 text-green-700 border-green-500/30 text-[10px]">{pos.toFixed(1)}</Badge>;
    if (pos <= 10) return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-[10px]">{pos.toFixed(1)}</Badge>;
    if (pos <= 20) return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30 text-[10px]">{pos.toFixed(1)}</Badge>;
    return <Badge variant="outline" className="text-[10px]">{pos.toFixed(1)}</Badge>;
  };

  const latestDate = rows.length > 0 ? rows.reduce((max, r) => (r.date > max ? r.date : max), rows[0].date) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Palavras-chave que trazem tráfego orgânico via Google Search Console.
          </p>
          {latestDate && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Última sincronização: {new Date(latestDate).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
        <Button onClick={syncFromGoogle} disabled={syncing} size="sm" className="gap-1.5 shrink-0">
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar"}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filtrar por keyword ou página..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="border rounded-lg p-3 bg-card">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Search className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Keywords</span>
            </div>
            <p className="text-lg font-bold text-foreground">{filtered.length}</p>
          </div>
          <div className="border rounded-lg p-3 bg-card">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MousePointerClick className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Cliques</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {filtered.reduce((s, r) => s + r.clicks, 0).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="border rounded-lg p-3 bg-card">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Impressões</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {filtered.reduce((s, r) => s + r.impressions, 0).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="border rounded-lg p-3 bg-card">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Posição Média</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {(filtered.reduce((s, r) => s + r.position, 0) / filtered.length).toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="border rounded-xl p-8 text-center text-muted-foreground bg-card">
          <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma keyword encontrada</p>
          <p className="text-xs mt-1">Clique em "Sincronizar" para buscar dados do Google Search Console</p>
        </div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_60px_70px_55px_55px] sm:grid-cols-[1fr_1fr_70px_80px_60px_60px] gap-2 px-3 py-2 bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase">
            <span>Keyword</span>
            <span className="hidden sm:block">Página</span>
            <button onClick={() => toggleSort("position")} className="flex items-center gap-0.5 hover:text-foreground">
              Pos. <ArrowUpDown className="h-3 w-3" />
            </button>
            <button onClick={() => toggleSort("clicks")} className="flex items-center gap-0.5 hover:text-foreground">
              Cliques <ArrowUpDown className="h-3 w-3" />
            </button>
            <button onClick={() => toggleSort("impressions")} className="flex items-center gap-0.5 hover:text-foreground">
              Impr. <ArrowUpDown className="h-3 w-3" />
            </button>
            <button onClick={() => toggleSort("ctr")} className="flex items-center gap-0.5 hover:text-foreground">
              CTR <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          <div className="divide-y max-h-[500px] overflow-y-auto">
            {filtered.slice(0, 100).map((r) => {
              const pagePath = r.page ? new URL(r.page).pathname : "";
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[1fr_60px_70px_55px_55px] sm:grid-cols-[1fr_1fr_70px_80px_60px_60px] gap-2 px-3 py-2.5 items-center text-sm hover:bg-accent/20 transition-colors"
                >
                  <span className="font-medium text-foreground truncate text-xs">{r.query}</span>
                  <span className="hidden sm:block text-[11px] text-muted-foreground truncate">
                    {pagePath && (
                      <a href={r.page!} target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-0.5">
                        {pagePath} <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      </a>
                    )}
                  </span>
                  <span>{positionBadge(r.position)}</span>
                  <span className="text-xs font-semibold text-foreground">{r.clicks.toLocaleString("pt-BR")}</span>
                  <span className="text-xs text-muted-foreground">{r.impressions.toLocaleString("pt-BR")}</span>
                  <span className="text-xs text-muted-foreground">{(r.ctr * 100).toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
          {filtered.length > 100 && (
            <div className="px-3 py-2 text-[11px] text-muted-foreground bg-muted/30 text-center">
              Mostrando 100 de {filtered.length} keywords
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KeywordRankingsSection;
