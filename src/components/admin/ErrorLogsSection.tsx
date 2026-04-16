import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ErrorLog {
  id: string;
  message: string;
  stack: string | null;
  url: string | null;
  user_agent: string | null;
  resolved: boolean;
  created_at: string;
}

export const ErrorLogsSection = () => {
  const qc = useQueryClient();

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["error-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_logs")
        .select("id,message,stack,url,user_agent,resolved,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ErrorLog[];
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      const { error } = await supabase
        .from("error_logs")
        .update({ resolved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["error-logs"] });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("error_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["error-logs"] });
      toast.success("Log removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unresolvedCount = logs?.filter((l) => !l.resolved).length ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <CardTitle className="text-base">Logs de Erros do Frontend</CardTitle>
          {unresolvedCount > 0 && (
            <Badge variant="destructive">{unresolvedCount} não resolvidos</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !logs?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum erro registrado. 🎉
          </p>
        ) : (
          <ul className="space-y-3 max-h-[500px] overflow-y-auto">
            {logs.map((log) => (
              <li
                key={log.id}
                className={`border rounded-md p-3 text-sm ${
                  log.resolved ? "opacity-60 bg-muted/30" : "bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground break-words">
                      {log.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                      {log.url && <> · <span className="break-all">{log.url}</span></>}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        resolveMutation.mutate({ id: log.id, resolved: !log.resolved })
                      }
                      title={log.resolved ? "Reabrir" : "Marcar como resolvido"}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${log.resolved ? "text-primary" : ""}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(log.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {log.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Stack trace
                    </summary>
                    <pre className="text-[11px] bg-muted p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap break-words max-h-40">
                      {log.stack}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
