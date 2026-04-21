import { useState, useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
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
import Base64ImageWarning from "@/components/Base64ImageWarning";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Eye, Upload, X, ImageIcon, Sparkles, Loader2, Wand2, FileText, Send, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import TopicSlider from "@/components/TopicSlider";
import SeoChecker from "@/components/SeoChecker";
import SeoBriefingPanel, { type SeoBriefing } from "@/components/SeoBriefingPanel";
import AiInternalLinksSuggester from "@/components/editor/AiInternalLinksSuggester";
import HowToStepsEditor, { type HowToStepInput } from "@/components/editor/HowToStepsEditor";
import { analyzeSeo, calculateScore } from "@/lib/seoAnalysis";
import { useAiImageGen } from "@/hooks/useAiImageGen";
import { useAiWriter } from "@/hooks/useAiWriter";
import type { Article } from "@/hooks/useArticles";

import coverIlustracao from "@/assets/cover-styles/ilustracao.jpg";
import coverFotografia from "@/assets/cover-styles/fotografia.jpg";
import coverMinimalista from "@/assets/cover-styles/minimalista.jpg";
import coverAquarela from "@/assets/cover-styles/aquarela.jpg";
import coverFlat from "@/assets/cover-styles/flat.jpg";
import coverAbstrato from "@/assets/cover-styles/abstrato.jpg";

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
    tags: string[];
    author_id: string;
    focus_keyword?: string;
    how_to_steps?: HowToStepInput[] | null;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
  userId: string;
}

const COVER_STYLES = [
  { value: "ilustracao", label: "🎨 Ilustração", prompt: "Ilustração digital profissional e acolhedora, estilo editorial moderno, cores suaves e inclusivas", thumb: coverIlustracao },
  { value: "fotografia", label: "📷 Fotografia", prompt: "Fotografia profissional editorial, iluminação natural, composição equilibrada, cores quentes", thumb: coverFotografia },
  { value: "minimalista", label: "✨ Minimalista", prompt: "Design minimalista e limpo, formas geométricas simples, paleta de cores reduzida, muito espaço negativo", thumb: coverMinimalista },
  { value: "aquarela", label: "🖌️ Aquarela", prompt: "Pintura em aquarela suave e delicada, tons pastel, bordas fluidas e orgânicas", thumb: coverAquarela },
  { value: "flat", label: "🟦 Flat Design", prompt: "Flat design moderno com cores vibrantes, sem sombras, ícones e formas vetoriais", thumb: coverFlat },
  { value: "abstrato", label: "🌀 Abstrato", prompt: "Arte abstrata contemporânea, formas fluidas e orgânicas, gradientes suaves, textura sutil", thumb: coverAbstrato },
];

const ArticleEditor = ({ article, onSave, onCancel, saving, userId }: ArticleEditorProps) => {
  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [content, setContent] = useState(article?.content || "");
  const [category, setCategory] = useState(article?.category || "tdah");
  const [imageUrl, setImageUrl] = useState(article?.image_url || "");
  const [published, setPublished] = useState(article?.published || false);
  const [featured, setFeatured] = useState(article?.featured || false);
  const [tags, setTags] = useState<string[]>(article?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [focusKeyword, setFocusKeyword] = useState(article?.focus_keyword || "");
  const [howToSteps, setHowToSteps] = useState<HowToStepInput[]>(() => {
    const raw = (article as unknown as { how_to_steps?: unknown })?.how_to_steps;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
      .map((s) => ({
        name: typeof s.name === "string" ? s.name : "",
        text: typeof s.text === "string" ? s.text : "",
        image: typeof s.image === "string" ? s.image : "",
      }));
  });
  const [briefing, setBriefing] = useState<SeoBriefing>({
    focusKeyword: article?.focus_keyword || "",
    secondaryKeywords: article?.tags?.filter((t) => t.includes(" ")).slice(0, 8) || [],
    searchIntent: "informacional",
    slugHint: "",
    autoInsertLinks: true,
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverPrompt, setCoverPrompt] = useState("");
  const [coverStyle, setCoverStyle] = useState("ilustracao");
  const coverStyleRef = useRef(coverStyle);
  useEffect(() => { coverStyleRef.current = coverStyle; }, [coverStyle]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const { toast } = useToast();
  const { generateImage, isGenerating: isGeneratingCover } = useAiImageGen({
    onImageGenerated: (url) => setImageUrl(url),
  });
  const { generate: generateExcerpt, isGenerating: isGeneratingExcerpt } = useAiWriter({
    onComplete: (text) => setExcerpt(text.trim()),
  });
  const { generate: generateKeywords, isGenerating: isGeneratingTags } = useAiWriter({
    onComplete: (text) => {
      try {
        // Clean potential markdown code fences
        const clean = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(clean);
        const keywords: string[] = parsed.keywords?.map((k: any) => k.term) || [];
        if (keywords.length > 0) {
          setTags((prev) => [...new Set([...prev, ...keywords])]);
          setFocusKeyword((prev) => prev.trim() ? prev : keywords[0]);
        }
      } catch {
        // If not JSON, try comma-separated
        const fallback = text.split(/[,\n]/).map((t: string) => t.trim()).filter(Boolean);
        if (fallback.length > 0) {
          setTags((prev) => [...new Set([...prev, ...fallback])]);
          setFocusKeyword((prev) => prev.trim() ? prev : fallback[0]);
        }
      }
    },
  });
  const pendingFocusKwRef = useRef<string>("");
  const { generate: generateFocusKw, isGenerating: isGeneratingFocusKw } = useAiWriter({
    onComplete: (text) => {
      const clean = text.replace(/```/g, "").replace(/"/g, "").trim();
      const keyword = clean.split("\n").map(l => l.replace(/^\d+\.\s*/, "").trim()).filter(Boolean)[0];
      if (keyword) {
        const kw = keyword.toLowerCase();
        setFocusKeyword(kw);
        pendingFocusKwRef.current = kw;
        // If auto-generating, now generate the article WITH the focus keyword
        if (autoGeneratingRef.current && pendingTopicRef.current) {
          generateArticleFromTopic("generate_article", {
            topic: pendingTopicRef.current,
            focusKeyword: kw,
          });
        }
      }
    },
  });
  const { generate: generateTitle, isGenerating: isGeneratingTitle } = useAiWriter({
    onComplete: (text) => {
      // Split by newlines first, then clean each line
      const lines = text.split(/\r?\n/).map(l => l.replace(/```/g, "").replace(/"/g, "").replace(/^\d+[\.\)]\s*/, "").trim()).filter(Boolean);
      // Take the first valid line that's under 70 chars
      const suggestion = lines.find(l => l.length > 5 && l.length <= 70) || lines[0];
      if (suggestion) setTitle(suggestion.slice(0, 65));
    },
  });

  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const autoGeneratingRef = useRef(false);
  const pendingTopicRef = useRef<string>("");
  const { generate: generateTopics, isGenerating: isGeneratingTopics } = useAiWriter({
    onComplete: (text) => {
      const lines = text.split("\n").map(l => l.replace(/^\d+[\.\)]\s*/, "").trim()).filter(Boolean);
      setTopicSuggestions(lines.slice(0, 8));
    },
  });
  const { generate: generateArticleFromTopic, isGenerating: isGeneratingArticle } = useAiWriter({
    onStream: (text) => setContent(text),
    onComplete: (html) => {
      setContent(html);
      setAutoGenerating(false);
      autoGeneratingRef.current = false;
      toast({ title: "Artigo gerado com sucesso!", description: "Gerando imagem de capa..." });
      // Auto-generate excerpt with focus keyword, and keywords
      const kw = pendingFocusKwRef.current || undefined;
      generateExcerpt("generate_excerpt", { content: html, focusKeyword: kw });
      generateKeywords("suggest_keywords", { topic: pendingTopicRef.current || "artigo" });
      // Auto-generate cover image with selected style
      const coverTopic = pendingTopicRef.current;
      if (coverTopic) {
        const styleObj = COVER_STYLES.find(s => s.value === coverStyleRef.current) || COVER_STYLES[0];
        generateImage(
          `${styleObj.prompt} para artigo sobre: ${coverTopic}. Sem texto na imagem.`,
          "cover"
        );
      }
    },
  });

  // ===== Auto-suggest + auto-insert internal links after a fresh full-article generation =====
  const autoLinksRef = useRef(false);
  const autoInsertInternalLinks = useCallback(async (html: string) => {
    try {
      const { data: dbArticles } = await supabase
        .from("articles")
        .select("slug, title, category")
        .eq("published", true)
        .neq("slug", slug || "__none__")
        .order("created_at", { ascending: false })
        .limit(80);
      if (!dbArticles || dbArticles.length === 0) return;

      // Same-category first
      const sorted = [...dbArticles].sort((a, b) => {
        if (a.category === category && b.category !== category) return -1;
        if (b.category === category && a.category !== category) return 1;
        return 0;
      });

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-writer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "suggest_internal_links",
          content: html,
          availableSlugs: sorted.map((a) => ({ slug: a.slug, title: a.title })),
        }),
      });
      if (!resp.ok) return;

      const reader = resp.body?.getReader();
      if (!reader) return;
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
      if (!match) return;
      const data = JSON.parse(match[0]);
      const validSlugs = new Set(dbArticles.map((a) => a.slug));
      const picks = (data.links || [])
        .filter((l: any) => l?.slug && l?.anchor && validSlugs.has(l.slug))
        .slice(0, 3);
      if (picks.length === 0) return;

      const escape = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // Try to insert each pick INLINE inside a <p>...</p> by replacing the first
      // exact (case-insensitive) occurrence of the anchor text that is NOT already
      // inside a tag or an existing <a>. Cap inline insertions at 2.
      const tryInlineInsert = (sourceHtml: string, anchor: string, slugVal: string): string | null => {
        const safeAnchor = escapeRegex(anchor.trim());
        if (!safeAnchor) return null;
        // Match anchor inside a <p>…</p>, but skip if anchor is inside an <a>...</a>.
        // Strategy: walk paragraphs, find first one containing the anchor (case-insensitive)
        // outside any existing <a> tag, and replace just that occurrence.
        const paraRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
        let result = sourceHtml;
        let replaced = false;
        result = result.replace(paraRegex, (full, inner: string) => {
          if (replaced) return full;
          // Skip if this paragraph already contains a link to the same slug
          if (inner.includes(`href="/blog/${slugVal}"`)) return full;
          // Strip existing <a>...</a> blocks to know "free text" zones
          // Simpler: find anchor outside <a> tags using a tokenized approach
          // Build regex with case-insensitive, word-ish boundaries (\b doesn't work well in PT, use lookarounds)
          const re = new RegExp(
            `(^|[^a-zA-Z0-9À-ÿ>])(${safeAnchor})(?=[^a-zA-Z0-9À-ÿ<]|$)`,
            "i",
          );
          // Skip if match is inside an <a> tag — quick heuristic: check that the
          // substring before the match in this <p> doesn't have an unclosed <a.
          const m = inner.match(re);
          if (!m || m.index === undefined) return full;
          const matchStart = m.index + m[1].length;
          const before = inner.slice(0, matchStart);
          const openA = (before.match(/<a\b/gi) || []).length;
          const closeA = (before.match(/<\/a>/gi) || []).length;
          if (openA > closeA) return full; // inside an existing <a>
          const matched = m[2];
          const newInner =
            before +
            `<a href="/blog/${escape(slugVal)}">${escape(matched)}</a>` +
            inner.slice(matchStart + matched.length);
          replaced = true;
          return full.replace(inner, newInner);
        });
        return replaced ? result : null;
      };

      let working = "";
      // Defer reading prev content until inside setContent for atomicity
      let inlineInserted = 0;
      const remaining: { slug: string; anchor: string }[] = [];

      setContent((prev) => {
        working = prev;
        // Skip if we already injected once
        if (working.includes("<h3>Leia também</h3>")) return working;

        for (const p of picks) {
          if (inlineInserted < 2) {
            const next = tryInlineInsert(working, p.anchor, p.slug);
            if (next) {
              working = next;
              inlineInserted++;
              continue;
            }
          }
          remaining.push({ slug: p.slug, anchor: p.anchor });
        }

        // Append remaining as "Leia também" so all 3 picks are used
        if (remaining.length > 0) {
          const items = remaining
            .map(
              (p) =>
                `<li><a href="/blog/${escape(p.slug)}">${escape(p.anchor)}</a></li>`,
            )
            .join("");
          working += `\n<h3>Leia também</h3>\n<ul>${items}</ul>\n`;
        }

        return working;
      });

      const totalInserted = inlineInserted + remaining.length;
      toast({
        title: "Links internos inseridos",
        description:
          inlineInserted > 0
            ? `${inlineInserted} inline + ${remaining.length} em "Leia também" (${totalInserted} total).`
            : `${totalInserted} sugestões adicionadas em "Leia também".`,
      });
    } catch (e) {
      console.warn("[autoInsertInternalLinks] falhou:", e);
    }
  }, [category, slug, toast]);

  // ===== Geração unificada (título + slug + meta + focus_keyword + conteúdo) =====
  const { generate: generateFullArticle, isGenerating: isGeneratingFull } = useAiWriter({
    onMeta: (meta) => {
      if (meta.title) setTitle(meta.title.slice(0, 65));
      if (meta.slug) setSlug(generateSlug(meta.slug));
      if (meta.excerpt) setExcerpt(meta.excerpt.trim());
      if (meta.focus_keyword) {
        const kw = meta.focus_keyword.toLowerCase().trim();
        setFocusKeyword(kw);
        setBriefing((prev) => prev.focusKeyword.trim() ? prev : { ...prev, focusKeyword: kw });
      }
      toast({ title: "Metadados gerados", description: "Título, slug e meta description preenchidos. Conteúdo em geração..." });
    },
    onStream: (html) => setContent(html),
    onComplete: (html) => {
      setContent(html);
      toast({ title: "Artigo completo gerado!", description: "Título, slug, meta e conteúdo prontos." });
      // Auto-cover image
      const topic = briefing.focusKeyword.trim() || title || "neurodivergência";
      const styleObj = COVER_STYLES.find(s => s.value === coverStyleRef.current) || COVER_STYLES[0];
      generateImage(`${styleObj.prompt} para artigo sobre: ${topic}. Sem texto na imagem.`, "cover");
      // Auto-insert internal links (only once per generation, only if toggle is on)
      if (!briefing.autoInsertLinks) return;
      if (autoLinksRef.current) return;
      autoLinksRef.current = true;
      autoInsertInternalLinks(html).finally(() => {
        // Allow next manual generation to trigger again
        setTimeout(() => { autoLinksRef.current = false; }, 2000);
      });
    },
  });

  const handleGenerateFullArticle = () => {
    const topic = title.trim() || briefing.focusKeyword.trim();
    if (!topic) {
      toast({
        title: "Defina o tema",
        description: "Preencha o título OU a palavra-chave foco no Briefing SEO antes de gerar.",
        variant: "destructive",
      });
      return;
    }
    autoLinksRef.current = false;
    generateFullArticle("generate_full_article", {
      topic,
      focusKeyword: briefing.focusKeyword.trim() || focusKeyword.trim() || undefined,
      secondaryKeywords: briefing.secondaryKeywords,
      searchIntent: briefing.searchIntent,
      slugHint: briefing.slugHint.trim() || undefined,
      category,
    });
  };

  const handleSuggestTopics = async () => {
    const cat = categories.find(c => c.slug === category);
    const catName = cat?.name || category;

    // Fetch existing article titles to avoid keyword cannibalization
    let existingTitles: string[] = [];
    try {
      const { data } = await supabase
        .from("articles")
        .select("title, slug")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) existingTitles = data.map(a => a.title);
    } catch {}

    const avoidList = existingTitles.length > 0
      ? `\n\nIMPORTANTE: Já existem os seguintes artigos publicados no blog. NÃO sugira temas iguais ou muito semelhantes a estes para evitar canibalização de palavras-chave:\n${existingTitles.map(t => `- ${t}`).join("\n")}`
      : "";

    generateTopics("generate_title", {
      topic: catName,
      content: `Categoria: ${catName}. Descrição: ${cat?.description || ""}. Sugira 8 títulos de artigos sobre ${catName} voltados para pessoas neurodivergentes, familiares e educadores. Os títulos devem ser naturais, como se fossem artigos reais de um portal de saúde ou educação — NÃO use títulos que mencionem "blog", "ideias de conteúdo", "temas para blog", "estratégicos" ou qualquer referência a criação de conteúdo. Foque em títulos informativos, práticos e acolhedores que alguém pesquisaria no Google (ex: "Como identificar sinais de dislexia em crianças", "TDAH na vida adulta: o que ninguém te conta"). Cada título deve abordar um ângulo diferente para não competir entre si.${avoidList}`,
    });
  };

  const handleSelectTopic = (suggestion: string) => {
    setTitle(suggestion);
    pendingTopicRef.current = suggestion;
    setTopicSuggestions([]);
    setAutoGenerating(true);
    autoGeneratingRef.current = true;
    // First generate focus keyword, then use it to generate the article (in onComplete callback)
    generateFocusKw("generate_focus_keyword", { topic: suggestion });
  };

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

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
      // If user provided a slugHint in briefing, prefer it; otherwise auto from title
      const next = briefing.slugHint.trim() ? generateSlug(briefing.slugHint) : generateSlug(title);
      setSlug(next);
    }
  }, [title, article, briefing.slugHint]);

  // Keep briefing.focusKeyword and main focusKeyword in sync (briefing is source of truth when filled)
  useEffect(() => {
    if (briefing.focusKeyword.trim() && briefing.focusKeyword !== focusKeyword) {
      setFocusKeyword(briefing.focusKeyword);
    }
  }, [briefing.focusKeyword]);

  // Auto-add briefing secondary keywords as tags
  useEffect(() => {
    if (briefing.secondaryKeywords.length > 0) {
      setTags((prev) => [...new Set([...prev, ...briefing.secondaryKeywords])]);
    }
  }, [briefing.secondaryKeywords]);

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

  // SEO score (live)
  const seoChecks = analyzeSeo({ title, excerpt, content, slug, imageUrl, focusKeyword });
  const seoScore = calculateScore(seoChecks);
  const criticalErrors = seoChecks.filter((c) => c.status === "error").length;

  const seoBlockedReason = (): string | null => {
    if (criticalErrors > 0) {
      const labels = seoChecks
        .filter((c) => c.status === "error")
        .map((c) => `• ${c.label}: ${c.message}`)
        .join("\n");
      return `Falhas críticas de SEO:\n${labels}`;
    }
    if (seoScore < 60) return `Score SEO baixo (${seoScore}%). Mínimo recomendado: 60%.`;
    return null;
  };

  const cleanedHowToSteps = (): HowToStepInput[] | null => {
    const cleaned = howToSteps
      .map((s) => ({
        name: (s.name || "").trim(),
        text: (s.text || "").trim(),
        image: (s.image || "").trim(),
      }))
      .filter((s) => s.name.length > 0)
      .map((s) => ({
        name: s.name,
        ...(s.text ? { text: s.text } : {}),
        ...(s.image ? { image: s.image } : {}),
      }));
    return cleaned.length > 0 ? cleaned : null;
  };

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
      tags,
      author_id: article?.author_id || userId,
      focus_keyword: focusKeyword.trim(),
      how_to_steps: cleanedHowToSteps(),
    });
  };

  const handlePublish = () => {
    if (!meetsMinimum) {
      toast({
        title: "Conteúdo insuficiente",
        description: `O artigo precisa ter no mínimo 400 palavras ou 3.000 caracteres. Atual: ${wordCount} palavras / ${charCount} caracteres.`,
        variant: "destructive",
      });
      return;
    }
    const blocked = seoBlockedReason();
    if (blocked) {
      const proceed = window.confirm(
        `⚠️ Validação SEO falhou\n\n${blocked}\n\nScore atual: ${seoScore}%.\n\nDeseja publicar mesmo assim?`,
      );
      if (!proceed) {
        toast({
          title: "Publicação bloqueada pelo validador SEO",
          description: "Corrija as falhas e tente novamente.",
          variant: "destructive",
        });
        return;
      }
    }
    onSave({
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content,
      category,
      image_url: imageUrl.trim(),
      published: true,
      featured,
      read_time: calculatedReadTime,
      tags,
      author_id: article?.author_id || userId,
      focus_keyword: focusKeyword.trim(),
      how_to_steps: cleanedHowToSteps(),
    });
  };

  const handleSaveAsDraft = () => {
    onSave({
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content,
      category,
      image_url: imageUrl.trim(),
      published: false,
      featured,
      read_time: calculatedReadTime,
      tags,
      author_id: article?.author_id || userId,
      focus_keyword: focusKeyword.trim(),
      how_to_steps: cleanedHowToSteps(),
    });
  };

  const insertInternalLink = (anchor: string, href: string) => {
    const editor = editorInstanceRef.current;
    const safeAnchor = anchor.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const linkHtml = `<a href="${href}">${safeAnchor}</a>`;
    if (editor) {
      editor.chain().focus().insertContent(` ${linkHtml} `).run();
    } else {
      setContent((prev) => prev + ` <p>${linkHtml}</p>`);
    }
    toast({ title: "Link inserido", description: anchor });
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onCancel} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="gap-1"
          >
            <Eye className="h-4 w-4" /> {previewMode ? "Editar" : "Prévia"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving || !title.trim()}
            onClick={handleSaveAsDraft}
            className="gap-1"
          >
            <FileText className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar Rascunho"}
          </Button>
          {content.trim() && (
            <span
              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                seoScore >= 80
                  ? "bg-green-500/15 text-green-700 border border-green-500/30"
                  : seoScore >= 60
                  ? "bg-yellow-500/15 text-yellow-700 border border-yellow-500/30"
                  : "bg-red-500/15 text-red-700 border border-red-500/30"
              }`}
              title={`Score SEO: ${seoScore}%${criticalErrors > 0 ? ` • ${criticalErrors} falha(s) crítica(s)` : ""}`}
            >
              SEO {seoScore}%
            </span>
          )}
          <Button
            type="button"
            size="sm"
            disabled={saving || !title.trim() || !content.trim()}
            onClick={handlePublish}
            className="gap-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="h-4 w-4" /> {saving ? "Publicando..." : published ? "Atualizar e Publicar" : "Publicar"}
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
          {/* SEO Briefing — define keyword principal, secundárias e intenção ANTES de gerar */}
          <SeoBriefingPanel value={briefing} onChange={setBriefing} defaultExpanded={!article} />

          {/* Geração unificada: 1 botão → título + slug + meta + focus_keyword + conteúdo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
            <div className="text-sm">
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> Geração unificada
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A IA devolve título H1, slug, meta description e o conteúdo HTML em uma única chamada — usando o briefing acima.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={isGeneratingFull}
              onClick={handleGenerateFullArticle}
              className="gap-1.5 shrink-0"
            >
              {isGeneratingFull ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Gerar artigo completo
                </>
              )}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Título *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={isGeneratingTitle || !title.trim()}
                  onClick={() => generateTitle("generate_title", {
                    topic: title,
                    content: `Melhore este título para SEO. Regras: máximo 60 caracteres, natural e atrativo, inclua a palavra-chave principal. Título atual: "${title}". Retorne APENAS UM título melhorado, sem numeração, sem aspas, sem explicações.`,
                  })}
                >
                  {isGeneratingTitle ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  Melhorar com IA
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do artigo"
                  maxLength={200}
                  required
                  className={
                    title.trim().length === 0 ? "border-destructive/50" :
                    title.trim().length < 30 || title.trim().length > 60 ? "border-yellow-500/50" : "border-green-500/50"
                  }
                />
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium ${
                  title.trim().length === 0 ? "text-destructive" :
                  title.trim().length < 30 || title.trim().length > 60 ? "text-yellow-500" : "text-green-500"
                }`}>
                  {title.trim().length}/60
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <div className="relative">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="slug-do-artigo"
                  maxLength={200}
                  className={
                    !slug.trim() ? "border-destructive/50" :
                    slug.length > 75 ? "border-yellow-500/50" : "border-green-500/50"
                  }
                />
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium ${
                  !slug.trim() ? "text-destructive" :
                  slug.length > 75 ? "text-yellow-500" : "text-green-500"
                }`}>
                  {slug.length}/75
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category">Categoria *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={isGeneratingTopics}
                  onClick={handleSuggestTopics}
                >
                  {isGeneratingTopics ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Lightbulb className="h-3 w-3" />
                  )}
                  Sugerir temas
                </Button>
              </div>
              <Select value={category} onValueChange={(val) => { setCategory(val); setTopicSuggestions([]); }}>
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
              {topicSuggestions.length > 0 && (
                <TopicSlider
                  suggestions={topicSuggestions}
                  disabled={isGeneratingArticle}
                  onSelect={handleSelectTopic}
                />
              )}
              {autoGenerating && (
                <div className="flex items-center gap-2 p-3 rounded-md border bg-primary/5 text-sm text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando artigo completo... Aguarde.
                </div>
              )}
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
                  disabled={isGeneratingExcerpt || (!content.trim() && !title.trim())}
                  onClick={() => generateExcerpt("generate_excerpt", { content: content || title })}
                >
                  {isGeneratingExcerpt ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  Gerar com IA
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Breve descrição do artigo..."
                  rows={2}
                  maxLength={500}
                  className={
                    !excerpt.trim() ? "border-destructive/50" :
                    excerpt.trim().length < 70 || excerpt.trim().length > 155 ? "border-yellow-500/50" : "border-green-500/50"
                  }
                />
                <span className={`absolute right-2 bottom-2 text-[10px] font-medium ${
                  !excerpt.trim() ? "text-destructive" :
                  excerpt.trim().length < 70 || excerpt.trim().length > 155 ? "text-yellow-500" : "text-green-500"
                }`}>
                  {excerpt.trim().length}/155
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="focusKeyword">Palavra-chave foco</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={isGeneratingFocusKw || (!title.trim() && !content.trim())}
                  onClick={() => generateFocusKw("generate_focus_keyword", { topic: title || undefined, content: content || undefined })}
                >
                  {isGeneratingFocusKw ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  Gerar com IA
                </Button>
              </div>
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

          {/* Tags Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tags / Palavras-chave</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={isGeneratingTags || (!title.trim() && !content.trim())}
                onClick={() => generateKeywords("suggest_keywords", { topic: title || "artigo" })}
              >
                {isGeneratingTags ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                Gerar com IA
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Adicionar tag..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag} disabled={!tagInput.trim()}>
                Adicionar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Imagem de Capa</Label>

            {/* Style selector with thumbnails */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {COVER_STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setCoverStyle(s.value)}
                  className={`group relative flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all ${
                    coverStyle === s.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent hover:border-primary/30 bg-muted/30"
                  }`}
                >
                  <div className="w-full aspect-square rounded-md overflow-hidden">
                    <img
                      src={s.thumb}
                      alt={s.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className={`text-[10px] font-medium leading-tight text-center ${
                    coverStyle === s.value ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>

            {imageUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={imageUrl}
                    alt="Capa do artigo"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {/* Quick style re-generate */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Regenerar com outro estilo:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {COVER_STYLES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        disabled={isGeneratingCover}
                        onClick={() => {
                          setCoverStyle(s.value);
                          coverStyleRef.current = s.value;
                          const prompt = coverPrompt.trim()
                            ? `${coverPrompt.trim()}. ${s.prompt}`
                            : `${s.prompt} para artigo sobre: ${title || "neurodiversidade"}. Sem texto na imagem.`;
                          generateImage(prompt, "cover");
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-medium transition-all disabled:opacity-50 ${
                          coverStyle === s.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        <img src={s.thumb} alt="" className="w-5 h-5 rounded-sm object-cover" />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-1 text-xs"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? "Enviando..." : "Selecionar imagem"}
                  </Button>
                  {isGeneratingCover && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Gerando imagem...
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                    placeholder="Descreva a imagem desejada para gerar com IA..."
                    className="text-sm"
                    disabled={isGeneratingCover}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && coverPrompt.trim()) {
                        const styleObj = COVER_STYLES.find(s => s.value === coverStyle) || COVER_STYLES[0];
                        generateImage(`${coverPrompt.trim()}. ${styleObj.prompt}`, "cover");
                      }
                    }}
                  />
                </div>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Ou cole a URL da imagem aqui..."
                  className="text-sm"
                />
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && coverPrompt.trim()) {
                        const styleObj = COVER_STYLES.find(s => s.value === coverStyle) || COVER_STYLES[0];
                        generateImage(`${coverPrompt.trim()}. ${styleObj.prompt}`, "cover");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const styleObj = COVER_STYLES.find(s => s.value === coverStyle) || COVER_STYLES[0];
                      const prompt = coverPrompt.trim()
                        ? `${coverPrompt.trim()}. ${styleObj.prompt}`
                        : `${styleObj.prompt} para artigo sobre: ${title || "neurodiversidade"}. Sem texto na imagem.`;
                      generateImage(prompt, "cover");
                    }}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label>Conteúdo *</Label>
              <span className={`text-xs ${meetsMinimum ? "text-green-600" : "text-destructive"}`}>
                {wordCount} palavras • {charCount} caracteres {meetsMinimum ? "✓" : `(mín. 400 palavras ou 3.000 caracteres)`}
              </span>
            </div>

            {/* AI Assistant */}
            <AiAssistantPanel
              title={title}
              content={content}
              focusKeyword={focusKeyword}
              secondaryKeywords={briefing.secondaryKeywords}
              searchIntent={briefing.searchIntent}
              onContentGenerated={(html) => {
                setContent(html);
                // Auto-generate keywords/focus keyword after AI content generation
                if (title.trim()) {
                  generateKeywords("suggest_keywords", { topic: title.trim() });
                }
                // Auto-generate excerpt after AI content generation
                generateExcerpt("generate_excerpt", { content: html });
                // Auto-generate focus keyword
                generateFocusKw("generate_focus_keyword", { topic: title.trim() || undefined, content: html.slice(0, 3000) });
              }}
              onTitleGenerated={(t) => setTitle(t)}
              onExcerptGenerated={(e) => setExcerpt(e)}
              onImageInserted={(url) => {
                const editor = editorInstanceRef.current;
                if (editor) {
                  editor.chain().focus().setImage({ src: url, alt: "Imagem gerada por IA" }).run();
                } else {
                  // Fallback: append to HTML
                  const imgTag = `<p><img src="${url}" alt="Imagem gerada por IA" class="rounded-lg max-w-full"></p>`;
                  setContent((prev) => prev + imgTag);
                }
              }}
            />

            <Base64ImageWarning content={content} onContentChange={setContent} />

            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Comece a escrever o conteúdo do artigo..."
              editorRef={editorInstanceRef}
            />

            {/* AI Internal Links Suggester */}
            <AiInternalLinksSuggester
              content={content}
              currentSlug={slug}
              category={category}
              onInsertLink={insertInternalLink}
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
