import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-writer`;

type AiAction = "generate_article" | "generate_excerpt" | "improve_text" | "expand_text" | "generate_title" | "suggest_keywords" | "generate_focus_keyword";

interface UseAiWriterOptions {
  onStream?: (text: string) => void;
  onComplete?: (text: string) => void;
}

export function useAiWriter({ onStream, onComplete }: UseAiWriterOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generate = useCallback(
    async (action: AiAction, params: { topic?: string; content?: string; model?: string }) => {
      setIsGenerating(true);
      let fullText = "";

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
              if (content) {
                fullText += content;
                onStream?.(fullText);
              }
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
              if (content) {
                fullText += content;
                onStream?.(fullText);
              }
            } catch {}
          }
        }

        onComplete?.(fullText);
        return fullText;
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
    [onStream, onComplete, toast]
  );

  return { generate, isGenerating };
}
