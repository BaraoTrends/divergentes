import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  BellOff,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface IndexingAlert {
  id: string;
  article_id: string;
  alert_type: string;
  message: string;
  resolved: boolean;
  created_at: string;
  articles?: { title: string; slug: string } | null;
}

const useIndexingAlerts = () => {
  return useQuery({
    queryKey: ["indexing-alerts"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("indexing_alerts" as any)
        .select("*, articles(title, slug)")
        .order("created_at", { ascending: false })
        .limit(50) as any);
      if (error) throw error;
      return (data || []) as IndexingAlert[];
    },
  });
};

const IndexingAlertsSection = () => {
  const { data: alerts = [], isLoading, refetch } = useIndexingAlerts();
  const [runningCron, setRunningCron] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

  const resolveAlert = async (alertId: string) => {
    const { error } = await (supabase
      .from("indexing_alerts" as any)
      .update({ resolved: true })
      .eq("id", alertId) as any);
    if (error) {
      toast({ title: "Erro ao resolver", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["indexing-alerts"] });
    }
  };

  const resolveAll = async () => {
    const ids = unresolvedAlerts.map((a) => a.id);
    if (ids.length === 0) return;
    const { error } = await (supabase
      .from("indexing_alerts" as any)
      .update({ resolved: true })
      .in("id", ids) as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["indexing-alerts"] });
      toast({ title: `${ids.length} alerta(s) resolvido(s)` });
    }
  };

  const runManualCheck = async () => {
    setRunningCron(true);
    try {
      const res = await supabase.functions.invoke("check-indexing-cron", { body: {} });
      if (res.error) throw res.error;
      const data = res.data as { checked: number; newAlerts: number };
      toast({
        title: "Verificação concluída",
        description: `${data.checked} artigos verificados, ${data.newAlerts} novo(s) alerta(s)`,
      });
      refetch();
    } catch (e: any) {
      toast({ title: "Erro ao executar verificação", description: e.message, variant: "destructive" });
    } finally {
      setRunningCron(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando alertas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Verificação automática diária às 06:00 UTC. Alertas quando artigos saem do índice.
        </p>
        <div className="flex gap-2">
          {unresolvedAlerts.length > 0 && (
            <Button size="sm" variant="outline" onClick={resolveAll} className="gap-1 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolver todos
            </Button>
          )}
          <Button
            size="sm"
            onClick={runManualCheck}
            disabled={runningCron}
            className="gap-1"
          >
            {runningCron ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {runningCron ? "Verificando..." : "Verificar agora"}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="border rounded-lg p-3 bg-red-500/5 border-red-500/20">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Alertas ativos</p>
              <p className="text-xl font-bold text-red-600">{unresolvedAlerts.length}</p>
            </div>
          </div>
        </div>
        <div className="border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <BellOff className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Resolvidos</p>
              <p className="text-xl font-bold text-muted-foreground">{resolvedAlerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active alerts */}
      {unresolvedAlerts.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Alertas Ativos
          </h3>
          {unresolvedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5"
            >
              {alert.alert_type === "deindexed" ? (
                <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{alert.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(alert.created_at).toLocaleString("pt-BR")}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 py-0 text-red-600 border-red-500/30"
                  >
                    {alert.alert_type === "deindexed" ? "Desindexado" : "Erro"}
                  </Badge>
                  {(alert as any).articles?.slug && (
                    <a
                      href={`/blog/${(alert as any).articles.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Ver artigo <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() => resolveAlert(alert.id)}
              >
                Resolver
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Resolved alerts */}
      {resolvedAlerts.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Resolvidos
          </h3>
          {resolvedAlerts.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card opacity-60"
            >
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{alert.message}</p>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(alert.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          ))}
          {resolvedAlerts.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{resolvedAlerts.length - 5} alerta(s) antigo(s)
            </p>
          )}
        </div>
      )}

      {alerts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum alerta registrado ainda.</p>
          <p className="text-xs mt-1">
            Clique em "Verificar agora" para executar a primeira verificação.
          </p>
        </div>
      )}
    </div>
  );
};

export default IndexingAlertsSection;
