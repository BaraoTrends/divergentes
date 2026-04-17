import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link2, Loader2, Plus, Sparkles } from "lucide-react";

interface LinkSuggestion {
  slug: string;
  anchor: string;
  reason: string;
}

interface Props {
  content: string;
  currentSlug: string;
  category: string;
  onInsertLink: (anchor: string, href: string) => void;
  disabled?: boolean;
}

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-writer`;

const AiInternalLinksSuggester = ({
  content,
  currentSlug,
  category,
  onInsertLink,
  disabled,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const { toast } = useToast();

  const fetchSuggestions = async () => {
    if (!content.trim() || content.length < 200) {
      toast({
        title: "Conteúdo muito curto",
        description: "Escreva ou gere o artigo antes de pedir sugestões de links.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setSuggestions([]);
    try {
      // Fetch existing slugs from DB (excluding current)
      const { data: articles, error: dbErr } = await supabase
        .from("articles")
        .select("slug, title, category")
        .eq("published", true)
        .neq("slug", currentSlug || "__none__")
        .order("created_at", { ascending: false })
        .limit(80);

      if (dbErr) throw dbErr;
      if (!articles || articles.length === 0) {
        toast({ title: "Nenhum artigo disponível", description: "Publique outros artigos primeiro." });
        return;
      }

      // Prioritize same-category first
      const sorted = [...articles].sort((a, b) => {
        if (a.category === category && b.category !== category) return -1;
        if (b.category === category && a.category !== category) return 1;
        return 0;
      });

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "suggest_internal_links",
          content,
          availableSlugs: sorted.map((a) => ({ slug: a.slug, title: a.title })),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      // Parse SSE stream
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("Sem resposta");
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) full += c;
          } catch {}
        }
      }

      const match = full.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Resposta da IA inválida");
      const data = JSON.parse(match[0]);
      const validSlugs = new Set(articles.map((a) => a.slug));
      const filtered = (data.links || []).filter(
        (l: LinkSuggestion) => l.slug && l.anchor && validSlugs.has(l.slug),
      );

      if (filtered.length === 0) {
        toast({
          title: "Nenhuma sugestão relevante",
          description: "A IA não encontrou links contextuais.",
        });
      }
      setSuggestions(filtered);
    } catch (e: any) {
      toast({
        title: "Erro ao sugerir links",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5 text-primary" />
          Links internos sugeridos pela IA
        </Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={fetchSuggestions}
          disabled={disabled || loading}
          className="h-7 text-xs gap-1"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {suggestions.length > 0 ? "Atualizar" : "Sugerir"}
        </Button>
      </div>

      {suggestions.length === 0 && !loading && (
        <p className="text-[11px] text-muted-foreground">
          Clique em Sugerir para a IA analisar o artigo e propor links internos relevantes baseados
          em outros artigos publicados.
        </p>
      )}

      {suggestions.length > 0 && (
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="border rounded-md p-2 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">
                    "{s.anchor}"
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    /blog/{s.slug}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 italic">{s.reason}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px] gap-1 shrink-0"
                  onClick={() => onInsertLink(s.anchor, `/blog/${s.slug}`)}
                >
                  <Plus className="h-3 w-3" />
                  Inserir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AiInternalLinksSuggester;
