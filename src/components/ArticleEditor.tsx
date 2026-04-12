import { useState, useEffect } from "react";
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
import { ArrowLeft, Save, Eye } from "lucide-react";
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
  const [readTime, setReadTime] = useState(article?.read_time || 5);
  const [previewMode, setPreviewMode] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content,
      category,
      image_url: imageUrl.trim(),
      published,
      featured,
      read_time: readTime,
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
              <Label htmlFor="readTime">Tempo de leitura (min)</Label>
              <Input
                id="readTime"
                type="number"
                min={1}
                max={60}
                value={readTime}
                onChange={(e) => setReadTime(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Resumo</Label>
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
            <Label htmlFor="imageUrl">URL da imagem de capa</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo (Markdown) *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o conteúdo do artigo usando markdown..."
              rows={16}
              className="font-mono text-sm"
              required
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
