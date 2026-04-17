import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, RefreshCw, Share2 } from "lucide-react";

type StatusFilter = "all" | "success" | "error";

interface SocialPublishLog {
  id: string;
  article_id: string | null;
  article_title: string;
  triggered_at: string;
  status: "success" | "error";
  error_message: string | null;
  make_status: number | null;
}

const SocialPublishLogsTab = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["social-publish-logs", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("social_publish_logs")
        .select("*")
        .order("triggered_at", { ascending: false })
        .limit(50);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SocialPublishLog[];
    },
  });

  const successCount = logs.filter((l) => l.status === "success").length;
  const errorCount = logs.filter((l) => l.status === "error").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Share2 className="h-6 w-6" />
            Autopublicação Social
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Últimos 50 disparos do webhook para o Make.com
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["social-publish-logs"] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase">Total exibido</p>
          <p className="text-2xl font-bold text-foreground">{logs.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase">Sucesso</p>
          <p className="text-2xl font-bold text-primary">{successCount}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase">Falhas</p>
          <p className="text-2xl font-bold text-destructive">{errorCount}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrar por status:</span>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Artigo</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>HTTP</TableHead>
              <TableHead>Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum disparo registrado ainda.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {log.status === "success" ? (
                    <Badge variant="outline" className="border-primary text-primary">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Sucesso
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Erro
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">{log.article_title}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(log.triggered_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-sm">{log.make_status ?? "—"}</TableCell>
                <TableCell className="text-sm text-destructive max-w-md truncate" title={log.error_message ?? ""}>
                  {log.error_message ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SocialPublishLogsTab;
