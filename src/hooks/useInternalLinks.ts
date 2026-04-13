import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@/hooks/useArticles";

export interface InternalLink {
  id: string;
  source_article_id: string;
  target_article_id: string;
  anchor_text: string;
  auto_generated: boolean;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export function useInternalLinks() {
  return useQuery({
    queryKey: ["internal-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_internal_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InternalLink[];
    },
  });
}

export function useInternalLinksForArticle(articleId: string | undefined) {
  return useQuery({
    queryKey: ["internal-links", articleId],
    queryFn: async () => {
      if (!articleId) return [];
      const { data, error } = await supabase
        .from("article_internal_links")
        .select("*")
        .or(`source_article_id.eq.${articleId},target_article_id.eq.${articleId}`)
        .eq("approved", true);
      if (error) throw error;
      return data as InternalLink[];
    },
    enabled: !!articleId,
  });
}

export function useApproveLink() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("article_internal_links")
        .update({ approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["internal-links"] });
      toast({ title: "Link atualizado!" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteInternalLink() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("article_internal_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["internal-links"] });
      toast({ title: "Link removido!" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useCreateInternalLink() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (link: { source_article_id: string; target_article_id: string; anchor_text: string; auto_generated: boolean; approved: boolean }) => {
      const { data, error } = await supabase
        .from("article_internal_links")
        .insert(link)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["internal-links"] });
    },
    onError: () => {}, // silently ignore duplicates
  });
}

/**
 * Generates auto-link suggestions based on category and content keyword overlap.
 */
export function generateLinkSuggestions(articles: Article[]): Array<{
  source: Article;
  target: Article;
  anchor_text: string;
  reason: string;
}> {
  const suggestions: Array<{ source: Article; target: Article; anchor_text: string; reason: string }> = [];
  const published = articles.filter((a) => a.published);

  for (const source of published) {
    for (const target of published) {
      if (source.id === target.id) continue;

      // Same category = strong relevance
      if (source.category === target.category) {
        suggestions.push({
          source,
          target,
          anchor_text: target.title,
          reason: `Mesma categoria: ${source.category}`,
        });
        continue;
      }

      // Check keyword overlap in title/excerpt
      const sourceWords = extractKeywords(source.title + " " + (source.excerpt || ""));
      const targetWords = extractKeywords(target.title + " " + (target.excerpt || ""));
      const overlap = sourceWords.filter((w) => targetWords.includes(w));

      if (overlap.length >= 2) {
        suggestions.push({
          source,
          target,
          anchor_text: target.title,
          reason: `Palavras em comum: ${overlap.slice(0, 3).join(", ")}`,
        });
      }
    }
  }

  return suggestions;
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "o", "a", "os", "as", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
    "em", "no", "na", "nos", "nas", "por", "para", "com", "sem", "sob", "sobre",
    "e", "ou", "mas", "que", "se", "não", "como", "mais", "muito", "ao", "à",
    "entre", "até", "já", "ser", "ter", "sua", "seu", "seus", "suas", "ele", "ela",
    "são", "é", "foi", "pode", "podem", "isso", "este", "esta", "esse", "essa",
  ]);

  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\W+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));
}
