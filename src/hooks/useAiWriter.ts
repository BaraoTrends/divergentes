import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-writer`;

type AiAction = "generate_article" | "generate_full_article" | "generate_excerpt" | "improve_text" | "expand_text" | "generate_title" | "suggest_keywords" | "generate_focus_keyword" | "suggest_internal_links";

export interface FullArticleMeta {
  title: string;
  slug: string;
  excerpt: string;
  focus_keyword: string;
}

interface UseAiWriterOptions {
  onStream?: (text: string) => void;
  onComplete?: (text: string) => void;
  /** Fired once when generate_full_article emits its metadata JSON header */
  onMeta?: (meta: FullArticleMeta) => void;
}

export function useAiWriter({ onStream, onComplete, onMeta }: UseAiWriterOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generate = useCallback(
    async (
      action: AiAction,
      params: {
        topic?: string;
        content?: string;
        model?: string;
        focusKeyword?: string;
        secondaryKeywords?: string[];
        searchIntent?: string;
        slugHint?: string;
        category?: string;
        availableSlugs?: { slug: string; title: string }[];
      },
    ) => {
      setIsGenerating(true);
      let fullText = "";
      // For generate_full_article: split metadata header vs streamed content
      const isFullArticle = action === "generate_full_article";
      let metaParsed = false;
      let contentStarted = false;
      let contentBuffer = ""; // only the HTML portion (post-delimiter)
      const DELIMITER = "===CONTENT===";

      const handleChunk = (delta: string) => {
        fullText += delta;

        if (!isFullArticle) {
          onStream?.(fullText);
          return;
        }

        // Try to detect the delimiter and split metadata
        if (!contentStarted) {
          const idx = fullText.indexOf(DELIMITER);
          if (idx !== -1) {
            // Parse metadata (everything before delimiter, first line should be JSON)
            const header = fullText.slice(0, idx).trim();
            if (!metaParsed) {
              try {
                // Header may contain leading code fences/whitespace; extract first {...}
                const jsonMatch = header.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const meta = JSON.parse(jsonMatch[0]) as FullArticleMeta;
                  metaParsed = true;
                  onMeta?.(meta);
                }
              } catch (e) {
                console.warn("[useAiWriter] failed to parse meta header", e);
              }
            }
            contentStarted = true;
            contentBuffer = fullText.slice(idx + DELIMITER.length).replace(/^\s*\n?/, "");
            onStream?.(contentBuffer);
          }
          // else: still buffering header, do not stream yet
          return;
        }

        // Already past delimiter — append delta to content buffer
        contentBuffer += delta;
        onStream?.(contentBuffer);
      };

      try {
        const { model, ...restParams } = params;
        const resp = await fetch(AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action, ...restParams, model }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
          const msg = errData.error || `Erro ${resp.status}`;
          toast({
            title: resp.status === 402 ? "Créditos esgotados" : resp.status === 429 ? "Limite excedido" : "Erro na IA",
            description: resp.status === 402
              ? "Os créditos de IA foram esgotados. Adicione mais créditos em Settings → Workspace → Usage."
              : resp.status === 429
              ? "Muitas requisições. Aguarde alguns instantes e tente novamente."
              : msg,
            variant: "destructive",
          });
          return null;
        }

        if (!resp.body) throw new Error("Resposta sem conteúdo");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) handleChunk(content);
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        // Flush remaining
        if (buffer.trim()) {
          for (let raw of buffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) handleChunk(content);
            } catch {}
          }
        }

        // For full-article, if delimiter never appeared try a last-ditch parse
        if (isFullArticle && !contentStarted) {
          const jsonMatch = fullText.match(/\{[\s\S]*?\}/);
          if (jsonMatch && !metaParsed) {
            try {
              const meta = JSON.parse(jsonMatch[0]) as FullArticleMeta;
              onMeta?.(meta);
              contentBuffer = fullText.slice(jsonMatch.index! + jsonMatch[0].length).trim();
            } catch {}
          } else {
            contentBuffer = fullText;
          }
          onStream?.(contentBuffer);
        }

        const finalText = isFullArticle ? contentBuffer : fullText;
        onComplete?.(finalText);
        return finalText;
      } catch (error: any) {
        toast({
          title: "Erro na IA",
          description: error.message,
          variant: "destructive",
        });
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [onStream, onComplete, onMeta, toast]
  );

  return { generate, isGenerating };
}
