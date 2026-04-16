import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ExternalLink,
  MousePointerClick,
  Eye,
  ChevronLeft,
  Download,
  Minus,
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
  device: string | null;
}

interface AggregatedKeyword {
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  prevPosition: number | null;
  positionDelta: number | null;
  latestDate: string;
}

type SortField = "clicks" | "impressions" | "position" | "ctr" | "positionDelta";
type SortDir = "asc" | "desc";
type PeriodFilter = "7d" | "14d" | "28d" | "90d" | "all";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "14d", label: "14 dias" },
  { value: "28d", label: "28 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Tudo" },
];

const KeywordRankingsSection = () => {
  const [rows, setRows] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMode, setSyncMode] = useState<"aggregate" | "daily">("daily");
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("clicks");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [period, setPeriod] = useState<PeriodFilter>("28d");
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("keyword_rankings")
      .select("*")
      .order("date", { ascending: false })
      .limit(1000);

    if (error) {
      toast({ title: "Erro ao carregar rankings", description: error.message, variant: "destructive" });
    } else {
      setRows((data as any[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const syncFromGoogle = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("keyword-rankings", {
        body: { rowLimit: 500, mode: syncMode },
      });

      if (error) throw error;
      toast({ title: `${data.totalRows} keywords sincronizadas!`, description: `Modo: ${syncMode === "daily" ? "Histórico diário" : "Agregado"}` });
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

  // Filter rows by period (exclude device breakdown rows for main view)
  const periodFilteredRows = useMemo(() => {
    let filtered = rows.filter((r) => !r.device); // Main query+page rows only
    if (period !== "all") {
      const days = parseInt(period);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      filtered = filtered.filter((r) => r.date >= cutoffStr);
    }
    return filtered;
  }, [rows, period]);

  // Split period in half to compute delta
  const aggregated: AggregatedKeyword[] = useMemo(() => {
    const halfDays = period === "all" ? 14 : Math.floor(parseInt(period) / 2);
    const midDate = new Date();
    midDate.setDate(midDate.getDate() - halfDays);
    const midStr = midDate.toISOString().split("T")[0];

    // Group by query+page
    const groups: Record<string, { recent: KeywordRow[]; older: KeywordRow[] }> = {};
    periodFilteredRows.forEach((r) => {
      const key = `${r.query}||${r.page || ""}`;
      if (!groups[key]) groups[key] = { recent: [], older: [] };
      if (r.date >= midStr) {
        groups[key].recent.push(r);
      } else {
        groups[key].older.push(r);
      }
    });

    return Object.entries(groups).map(([, g]) => {
      const allRows = [...g.recent, ...g.older];
      const totalClicks = allRows.reduce((s, r) => s + r.clicks, 0);
      const totalImpressions = allRows.reduce((s, r) => s + r.impressions, 0);
      const avgPosition = allRows.reduce((s, r) => s + r.position, 0) / allRows.length;
      const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

      const recentAvgPos = g.recent.length > 0
        ? g.recent.reduce((s, r) => s + r.position, 0) / g.recent.length
        : null;
      const olderAvgPos = g.older.length > 0
        ? g.older.reduce((s, r) => s + r.position, 0) / g.older.length
        : null;

      const delta = recentAvgPos !== null && olderAvgPos !== null
        ? olderAvgPos - recentAvgPos // positive = improved (position went down = better)
        : null;

      const latestDate = allRows.reduce((max, r) => r.date > max ? r.date : max, allRows[0].date);

      return {
        query: allRows[0].query,
        page: allRows[0].page,
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: avgCtr,
        position: parseFloat(avgPosition.toFixed(1)),
        prevPosition: olderAvgPos,
        positionDelta: delta !== null ? parseFloat(delta.toFixed(1)) : null,
        latestDate,
      };
    });
  }, [periodFilteredRows, period]);

  const filtered = useMemo(() => {
    return aggregated
      .filter((r) => {
        if (!filter) return true;
        const q = filter.toLowerCase();
        return r.query.toLowerCase().includes(q) || (r.page && r.page.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const mul = sortDir === "desc" ? -1 : 1;
        if (sortField === "positionDelta") {
          const aVal = a.positionDelta ?? 0;
          const bVal = b.positionDelta ?? 0;
          return (aVal - bVal) * mul;
        }
        return ((a[sortField] as number) - (b[sortField] as number)) * mul;
      });
  }, [aggregated, filter, sortField, sortDir]);

  // Top movers
  const topGainers = useMemo(() =>
    [...aggregated]
      .filter((k) => k.positionDelta !== null && k.positionDelta > 0)
      .sort((a, b) => (b.positionDelta ?? 0) - (a.positionDelta ?? 0))
      .slice(0, 5),
    [aggregated]
  );

  const topLosers = useMemo(() =>
    [...aggregated]
      .filter((k) => k.positionDelta !== null && k.positionDelta < 0)
      .sort((a, b) => (a.positionDelta ?? 0) - (b.positionDelta ?? 0))
      .slice(0, 5),
    [aggregated]
  );

  // Keyword drill-down: position history
  const keywordHistory = useMemo(() => {
    if (!selectedKeyword) return [];
    const kwRows = periodFilteredRows
      .filter((r) => r.query === selectedKeyword)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Aggregate by date
    const byDate: Record<string, { totalPos: number; count: number; clicks: number; impressions: number }> = {};
    kwRows.forEach((r) => {
      if (!byDate[r.date]) byDate[r.date] = { totalPos: 0, count: 0, clicks: 0, impressions: 0 };
      byDate[r.date].totalPos += r.position;
      byDate[r.date].count += 1;
      byDate[r.date].clicks += r.clicks;
      byDate[r.date].impressions += r.impressions;
    });

    return Object.entries(byDate)
      .map(([date, v]) => ({
        date,
        label: new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        position: parseFloat((v.totalPos / v.count).toFixed(1)),
        clicks: v.clicks,
        impressions: v.impressions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedKeyword, periodFilteredRows]);

  const positionBadge = (pos: number) => {
    if (pos <= 3) return <Badge className="bg-green-500/15 text-green-700 border-green-500/30 text-[10px]">{pos.toFixed(1)}</Badge>;
    if (pos <= 10) return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-[10px]">{pos.toFixed(1)}</Badge>;
    if (pos <= 20) return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30 text-[10px]">{pos.toFixed(1)}</Badge>;
    return <Badge variant="outline" className="text-[10px]">{pos.toFixed(1)}</Badge>;
  };

  const deltaBadge = (delta: number | null) => {
    if (delta === null) return <span className="text-[10px] text-muted-foreground">—</span>;
    if (delta > 0) return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 font-semibold">
        <TrendingUp className="h-3 w-3" />+{delta.toFixed(1)}
      </span>
    );
    if (delta < 0) return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600 font-semibold">
        <TrendingDown className="h-3 w-3" />{delta.toFixed(1)}
      </span>
    );
    return <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"><Minus className="h-3 w-3" />0</span>;
  };

  // Chart data: aggregate by date for overview
  const chartData = useMemo(() => {
    const byDate: Record<string, { totalPos: number; count: number; clicks: number; impressions: number }> = {};
    periodFilteredRows.forEach((r) => {
      if (!byDate[r.date]) byDate[r.date] = { totalPos: 0, count: 0, clicks: 0, impressions: 0 };
      byDate[r.date].totalPos += r.position;
      byDate[r.date].count += 1;
      byDate[r.date].clicks += r.clicks;
      byDate[r.date].impressions += r.impressions;
    });
    return Object.entries(byDate)
      .map(([date, v]) => ({
        date,
        label: new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        position: parseFloat((v.totalPos / v.count).toFixed(1)),
        clicks: v.clicks,
        impressions: v.impressions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [periodFilteredRows]);

  const chartConfig = {
    position: { label: "Posição Média", color: "hsl(var(--primary))" },
    clicks: { label: "Cliques", color: "hsl(142, 71%, 45%)" },
    impressions: { label: "Impressões", color: "hsl(217, 91%, 60%)" },
  };

  const weightedCtr = useMemo(() => {
    const totalClicks = filtered.reduce((s, r) => s + r.clicks, 0);
    const totalImpr = filtered.reduce((s, r) => s + r.impressions, 0);
    return totalImpr > 0 ? ((totalClicks / totalImpr) * 100).toFixed(2) : "0.00";
  }, [filtered]);

  const latestDate = rows.length > 0 ? rows.reduce((max, r) => (r.date > max ? r.date : max), rows[0].date) : null;

  // Export CSV
  const exportCsv = () => {
    const header = "Keyword,Página,Posição,Δ Posição,Cliques,Impressões,CTR\n";
    const csv = filtered.map((r) => {
      let pagePath = "";
      try { pagePath = r.page ? new URL(r.page).pathname : ""; } catch { pagePath = r.page || ""; }
      return `"${r.query}","${pagePath}",${r.position},${r.positionDelta ?? ""},${r.clicks},${r.impressions},${(r.ctr * 100).toFixed(2)}%`;
    }).join("\n");
    const blob = new Blob([header + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keywords-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // DRILL-DOWN VIEW
  if (selectedKeyword) {
    const kwData = aggregated.find((k) => k.query === selectedKeyword);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedKeyword(null)} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
        <div className="border rounded-xl bg-card p-4">
          <h3 className="font-heading font-bold text-foreground text-lg mb-1">"{selectedKeyword}"</h3>
          {kwData && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Posição Média</p>
                <p className="text-lg font-bold">{kwData.position}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Variação</p>
                <p className="text-lg font-bold">{deltaBadge(kwData.positionDelta)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Cliques</p>
                <p className="text-lg font-bold">{kwData.clicks.toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Impressões</p>
                <p className="text-lg font-bold">{kwData.impressions.toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">CTR</p>
                <p className="text-lg font-bold">{(kwData.ctr * 100).toFixed(2)}%</p>
              </div>
            </div>
          )}
        </div>

        {keywordHistory.length > 1 && (
          <>
            <div className="border rounded-xl bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Evolução da Posição</h4>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart data={keywordHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis reversed tick={{ fontSize: 11 }} domain={["dataMin - 1", "dataMax + 1"]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="position" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ChartContainer>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">↑ Menor posição = melhor ranking</p>
            </div>

            <div className="border rounded-xl bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Cliques & Impressões</h4>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={keywordHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="impressions" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} opacity={0.4} />
                  <Bar dataKey="clicks" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </>
        )}
      </div>
    );
  }

  // MAIN VIEW
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
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md overflow-hidden text-[11px]">
            <button
              className={`px-2 py-1.5 ${syncMode === "daily" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent/50"}`}
              onClick={() => setSyncMode("daily")}
            >
              Diário
            </button>
            <button
              className={`px-2 py-1.5 ${syncMode === "aggregate" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent/50"}`}
              onClick={() => setSyncMode("aggregate")}
            >
              Agregado
            </button>
          </div>
          <Button onClick={syncFromGoogle} disabled={syncing} size="sm" className="gap-1.5 shrink-0">
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por keyword ou página..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        {filtered.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1 shrink-0">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
          <div className="border rounded-lg p-3 bg-card">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MousePointerClick className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">CTR Ponderado</span>
            </div>
            <p className="text-lg font-bold text-foreground">{weightedCtr}%</p>
          </div>
        </div>
      )}

      {/* Top Movers */}
      {(topGainers.length > 0 || topLosers.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topGainers.length > 0 && (
            <div className="border rounded-xl bg-green-500/5 border-green-500/20 p-3">
              <h4 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Top Ganhos de Posição
              </h4>
              <div className="space-y-1.5">
                {topGainers.map((k) => (
                  <button
                    key={k.query}
                    onClick={() => setSelectedKeyword(k.query)}
                    className="w-full flex items-center justify-between text-xs hover:bg-green-500/10 rounded px-2 py-1 transition-colors text-left"
                  >
                    <span className="truncate text-foreground font-medium">{k.query}</span>
                    <span className="text-green-600 font-bold shrink-0 ml-2">+{k.positionDelta?.toFixed(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {topLosers.length > 0 && (
            <div className="border rounded-xl bg-red-500/5 border-red-500/20 p-3">
              <h4 className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                <TrendingDown className="h-3.5 w-3.5" /> Top Perdas de Posição
              </h4>
              <div className="space-y-1.5">
                {topLosers.map((k) => (
                  <button
                    key={k.query}
                    onClick={() => setSelectedKeyword(k.query)}
                    className="w-full flex items-center justify-between text-xs hover:bg-red-500/10 rounded px-2 py-1 transition-colors text-left"
                  >
                    <span className="truncate text-foreground font-medium">{k.query}</span>
                    <span className="text-red-600 font-bold shrink-0 ml-2">{k.positionDelta?.toFixed(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evolution Charts */}
      {chartData.length > 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Período:</span>
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={period === opt.value ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <div className="border rounded-xl bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Evolução da Posição Média</h3>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis reversed tick={{ fontSize: 11 }} domain={["dataMin - 1", "dataMax + 1"]} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="position" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ChartContainer>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">↑ Menor posição = melhor ranking (eixo invertido)</p>
          </div>

          <div className="border rounded-xl bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Cliques e Impressões por Dia</h3>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="impressions" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} opacity={0.4} />
                <Bar dataKey="clicks" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
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
          <div className="grid grid-cols-[1fr_50px_50px_50px_50px_50px] sm:grid-cols-[1fr_1fr_65px_50px_65px_65px_55px] gap-2 px-3 py-2 bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase">
            <span>Keyword</span>
            <span className="hidden sm:block">Página</span>
            <button onClick={() => toggleSort("position")} className="flex items-center gap-0.5 hover:text-foreground">
              Pos. <ArrowUpDown className="h-3 w-3" />
            </button>
            <button onClick={() => toggleSort("positionDelta")} className="flex items-center gap-0.5 hover:text-foreground">
              Δ <ArrowUpDown className="h-3 w-3" />
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
            {filtered.slice(0, 100).map((r, idx) => {
              let pagePath = "";
              try { pagePath = r.page ? new URL(r.page).pathname : ""; } catch { pagePath = r.page || ""; }
              return (
                <button
                  key={`${r.query}-${idx}`}
                  onClick={() => setSelectedKeyword(r.query)}
                  className="w-full grid grid-cols-[1fr_50px_50px_50px_50px_50px] sm:grid-cols-[1fr_1fr_65px_50px_65px_65px_55px] gap-2 px-3 py-2.5 items-center text-sm hover:bg-accent/20 transition-colors text-left"
                >
                  <span className="font-medium text-foreground truncate text-xs">{r.query}</span>
                  <span className="hidden sm:block text-[11px] text-muted-foreground truncate">
                    {pagePath && (
                      <span className="inline-flex items-center gap-0.5">
                        {pagePath} <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      </span>
                    )}
                  </span>
                  <span>{positionBadge(r.position)}</span>
                  <span>{deltaBadge(r.positionDelta)}</span>
                  <span className="text-xs font-semibold text-foreground">{r.clicks.toLocaleString("pt-BR")}</span>
                  <span className="text-xs text-muted-foreground">{r.impressions.toLocaleString("pt-BR")}</span>
                  <span className="text-xs text-muted-foreground">{(r.ctr * 100).toFixed(1)}%</span>
                </button>
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
