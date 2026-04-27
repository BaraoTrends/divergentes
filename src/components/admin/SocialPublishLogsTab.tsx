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
import { CheckCircle2, XCircle, RefreshCw, Share2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const queryClient = useQueryClient();

  const { data: articles = [] } = useQuery({
    queryKey: ["admin-published-articles-for-social"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, image_url, category, tags, created_at, published")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleManualPublish = async () => {
    if (!selectedArticleId) {
      toast.error("Selecione um artigo para publicar.");
      return;
    }
    const article = articles.find((a) => a.id === selectedArticleId);
    if (!article) {
      toast.error("Artigo não encontrado.");
      return;
    }

    setIsPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke("social-publish", {
        body: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          cover_image_url: article.image_url,
          created_at: article.created_at,
          tags: article.tags ?? [],
          category: article.category,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Artigo enviado para autopublicação!");
      queryClient.invalidateQueries({ queryKey: ["social-publish-logs"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao enviar";
      toast.error(`Erro: ${msg}`);
    } finally {
      setIsPublishing(false);
    }
  };


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

      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Send className="h-4 w-4" />
            Envio manual
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Reenvia um artigo já publicado para o webhook de autopublicação (Make.com).
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um artigo publicado..." />
            </SelectTrigger>
            <SelectContent>
              {articles.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleManualPublish}
            disabled={!selectedArticleId || isPublishing}
            className="sm:w-auto"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar para autopublicação
          </Button>
        </div>
      </div>

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
