import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IndexingResult {
  url: string;
  status: string;
  error?: string;
}

export const useGoogleIndexing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<IndexingResult[]>([]);
  const { toast } = useToast();

  const submitUrls = async (urls: string[], type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED") => {
    setIsLoading(true);
    setResults([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await supabase.functions.invoke("google-indexing", {
        body: { urls, type },
      });

      if (res.error) throw res.error;

      const data = res.data as { results: IndexingResult[]; error?: string };

      if (data.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }

      setResults(data.results);
      const ok = data.results.filter((r) => r.status === "ok").length;
      const fail = data.results.filter((r) => r.status === "error").length;

      toast({
        title: "Indexação enviada",
        description: `${ok} URL(s) enviada(s) com sucesso${fail > 0 ? `, ${fail} erro(s)` : ""}`,
        variant: fail > 0 ? "destructive" : "default",
      });
    } catch (e: any) {
      toast({ title: "Erro ao indexar", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return { submitUrls, isLoading, results };
};
