import { useState, useEffect } from "react";
import { useSiteSettings, useBulkUpdateSettings } from "@/hooks/useSiteSettings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Megaphone, LayoutTemplate, Code } from "lucide-react";

const AnunciosTab = () => {
  const { data: settings = [], isLoading } = useSiteSettings();
  const bulkUpdate = useBulkUpdateSettings();
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings.length > 0) {
      const map: Record<string, string> = {};
      settings.forEach((s) => (map[s.key] = s.value));
      setValues(map);
    }
  }, [settings]);

  const handleSave = () => {
    const adKeys = [
      "adsense_publisher_id",
      "ads_header_enabled", "ads_footer_enabled", "ads_sidebar_enabled", "ads_between_posts_enabled",
      "ads_header_code", "ads_footer_code", "ads_sidebar_code", "ads_between_posts_code",
    ];
    const changes = adKeys
      .filter((k) => values[k] !== undefined)
      .map((key) => ({ key, value: values[key] }));
    bulkUpdate.mutate(changes, {
      onSuccess: () => toast({ title: "Configurações de anúncios salvas!" }),
      onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
    });
  };

  const toggleValue = (key: string) => {
    setValues((v) => ({ ...v, [key]: v[key] === "true" ? "false" : "true" }));
  };

  if (isLoading) return <div className="text-muted-foreground text-sm">Carregando...</div>;

  const slots = [
    { key: "ads_header_enabled", codeKey: "ads_header_code", label: "Header", desc: "Banner no topo de todas as páginas" },
    { key: "ads_footer_enabled", codeKey: "ads_footer_code", label: "Footer", desc: "Banner no rodapé de todas as páginas" },
    { key: "ads_sidebar_enabled", codeKey: "ads_sidebar_code", label: "Sidebar (Posts)", desc: "Retângulos na barra lateral dos artigos" },
    { key: "ads_between_posts_enabled", codeKey: "ads_between_posts_code", label: "Entre Artigos", desc: "Banner entre cards na listagem do blog" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Configuração de Anúncios</h1>
        <Button onClick={handleSave} disabled={bulkUpdate.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {bulkUpdate.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* AdSense */}
      <div className="mb-8">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground mb-4">
          <Megaphone className="h-5 w-5 text-primary" /> Google AdSense
        </h2>
        <div className="bg-card border rounded-lg p-5 space-y-2">
          <Label className="text-foreground font-semibold">Publisher ID</Label>
          <Input
            value={values["adsense_publisher_id"] || ""}
            onChange={(e) => setValues((v) => ({ ...v, adsense_publisher_id: e.target.value }))}
            placeholder="ca-pub-XXXXXXXXXX"
            className="font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Código do Google AdSense (ca-pub-XXXXXXXXXX)</p>
            <span className="text-xs text-muted-foreground">{(values["adsense_publisher_id"] || "").length} caracteres</span>
          </div>
        </div>
      </div>

      {/* Slot toggles + code */}
      <div>
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground mb-4">
          <LayoutTemplate className="h-5 w-5 text-primary" /> Posições de Anúncios
        </h2>
        <div className="space-y-4">
          {slots.map((slot) => (
            <div key={slot.key} className="bg-card border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-sm">{slot.label}</p>
                  <p className="text-xs text-muted-foreground">{slot.desc}</p>
                </div>
                <Switch
                  checked={values[slot.key] === "true"}
                  onCheckedChange={() => toggleValue(slot.key)}
                />
              </div>
              {values[slot.key] === "true" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Code className="h-3 w-3" /> Código HTML do Anúncio
                  </Label>
                  <Textarea
                    value={values[slot.codeKey] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [slot.codeKey]: e.target.value }))}
                    placeholder={'<ins class="adsbygoogle" data-ad-client="ca-pub-XXX" data-ad-slot="YYY" ...></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>'}
                    className="font-mono text-xs min-h-[100px] resize-y"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Cole o código HTML/JS fornecido pela rede de anúncios (AdSense, Ad Manager, etc.)
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mt-8 bg-muted/50 border rounded-lg p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Pré-visualização dos Slots</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {slots.map((slot) => (
            <div
              key={slot.key}
              className={`border-2 border-dashed rounded-md p-3 text-center transition-colors ${
                values[slot.key] === "true"
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-muted-foreground/20 text-muted-foreground/40 line-through"
              }`}
            >
              {slot.label}
              {values[slot.key] === "true" && values[slot.codeKey] && (
                <span className="block text-[10px] mt-1 text-primary/60">✓ código inserido</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnunciosTab;
