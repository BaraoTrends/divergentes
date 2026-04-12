import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAiWriter } from "@/hooks/useAiWriter";
import { useAiImageGen } from "@/hooks/useAiImageGen";
import {
  Sparkles,
  FileText,
  Wand2,
  Expand,
  Type,
  Loader2,
  ChevronDown,
  ChevronUp,
  ImageIcon,
} from "lucide-react";

interface AiAssistantPanelProps {
  content: string;
  onContentGenerated: (html: string) => void;
  onTitleGenerated?: (title: string) => void;
  onExcerptGenerated?: (excerpt: string) => void;
  onImageInserted?: (url: string) => void;
}

const AiAssistantPanel = ({
  content,
  onContentGenerated,
  onTitleGenerated,
  onExcerptGenerated,
  onImageInserted,
}: AiAssistantPanelProps) => {
  const [topic, setTopic] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [streamPreview, setStreamPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedModel, setSelectedModel] = useState("fast");
  const [imagePrompt, setImagePrompt] = useState("");

  const AI_MODELS = [
    { value: "fast", label: "⚡ Rápido", description: "Gemini Flash — respostas ágeis" },
    { value: "balanced", label: "⚖️ Equilibrado", description: "Gemini Flash — bom custo-benefício" },
    { value: "precise", label: "🎯 Preciso", description: "Gemini Pro — máxima qualidade" },
    { value: "gpt", label: "🧠 GPT-5", description: "OpenAI GPT-5 — raciocínio avançado" },
  ];

  const { generate, isGenerating } = useAiWriter({
    onStream: (text) => setStreamPreview(text),
  });

  const { generateImage, isGenerating: isGeneratingImage } = useAiImageGen({
    onImageGenerated: (url) => onImageInserted?.(url),
  });

  const handleGenerateInlineImage = async () => {
    if (!imagePrompt.trim()) return;
    await generateImage(imagePrompt.trim(), "inline");
    setImagePrompt("");
  };

  const handleGenerateArticle = async () => {
    if (!topic.trim()) return;
    setShowPreview(true);
    setStreamPreview("");
    const result = await generate("generate_article", { topic: topic.trim(), model: selectedModel });
    if (result) {
      onContentGenerated(result);
      setShowPreview(false);
      setStreamPreview("");
    }
  };

  const handleImproveText = async () => {
    if (!content.trim()) return;
    setShowPreview(true);
    setStreamPreview("");
    const result = await generate("improve_text", { content, model: selectedModel });
    if (result) {
      onContentGenerated(result);
      setShowPreview(false);
      setStreamPreview("");
    }
  };

  const handleExpandText = async () => {
    if (!content.trim()) return;
    setShowPreview(true);
    setStreamPreview("");
    const result = await generate("expand_text", { content, model: selectedModel });
    if (result) {
      onContentGenerated(result);
      setShowPreview(false);
      setStreamPreview("");
    }
  };

  const handleGenerateTitle = async () => {
    const result = await generate("generate_title", {
      topic: topic.trim() || undefined,
      content: content || undefined,
      model: selectedModel,
    });
    if (result && onTitleGenerated) {
      const firstLine = result.split("\n").find((l) => l.trim().match(/^\d+\./));
      if (firstLine) {
        onTitleGenerated(firstLine.replace(/^\d+\.\s*/, "").trim());
      }
    }
  };

  const handleGenerateExcerpt = async () => {
    if (!content.trim()) return;
    const result = await generate("generate_excerpt", { content, model: selectedModel });
    if (result && onExcerptGenerated) {
      onExcerptGenerated(result.trim());
    }
  };

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Assistente IA
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* Model selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Modelo de IA</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isGenerating}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    <span className="font-medium">{m.label}</span>
                    <span className="ml-1.5 text-muted-foreground">{m.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate from topic */}
          <div className="space-y-2">
            <Label className="text-xs">Gerar artigo sobre um tema</Label>
            <div className="flex gap-2">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: TDAH em mulheres adultas"
                className="text-sm"
                disabled={isGenerating}
                maxLength={200}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateArticle()}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateArticle}
                disabled={isGenerating || !topic.trim()}
                className="gap-1 shrink-0"
              >
                {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Gerar
              </Button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Label className="text-xs">Ações sobre o conteúdo atual</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImproveText}
                disabled={isGenerating || !content.trim()}
                className="gap-1 text-xs"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Melhorar texto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExpandText}
                disabled={isGenerating || !content.trim()}
                className="gap-1 text-xs"
              >
                <Expand className="h-3.5 w-3.5" />
                Expandir
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateTitle}
                disabled={isGenerating || (!content.trim() && !topic.trim())}
                className="gap-1 text-xs"
              >
                <Type className="h-3.5 w-3.5" />
                Sugerir título
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateExcerpt}
                disabled={isGenerating || !content.trim()}
                className="gap-1 text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                Gerar resumo
              </Button>
            </div>
          </div>

          {/* Stream preview */}
          {showPreview && streamPreview && (
            <div className="border rounded-md p-3 bg-muted/30 max-h-48 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Gerando...
              </p>
              <div
                className="prose prose-xs max-w-none text-sm text-foreground"
                dangerouslySetInnerHTML={{ __html: streamPreview }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiAssistantPanel;
