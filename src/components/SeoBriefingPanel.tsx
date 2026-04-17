import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Target, ChevronDown, ChevronUp, X, Plus } from "lucide-react";

export interface SeoBriefing {
  focusKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  slugHint: string;
  autoInsertLinks: boolean;
}

interface SeoBriefingPanelProps {
  value: SeoBriefing;
  onChange: (next: SeoBriefing) => void;
  defaultExpanded?: boolean;
}

const INTENTS = [
  { value: "informacional", label: "📚 Informacional", description: '"O que é", "Como funciona"' },
  { value: "navegacional", label: "🧭 Navegacional", description: 'Busca por marca/site específico' },
  { value: "transacional", label: "🛒 Transacional", description: '"Comprar", "Contratar"' },
  { value: "comercial", label: "💡 Comercial", description: '"Melhor", "Comparativo", "Review"' },
];

const SeoBriefingPanel = ({ value, onChange, defaultExpanded = false }: SeoBriefingPanelProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [secondaryInput, setSecondaryInput] = useState("");

  const update = <K extends keyof SeoBriefing>(key: K, v: SeoBriefing[K]) => {
    onChange({ ...value, [key]: v });
  };

  const addSecondary = () => {
    const t = secondaryInput.trim().toLowerCase();
    if (t && !value.secondaryKeywords.includes(t) && value.secondaryKeywords.length < 10) {
      update("secondaryKeywords", [...value.secondaryKeywords, t]);
    }
    setSecondaryInput("");
  };

  const removeSecondary = (kw: string) => {
    update(
      "secondaryKeywords",
      value.secondaryKeywords.filter((k) => k !== kw),
    );
  };

  const filledCount = [
    value.focusKeyword.trim(),
    value.secondaryKeywords.length > 0 ? "x" : "",
    value.searchIntent.trim(),
  ].filter(Boolean).length;

  return (
    <div className="border rounded-lg bg-card overflow-hidden border-primary/30">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Target className="h-4 w-4 text-primary" />
          Briefing SEO
          <span className="text-xs text-muted-foreground font-normal">
            ({filledCount}/3 preenchidos)
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="p-3 pt-0 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Preencha o briefing antes de gerar o artigo. A IA usará essas informações para criar
            conteúdo otimizado, com palavras-chave e intenção de busca corretas.
          </p>

          {/* Focus keyword */}
          <div className="space-y-1.5">
            <Label htmlFor="brief-kw" className="text-xs">
              Palavra-chave principal *
            </Label>
            <Input
              id="brief-kw"
              value={value.focusKeyword}
              onChange={(e) => update("focusKeyword", e.target.value)}
              placeholder="Ex: rotina diária para TDAH"
              maxLength={100}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              2-5 palavras. O que pessoas digitam no Google.
            </p>
          </div>

          {/* Secondary keywords */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Palavras-chave secundárias (cauda longa)
            </Label>
            <div className="flex gap-2">
              <Input
                value={secondaryInput}
                onChange={(e) => setSecondaryInput(e.target.value)}
                placeholder="Ex: como criar rotina para TDAH"
                maxLength={100}
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSecondary();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addSecondary}
                disabled={!secondaryInput.trim() || value.secondaryKeywords.length >= 10}
                className="shrink-0 gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            {value.secondaryKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {value.secondaryKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground border"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeSecondary(kw)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              Recomendado: 5-10 variações cauda longa. Máx. 10.
            </p>
          </div>

          {/* Search intent */}
          <div className="space-y-1.5">
            <Label htmlFor="brief-intent" className="text-xs">
              Intenção de busca
            </Label>
            <Select
              value={value.searchIntent}
              onValueChange={(v) => update("searchIntent", v)}
            >
              <SelectTrigger id="brief-intent" className="text-sm h-9">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {INTENTS.map((i) => (
                  <SelectItem key={i.value} value={i.value} className="text-xs">
                    <span className="font-medium">{i.label}</span>
                    <span className="ml-1.5 text-muted-foreground">{i.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Slug hint */}
          <div className="space-y-1.5">
            <Label htmlFor="brief-slug" className="text-xs">
              Slug sugerido (opcional)
            </Label>
            <Input
              id="brief-slug"
              value={value.slugHint}
              onChange={(e) => update("slugHint", e.target.value)}
              placeholder="ex: rotina-diaria-tdah-guia-pratico"
              maxLength={100}
              className="text-sm font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Se preenchido, será usado no lugar do slug automático.
            </p>
          </div>

          {/* Auto-insert internal links toggle */}
          <div className="flex items-start justify-between gap-3 pt-1 border-t">
            <div className="space-y-0.5 min-w-0">
              <Label htmlFor="brief-autolinks" className="text-xs cursor-pointer">
                Auto-inserir links internos
              </Label>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Após gerar o artigo, a IA insere automaticamente 1-2 links contextuais inline
                + um bloco "Leia também" com artigos reais do blog.
              </p>
            </div>
            <Switch
              id="brief-autolinks"
              checked={value.autoInsertLinks}
              onCheckedChange={(v) => update("autoInsertLinks", v)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoBriefingPanel;
