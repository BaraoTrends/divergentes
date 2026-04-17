import { useState, useEffect } from "react";
import { useSiteSettings, useBulkUpdateSettings } from "@/hooks/useSiteSettings";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Code, Trash2, Loader2 } from "lucide-react";

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

  const renderField = (key: string, label: string, description: string, placeholder: string, options?: { charCount?: boolean; maxChars?: number; multiline?: boolean }) => {
    const len = (values[key] || "").length;
    const max = options?.maxChars;
    const isOver = max ? len > max : false;

    return (
      <div key={key} className="bg-card border rounded-lg p-5 space-y-2">
        <Label className="text-foreground font-semibold">{label}</Label>
        {options?.multiline ? (
          <textarea
            value={values[key] || ""}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            placeholder={placeholder}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
          />
        ) : (
          <Input
            value={values[key] || ""}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            placeholder={placeholder}
            className="font-mono text-sm"
          />
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{description}</p>
          {(options?.charCount || max) && (
            <span className={`text-xs ${isOver ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
              {len}{max ? `/${max}` : ""} caracteres
            </span>
          )}
        </div>
      </div>
    );
  };

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
          {renderField("site_name", "Nome do Site", "Nome exibido no header e SEO (ideal: até 60 caracteres)", "Neuro Rotina", { charCount: true, maxChars: 60 })}
          {renderField("site_description", "Descrição do Site (SEO)", "Meta description padrão — inclua palavras-chave e CTA. Ideal: 120–160 caracteres.", "Informação acessível sobre neurodivergências...", { charCount: true, maxChars: 160, multiline: true })}
          {renderField("contact_email", "Email de Contato", "Email exibido na página de contato", "contato@exemplo.com")}
        </div>
      </div>

      {/* Integrations */}
      <div>
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground mb-4">
          <Code className="h-5 w-5 text-primary" /> Integrações
        </h2>
        <div className="space-y-4">
          {renderField("gtm_id", "Google Tag Manager", "ID do Tag Manager", "GTM-XXXXXXX", { charCount: true })}
          {renderField("google_verification", "Google Verificação", "Código de verificação do Google", "Código de verificação...", { charCount: true })}
          {renderField("exoclick_verification", "ExoClick Verificação", "Código de verificação do ExoClick", "Code", { charCount: true })}
          {renderField("social_hashtag_limit", "Limite de hashtags (autopublicação)", "Quantas hashtags enviar no webhook do Make.com (categoria + tags). Ex: 5 evita payloads longos no X/Twitter. Use 0 para sem limite.", "5")}
        </div>
      </div>

      {/* Cache */}
      <div className="mt-8">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground mb-4">
          <Trash2 className="h-5 w-5 text-primary" /> Cache
        </h2>
        <ClearCacheSection />
      </div>
    </div>
  );
};

const ClearCacheSection = () => {
  const [clearing, setClearing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleClearCache = async () => {
    setClearing(true);
    try {
      // 1. Clear React Query cache
      queryClient.clear();

      // 2. Clear browser caches (Cache API)
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // 3. Unregister service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }

      // 4. Clear localStorage/sessionStorage caches (preserve auth)
      const authKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-")) authKeys.push(key);
      }
      const savedAuth = authKeys.map((k) => [k, localStorage.getItem(k)!]);
      localStorage.clear();
      savedAuth.forEach(([k, v]) => localStorage.setItem(k, v));
      sessionStorage.clear();

      // 5. Refetch all active queries
      await queryClient.refetchQueries();

      toast({ title: "Cache limpo!", description: "Todos os caches foram limpos com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao limpar cache", description: e.message, variant: "destructive" });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-5 space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Limpar todo o cache</p>
        <p className="text-xs text-muted-foreground mt-1">
          Remove cache de dados, cache do navegador, service workers e armazenamento local (exceto sessão de login).
        </p>
      </div>
      <Button
        variant="destructive"
        onClick={handleClearCache}
        disabled={clearing}
        className="gap-2"
      >
        {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {clearing ? "Limpando..." : "Limpar Cache"}
      </Button>
    </div>
  );
};

export default ConfiguracoesTab;
