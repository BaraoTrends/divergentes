import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/lib/content";
import RichTextEditor from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Eye, Upload, X, ImageIcon, Sparkles, Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import SeoChecker from "@/components/SeoChecker";
import { useAiImageGen } from "@/hooks/useAiImageGen";
import { useAiWriter } from "@/hooks/useAiWriter";
import type { Article } from "@/hooks/useArticles";

interface ArticleEditorProps {
  article?: Article | null;
  onSave: (data: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    image_url: string;
    published: boolean;
    featured: boolean;
    read_time: number;
    author_id: string;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
  userId: string;
}

const ArticleEditor = ({ article, onSave, onCancel, saving, userId }: ArticleEditorProps) => {
  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [content, setContent] = useState(article?.content || "");
  const [category, setCategory] = useState(article?.category || "tdah");
  const [imageUrl, setImageUrl] = useState(article?.image_url || "");
  const [published, setPublished] = useState(article?.published || false);
  const [featured, setFeatured] = useState(article?.featured || false);
  
  const [focusKeyword, setFocusKeyword] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverPrompt, setCoverPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { generateImage, isGenerating: isGeneratingCover } = useAiImageGen({
    onImageGenerated: (url) => setImageUrl(url),
  });
  const { generate: generateExcerpt, isGenerating: isGeneratingExcerpt } = useAiWriter({
    onComplete: (text) => setExcerpt(text.trim()),
  });

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  useEffect(() => {
    if (!article) {
      setSlug(generateSlug(title));
    }
  }, [title, article]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use imagens JPG, PNG, WebP ou GIF.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("article-images")
        .getPublicUrl(filePath);

      setImageUrl(urlData.publicUrl);
      toast({ title: "Imagem enviada com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setImageUrl("");
  };

  const getPlainTextFromHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const plainText = getPlainTextFromHtml(content);
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = plainText.trim().length;
  const meetsMinimum = wordCount >= 400 || charCount >= 3000;
  const calculatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetsMinimum) {
      toast({
        title: "Conteúdo insuficiente",
        description: `O artigo precisa ter no mínimo 400 palavras ou 3.000 caracteres. Atual: ${wordCount} palavras / ${charCount} caracteres.`,
        variant: "destructive",
      });
      return;
    }
    onSave({
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content,
      category,
      image_url: imageUrl.trim(),
      published,
      featured,
      read_time: calculatedReadTime,
      author_id: article?.author_id || userId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onCancel} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="gap-1"
          >
            <Eye className="h-4 w-4" /> {previewMode ? "Editar" : "Prévia"}
          </Button>
          <Button type="submit" size="sm" disabled={saving || !title.trim() || !content.trim()} className="gap-1">
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <div className="bg-card border rounded-lg p-6">
          {imageUrl && (
            <div className="rounded-lg overflow-hidden mb-4">
              <img src={imageUrl} alt={title} className="w-full h-auto max-h-64 object-cover" />
            </div>
          )}
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">{title || "Sem título"}</h1>
          <p className="text-muted-foreground mb-4">{excerpt}</p>
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{content}</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do artigo"
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="slug-do-artigo"
                maxLength={200}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.icon} {cat.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tempo de leitura</Label>
              <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground">
                ⏱ {calculatedReadTime} min (automático: {wordCount} palavras ÷ 200)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="excerpt">Resumo</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={isGeneratingExcerpt || !content.trim()}
                  onClick={() => generateExcerpt("generate_excerpt", { content })}
                >
                  {isGeneratingExcerpt ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  Gerar com IA
                </Button>
              </div>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Breve descrição do artigo..."
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="focusKeyword">Palavra-chave foco</Label>
              <Input
                id="focusKeyword"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="Ex: TDAH em adultos"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">Usada para análise de densidade SEO.</p>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Imagem de Capa</Label>
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border bg-muted">
                <img
                  src={imageUrl}
                  alt="Capa do artigo"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || isGeneratingCover}
                  className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      <span className="text-sm">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-sm font-medium">Clique para enviar uma imagem</span>
                      <span className="text-xs">JPG, PNG, WebP ou GIF • Máx. 5MB</span>
                    </>
                  )}
                </button>

                {/* AI Image Generation */}
                <div className="flex gap-2">
                  <Input
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                    placeholder="Descreva a imagem de capa desejada..."
                    className="text-sm"
                    disabled={isGeneratingCover}
                    onKeyDown={(e) => e.key === "Enter" && coverPrompt.trim() && generateImage(coverPrompt.trim(), "cover")}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => generateImage(coverPrompt.trim() || title || "neurodiversidade", "cover")}
                    disabled={isGeneratingCover}
                    className="gap-1 shrink-0"
                  >
                    {isGeneratingCover ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Gerar com IA
                  </Button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* SEO Checker */}
          <SeoChecker
            title={title}
            excerpt={excerpt}
            content={content}
            slug={slug}
            imageUrl={imageUrl}
            focusKeyword={focusKeyword}
            onKeywordClick={(kw) => {
              navigator.clipboard.writeText(kw);
              toast({ title: `"${kw}" copiada!`, description: "Palavra-chave copiada para a área de transferência." });
            }}
          />

          {/* AI Assistant */}
          <AiAssistantPanel
            content={content}
            onContentGenerated={(html) => setContent(html)}
            onTitleGenerated={(t) => setTitle(t)}
            onExcerptGenerated={(e) => setExcerpt(e)}
            onImageInserted={(url) => {
              const imgTag = `<img src="${url}" alt="Imagem gerada por IA" style="max-width:100%;height:auto;border-radius:8px;margin:1em 0" />`;
              setContent((prev) => prev + imgTag);
            }}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Conteúdo *</Label>
              <span className={`text-xs ${meetsMinimum ? "text-green-600" : "text-destructive"}`}>
                {wordCount} palavras • {charCount} caracteres {meetsMinimum ? "✓" : `(mín. 400 palavras ou 3.000 caracteres)`}
              </span>
            </div>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Comece a escrever o conteúdo do artigo..."
            />
          </div>

          <div className="flex items-center gap-6 p-4 bg-card border rounded-lg">
            <div className="flex items-center gap-2">
              <Switch id="published" checked={published} onCheckedChange={setPublished} />
              <Label htmlFor="published">Publicado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
              <Label htmlFor="featured">Destaque</Label>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default ArticleEditor;
