import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const AI_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-image-gen`;

interface UseAiImageGenOptions {
  onImageGenerated?: (url: string) => void;
}

export function useAiImageGen({ onImageGenerated }: UseAiImageGenOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImage = useCallback(
    async (prompt: string, purpose: "cover" | "inline" = "cover", style?: string) => {
      setIsGenerating(true);
      try {
        const resp = await fetch(AI_IMAGE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, purpose, style }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
          throw new Error(errData.error || `Erro ${resp.status}`);
        }

        const data = await resp.json();
        if (data.image_url) {
          onImageGenerated?.(data.image_url);
          toast({ title: "Imagem gerada com sucesso!" });
          return data.image_url;
        }
        throw new Error("Nenhuma imagem retornada");
      } catch (error: any) {
        toast({
          title: "Erro ao gerar imagem",
          description: error.message,
          variant: "destructive",
        });
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [onImageGenerated, toast]
  );

  return { generateImage, isGenerating };
}
