import { useState, useMemo } from "react";
import { useArticles } from "@/hooks/useArticles";
import {
  useInternalLinks,
  useApproveLink,
  useDeleteInternalLink,
  useCreateInternalLink,
  useUpdateAnchorText,
  generateLinkSuggestions,
} from "@/hooks/useInternalLinks";
import { useAiWriter } from "@/hooks/useAiWriter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Trash2,
  Zap,
  Link2,
  ArrowRight,
  Loader2,
  Clock,
  Pencil,
  Save,
  X,
  Plus,
  Sparkles,
} from "lucide-react";

const QUANTITY_OPTIONS = [
  { value: "5", label: "5 links" },
  { value: "10", label: "10 links" },
  { value: "15", label: "15 links" },
  { value: "20", label: "20 links" },
  { value: "30", label: "30 links" },
];

const InternalLinksSection = () => {
  const { data: articles = [] } = useArticles();
  const { data: links = [], isLoading } = useInternalLinks();
  const approveLink = useApproveLink();
  const deleteLink = useDeleteInternalLink();
  const createLink = useCreateInternalLink();
  const updateAnchor = useUpdateAnchorText();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [autoQuantity, setAutoQuantity] = useState("10");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSource, setManualSource] = useState("");
  const [manualTarget, setManualTarget] = useState("");
  const [manualAnchor, setManualAnchor] = useState("");
  const [suggestingAnchor, setSuggestingAnchor] = useState(false);

  const { generate: aiGenerate } = useAiWriter();

  const publishedArticles = useMemo(() => articles.filter((a) => a.published), [articles]);
  const articleMap = useMemo(() => {
    const map: Record<string, typeof articles[0]> = {};
    articles.forEach((a) => (map[a.id] = a));
    return map;
  }, [articles]);

  const existingPairs = useMemo(() => {
    const set = new Set<string>();
    links.forEach((l) => set.add(`${l.source_article_id}:${l.target_article_id}`));
    return set;
  }, [links]);

  const handleAutoGenerate = async () => {
    setGenerating(true);
    const maxLinks = parseInt(autoQuantity, 10);
    try {
      const suggestions = generateLinkSuggestions(articles);
      let created = 0;

      for (const s of suggestions) {
        if (created >= maxLinks) break;
        const key = `${s.source.id}:${s.target.id}`;
        if (existingPairs.has(key)) continue;

        try {
          await createLink.mutateAsync({
            source_article_id: s.source.id,
            target_article_id: s.target.id,
            anchor_text: s.anchor_text,
            auto_generated: true,
            approved: false,
          });
          created++;
        } catch {
          // duplicate, skip
        }
      }

      toast({
        title: `${created} sugestão(ões) gerada(s)!`,
        description: created === 0 ? "Todas as sugestões já existem." : "Revise e aprove os links sugeridos.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSuggestAnchor = async () => {
    if (!manualSource || !manualTarget) {
      toast({ title: "Selecione origem e destino primeiro", variant: "destructive" });
      return;
    }
    const source = articleMap[manualSource];
    const target = articleMap[manualTarget];
    if (!source || !target) return;

    setSuggestingAnchor(true);
    try {
      const result = await aiGenerate("generate_title", {
        topic: `Sugira um texto âncora curto (máximo 8 palavras) para um link interno que vai do artigo "${source.title}" para o artigo "${target.title}". O texto âncora deve ser natural, descritivo e convidativo para o leitor clicar. Responda APENAS com o texto âncora, sem numeração, sem aspas, sem explicação.`,
        model: "fast",
      });
      if (result) {
        const clean = result.trim().replace(/^["']|["']$/g, "").replace(/^\d+\.\s*/, "").trim();
        setManualAnchor(clean);
      }
    } finally {
      setSuggestingAnchor(false);
    }
  };

  const approvedLinks = links.filter((l) => l.approved);
  const pendingLinks = links.filter((l) => !l.approved);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const LinkRow = ({ link }: { link: typeof links[0] }) => {
    const source = articleMap[link.source_article_id];
    const target = articleMap[link.target_article_id];
    const [editing, setEditing] = useState(false);
    const [anchorDraft, setAnchorDraft] = useState(link.anchor_text);

    if (!source || !target) return null;

    const handleSaveAnchor = () => {
      if (anchorDraft.trim() && anchorDraft !== link.anchor_text) {
        updateAnchor.mutate({ id: link.id, anchor_text: anchorDraft.trim() });
      }
      setEditing(false);
    };

    return (
      <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border bg-background text-sm">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-foreground truncate max-w-[140px]" title={source.title}>
                {source.title}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium text-primary truncate max-w-[140px]" title={target.title}>
                {target.title}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {link.auto_generated && (
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                <Zap className="h-2.5 w-2.5 mr-0.5" />Auto
              </Badge>
            )}
            {!link.approved ? (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-1.5 text-green-600 border-green-500/30 hover:bg-green-500/10"
                onClick={() => approveLink.mutate({ id: link.id, approved: true })}
              >
                <CheckCircle2 className="h-3 w-3 mr-0.5" /> Aprovar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-1.5 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/10"
                onClick={() => approveLink.mutate({ id: link.id, approved: false })}
              >
                <Clock className="h-3 w-3 mr-0.5" /> Desaprovar
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
              onClick={() => deleteLink.mutate(link.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Editable anchor text */}
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <Input
                value={anchorDraft}
                onChange={(e) => setAnchorDraft(e.target.value)}
                className="h-6 text-[11px] flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveAnchor();
                  if (e.key === "Escape") { setAnchorDraft(link.anchor_text); setEditing(false); }
                }}
              />
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-green-600" onClick={handleSaveAnchor}>
                <Save className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => { setAnchorDraft(link.anchor_text); setEditing(false); }}>
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <p className="text-[10px] text-muted-foreground truncate flex-1">
                Âncora: "<span className="text-foreground font-medium">{link.anchor_text}</span>"
              </p>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground" onClick={() => setEditing(true)}>
                <Pencil className="h-2.5 w-2.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const handleManualCreate = async () => {
    if (!manualSource || !manualTarget || !manualAnchor.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    if (manualSource === manualTarget) {
      toast({ title: "Origem e destino devem ser diferentes", variant: "destructive" });
      return;
    }
    if (existingPairs.has(`${manualSource}:${manualTarget}`)) {
      toast({ title: "Este link já existe", variant: "destructive" });
      return;
    }
    try {
      await createLink.mutateAsync({
        source_article_id: manualSource,
        target_article_id: manualTarget,
        anchor_text: manualAnchor.trim(),
        auto_generated: false,
        approved: true,
      });
      toast({ title: "Link manual criado e aprovado!" });
      setManualSource("");
      setManualTarget("");
      setManualAnchor("");
      setShowManualForm(false);
    } catch {
      toast({ title: "Erro ao criar link", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-muted-foreground">
            {approvedLinks.length} aprovados · {pendingLinks.length} pendentes
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowManualForm(!showManualForm)}
            className="gap-1.5 h-8 text-xs"
          >
            {showManualForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showManualForm ? "Cancelar" : "Criar Manual"}
          </Button>
        </div>
      </div>

      {/* Auto-generate with quantity selector */}
      <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
        <p className="text-xs font-semibold flex items-center gap-1">
          <Zap className="h-3.5 w-3.5" /> Geração Automática
        </p>
        <div className="flex items-center gap-2">
          <Select value={autoQuantity} onValueChange={setAutoQuantity}>
            <SelectTrigger className="h-8 text-xs w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUANTITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAutoGenerate}
            disabled={generating || articles.length < 2}
            className="gap-1.5 h-8 text-xs flex-1"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Gerar {autoQuantity} Links
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Gera até {autoQuantity} sugestões baseadas em categoria e palavras-chave em comum.
        </p>
      </div>

      {showManualForm && (
        <div className="p-3 rounded-lg border bg-muted/30 space-y-2.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Criar Link Manual
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Artigo Origem</label>
              <Select value={manualSource} onValueChange={setManualSource}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {publishedArticles.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Artigo Destino</label>
              <Select value={manualTarget} onValueChange={setManualTarget}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {publishedArticles
                    .filter((a) => a.id !== manualSource)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">
                        {a.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">Texto Âncora</label>
            <div className="flex gap-1.5">
              <Input
                value={manualAnchor}
                onChange={(e) => setManualAnchor(e.target.value)}
                placeholder="Ex: Saiba mais sobre TDAH"
                className="h-8 text-xs flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSuggestAnchor}
                disabled={suggestingAnchor || !manualSource || !manualTarget}
                className="gap-1 h-8 text-xs shrink-0"
                title="Sugerir texto âncora com IA"
              >
                {suggestingAnchor ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                IA
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleManualCreate}
            disabled={!manualSource || !manualTarget || !manualAnchor.trim()}
            className="gap-1.5 h-8 text-xs w-full"
          >
            <Plus className="h-3.5 w-3.5" /> Criar Link
          </Button>
        </div>
      )}

      {pendingLinks.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-yellow-600 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Pendentes de Aprovação ({pendingLinks.length})
          </p>
          {pendingLinks.map((l) => <LinkRow key={l.id} link={l} />)}
        </div>
      )}

      {approvedLinks.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Aprovados ({approvedLinks.length})
          </p>
          {approvedLinks.map((l) => <LinkRow key={l.id} link={l} />)}
        </div>
      )}

      {links.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Link2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Nenhum link interno ainda.</p>
          <p className="text-xs mt-1">Use a geração automática ou crie manualmente.</p>
        </div>
      )}
    </div>
  );
};

export default InternalLinksSection;
