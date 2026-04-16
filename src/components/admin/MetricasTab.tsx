import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useTopArticles,
  useViewsByCategory,
  useViewsTimeline,
  useViewsByDevice,
  useTopReferrers,
} from "@/hooks/useDashboardMetrics";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Eye, Users, Clock, TrendingUp, ExternalLink, Smartphone, Monitor, Tablet, Globe, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { categories } from "@/lib/content";

const PERIODS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
];

const CATEGORY_COLORS: Record<string, string> = {
  TDAH: "hsl(var(--chart-1, 220 70% 50%))",
  TEA: "hsl(var(--chart-2, 160 60% 45%))",
  Dislexia: "hsl(var(--chart-3, 30 80% 55%))",
  "Altas Habilidades": "hsl(var(--chart-4, 280 65% 60%))",
  TOC: "hsl(var(--chart-5, 340 75% 55%))",
};

function formatSeconds(s: number): string {
  if (!s || s < 1) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  if (m === 0) return `${sec}s`;
  return `${m}m ${sec}s`;
}

function categoryName(slug: string): string {
  const c = categories.find((c) => c.slug === slug);
  return c?.name || slug;
}

function categoryColor(name: string): string {
  return CATEGORY_COLORS[name] || "hsl(var(--primary))";
}

const MetricasTab = () => {
  const [days, setDays] = useState(30);
  const { data: topArticles = [], isLoading: loadingTop } = useTopArticles(days, 10);
  const { data: byCategory = [], isLoading: loadingCat } = useViewsByCategory(days);
  const { data: timeline = [], isLoading: loadingTime } = useViewsTimeline(days);

  const totalViews = timeline.reduce((sum, t) => sum + Number(t.views), 0);
  const totalSessions = timeline.reduce((sum, t) => sum + Number(t.unique_sessions), 0);
  const avgReadTime =
    topArticles.length > 0
      ? Math.round(
          topArticles.reduce((sum, a) => sum + Number(a.avg_read_time), 0) / topArticles.length,
        )
      : 0;
  const avgScroll =
    topArticles.length > 0
      ? Math.round(
          topArticles.reduce((sum, a) => sum + Number(a.avg_scroll_depth), 0) / topArticles.length,
        )
      : 0;

  const pieData = byCategory.map((c) => ({
    name: categoryName(c.category),
    value: Number(c.views),
    color: categoryColor(categoryName(c.category)),
  }));

  const timelineData = timeline.map((t) => ({
    day: new Date(t.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    Visualizações: Number(t.views),
    "Sessões únicas": Number(t.unique_sessions),
  }));

  const stats = [
    { label: "Visualizações", value: totalViews.toLocaleString("pt-BR"), icon: Eye, color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Sessões únicas", value: totalSessions.toLocaleString("pt-BR"), icon: Users, color: "text-green-600", bg: "bg-green-500/10 border-green-500/20" },
    { label: "Tempo médio", value: formatSeconds(avgReadTime), icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Scroll médio", value: avgScroll > 0 ? `${avgScroll}%` : "—", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-500/10 border-purple-500/20" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Métricas</h1>
          <p className="text-sm text-muted-foreground mt-1">Artigos mais lidos e engajamento dos visitantes</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          {PERIODS.map((p) => (
            <Button
              key={p.days}
              size="sm"
              variant={days === p.days ? "default" : "ghost"}
              onClick={() => setDays(p.days)}
              className="text-xs h-7"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.bg}`}>
            <div className="p-2 rounded-lg bg-background/60 w-fit mb-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{loadingTime ? <Skeleton className="h-7 w-16" /> : s.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tendência temporal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendência ({days} dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTime ? (
            <Skeleton className="h-64 w-full" />
          ) : timelineData.length === 0 ? (
            <EmptyState message="Sem dados de visualização ainda. Os números aparecem conforme os visitantes acessam os artigos." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="Visualizações" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Sessões únicas" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top artigos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 artigos mais lidos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTop ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topArticles.length === 0 ? (
              <EmptyState message="Nenhum artigo visualizado no período." />
            ) : (
              <div className="space-y-2">
                {topArticles.map((a, idx) => (
                  <a
                    key={a.article_id}
                    href={`/blog/${a.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <span className="font-bold text-muted-foreground w-6 text-center text-sm">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {a.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {categoryName(a.category)} • {formatSeconds(Number(a.avg_read_time))} • {a.avg_scroll_depth}% scroll
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{Number(a.views).toLocaleString("pt-BR")}</p>
                      <p className="text-[10px] text-muted-foreground">{a.unique_sessions} sessões</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visualizações por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCat ? (
              <Skeleton className="h-64 w-full" />
            ) : pieData.length === 0 ? (
              <EmptyState message="Sem dados por categoria ainda." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.name} (${entry.value})`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Dados de tracking interno. Atualizados em tempo real conforme as visitas. Privacidade: nenhum dado pessoal é coletado.
      </p>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-8 text-sm text-muted-foreground">
    <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
    {message}
  </div>
);

export default MetricasTab;
