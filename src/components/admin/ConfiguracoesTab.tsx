import { useState, useEffect } from "react";
import { useSiteSettings, useBulkUpdateSettings } from "@/hooks/useSiteSettings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Code, Tag } from "lucide-react";

const ConfiguracoesTab = () => {
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
    const changes = Object.entries(values).map(([key, value]) => ({ key, value }));
    bulkUpdate.mutate(changes, {
      onSuccess: () => toast({ title: "Configurações salvas!" }),
      onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="text-muted-foreground text-sm">Carregando...</div>;

  const generalSettings = settings.filter((s) => s.category === "general");
  const integrationSettings = settings.filter((s) => s.category === "integrations");

  const renderField = (key: string, label: string, description: string, placeholder: string, charCount?: boolean) => (
    <div key={key} className="bg-card border rounded-lg p-5 space-y-2">
      <Label className="text-foreground font-semibold">{label}</Label>
      <Input
        value={values[key] || ""}
        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
        placeholder={placeholder}
        className="font-mono text-sm"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{description}</p>
        {charCount && (
          <span className="text-xs text-muted-foreground">{(values[key] || "").length} caracteres</span>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Configurações Gerais</h1>
        <Button onClick={handleSave} disabled={bulkUpdate.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {bulkUpdate.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* General */}
      <div className="mb-8">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground mb-4">
          <Globe className="h-5 w-5 text-primary" /> Site
        </h2>
        <div className="space-y-4">
          {renderField("site_name", "Nome do Site", "Nome exibido no header e SEO", "Neuro Rotina")}
          {renderField("site_description", "Descrição do Site", "Meta description padrão do site", "Informação acessível...")}
          {renderField("contact_email", "Email de Contato", "Email exibido na página de contato", "contato@exemplo.com")}
        </div>
      </div>

      {/* Integrations */}
      <div>
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground mb-4">
          <Code className="h-5 w-5 text-primary" /> Integrações
        </h2>
        <div className="space-y-4">
          {renderField("gtm_id", "Google Tag Manager", "ID do Tag Manager", "GTM-XXXXXXX", true)}
          {renderField("google_verification", "Google Verificação", "Código de verificação do Google", "Código de verificação...", true)}
          {renderField("exoclick_verification", "ExoClick Verificação", "Código de verificação do ExoClick", "Code", true)}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesTab;
