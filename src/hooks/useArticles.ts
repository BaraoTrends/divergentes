import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SITE_URL } from "@/lib/seo";
import type { Json } from "@/integrations/supabase/types";

/** Fire-and-forget: notify Google Indexing API + ping search engines about a published URL */
async function notifySearchEngines(slug: string) {
  const url = `${SITE_URL}/blog/${slug}`;

  // 1. Google Indexing API (if service account configured)
  supabase.functions.invoke("google-indexing", {
    body: { urls: [url], type: "URL_UPDATED" },
  }).then(() => console.log("[Indexing] Google Indexing API enviado:", url))
    .catch((e) => console.warn("[Indexing] Google Indexing API falhou:", e));

  // 2. Ping Google/Bing sitemaps + IndexNow
  supabase.functions.invoke("ping-search-engines", {
    body: { url },
  }).then(() => console.log("[Indexing] Sitemap ping + IndexNow enviado:", url))
    .catch((e) => console.warn("[Indexing] Ping falhou:", e));
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  image_url: string | null;
  author_id: string;
  published: boolean;
  featured: boolean;
  read_time: number;
  tags: string[];
  custom_schema: Json | null;
  focus_keyword: string | null;
  how_to_steps: Json | null;
  created_at: string;
  updated_at: string;
}

export type ArticleInsert = Omit<Article, "id" | "created_at" | "updated_at">;
export type ArticleUpdate = Partial<ArticleInsert> & { id: string };

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useArticles(options?: { publishedOnly?: boolean }) {
  return useQuery({
    queryKey: ["articles", options?.publishedOnly],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (options?.publishedOnly) {
        query = query.eq("published", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Article[];
    },
  });
}

export function useArticleBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug is required");
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Article | null;
    },
    enabled: !!slug,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (article: Omit<ArticleInsert, "slug"> & { slug?: string }) => {
      const slug = generateSlug(article.slug || article.title);
      const { data, error } = await supabase
        .from("articles")
        .insert({ ...article, slug })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({ title: "Artigo criado com sucesso!" });
      if (data.published) {
        notifySearchEngines(data.slug);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar artigo", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ArticleUpdate) => {
      const { data, error } = await supabase
        .from("articles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({ title: "Artigo atualizado com sucesso!" });
      if (data.published) {
        notifySearchEngines(data.slug);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar artigo", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({ title: "Artigo excluído com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir artigo", description: error.message, variant: "destructive" });
    },
  });
}
