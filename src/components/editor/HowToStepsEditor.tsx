import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowUp, ArrowDown, ListOrdered } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface HowToStepInput {
  name: string;
  text?: string;
  image?: string;
}

interface Props {
  value: HowToStepInput[];
  onChange: (steps: HowToStepInput[]) => void;
}

const HowToStepsEditor = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(value.length > 0);

  const update = (idx: number, patch: Partial<HowToStepInput>) => {
    onChange(value.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...value];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const add = () => {
    onChange([...value, { name: "", text: "" }]);
    setOpen(true);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-lg bg-card">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/40 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Passos HowTo (opcional){" "}
                {value.length > 0 && (
                  <span className="text-xs text-muted-foreground">· {value.length} passo(s)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Use para artigos do tipo "como fazer". Gera schema HowTo no Google.
              </p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-3">
        {value.length === 0 && (
          <p className="text-xs text-muted-foreground italic px-1">
            Nenhum passo definido. Adicione passos numerados para gerar schema HowTo automaticamente.
          </p>
        )}
        {value.map((step, idx) => (
          <div key={idx} className="border rounded-md p-3 bg-background space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                Passo {idx + 1}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={idx === 0}
                  onClick={() => move(idx, -1)}
                  aria-label="Mover para cima"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={idx === value.length - 1}
                  onClick={() => move(idx, 1)}
                  aria-label="Mover para baixo"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => remove(idx)}
                  aria-label="Remover passo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`step-name-${idx}`} className="text-xs">
                Nome do passo *
              </Label>
              <Input
                id={`step-name-${idx}`}
                value={step.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                placeholder="Ex: Identifique os sinais"
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`step-text-${idx}`} className="text-xs">
                Descrição
              </Label>
              <Textarea
                id={`step-text-${idx}`}
                value={step.text || ""}
                onChange={(e) => update(idx, { text: e.target.value })}
                placeholder="Detalhe o que fazer neste passo..."
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`step-image-${idx}`} className="text-xs">
                URL da imagem (opcional)
              </Label>
              <Input
                id={`step-image-${idx}`}
                value={step.image || ""}
                onChange={(e) => update(idx, { image: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Adicionar passo
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default HowToStepsEditor;
