import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Trash2, KeyRound, CheckCircle2, AlertTriangle } from "lucide-react";

const SECRET_KEY = "GOOGLE_SERVICE_ACCOUNT_JSON";

interface StoredSecret {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

const GoogleServiceAccountSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [stored, setStored] = useState<StoredSecret | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ client_email?: string; project_id?: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("integration_secrets")
      .select("*")
      .eq("key", SECRET_KEY)
      .maybeSingle();
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else if (data) {
      setStored(data as StoredSecret);
      try {
        const parsed = JSON.parse((data as StoredSecret).value);
        setMeta({ client_email: parsed.client_email, project_id: parsed.project_id });
      } catch {
        setMeta(null);
      }
    } else {
      setStored(null);
      setMeta(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const validate = (text: string): { ok: boolean; error?: string; data?: any } => {
    try {
      const parsed = JSON.parse(text);
      if (parsed.type !== "service_account") {
        return { ok: false, error: 'JSON inválido: campo "type" deve ser "service_account".' };
      }
      if (!parsed.client_email || !parsed.private_key) {
        return { ok: false, error: "JSON sem client_email ou private_key." };
      }
      if (!/-----BEGIN PRIVATE KEY-----/.test(parsed.private_key)) {
        return { ok: false, error: "private_key não contém o cabeçalho BEGIN PRIVATE KEY." };
      }
      return { ok: true, data: parsed };
    } catch (e: any) {
      return { ok: false, error: "JSON malformado: " + e.message };
    }
  };

  const handleSave = async () => {
    const v = validate(jsonText.trim());
    if (!v.ok) {
      setParseError(v.error || "Inválido");
      toast({ title: "JSON inválido", description: v.error, variant: "destructive" });
      return;
    }
    setParseError(null);
    setSaving(true);
    const payload = {
      key: SECRET_KEY,
      value: JSON.stringify(v.data),
      description: "Google Service Account JSON para Indexing API",
    };
    const { error } = await supabase
      .from("integration_secrets")
      .upsert(payload, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Chave salva com sucesso" });
    setJsonText("");
    load();
  };

  const handleRemove = async () => {
    if (!confirm("Remover a chave do Google Service Account? Indexação Instantânea deixará de funcionar.")) return;
    setRemoving(true);
    const { error } = await supabase
      .from("integration_secrets")
      .delete()
      .eq("key", SECRET_KEY);
    setRemoving(false);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Chave removida" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <KeyRound className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Cole o JSON da Service Account do Google Cloud (Web Search Indexing API).
          A chave é armazenada de forma segura no banco e usada pela função de Indexação Instantânea.
        </p>
      </div>

      {/* Status atual */}
      <div className="rounded-lg border p-3 bg-background">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verificando...
          </div>
        ) : stored ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Chave configurada</span>
              <Badge variant="outline" className="text-[10px]">ativa</Badge>
            </div>
            {meta?.client_email && (
              <p className="text-[11px] font-mono text-muted-foreground break-all">
                {meta.client_email}
              </p>
            )}
            {meta?.project_id && (
              <p className="text-[11px] text-muted-foreground">
                Projeto: <span className="font-mono">{meta.project_id}</span>
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Atualizada em {new Date(stored.updated_at).toLocaleString("pt-BR")}
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={removing}
              className="gap-2 mt-1"
            >
              {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Remover chave
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span>Nenhuma chave configurada</span>
          </div>
        )}
      </div>

      {/* Inserir / substituir */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {stored ? "Substituir chave" : "Inserir chave"}
        </Label>
        <Textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setParseError(null);
          }}
          placeholder={`{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...",\n  "client_email": "...@....iam.gserviceaccount.com",\n  ...\n}`}
          rows={10}
          className="font-mono text-[11px]"
        />
        {parseError && (
          <p className="text-[11px] text-destructive">{parseError}</p>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || !jsonText.trim()}
          className="gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {stored ? "Substituir chave" : "Salvar chave"}
        </Button>
      </div>

      <div className="rounded-lg border border-dashed p-3 bg-accent/10">
        <p className="text-[11px] text-muted-foreground">
          <strong>Dica:</strong> abra o arquivo .json baixado do Google Cloud em um editor de texto e cole o conteúdo
          inteiro acima. Não modifique as quebras de linha do <code className="font-mono">private_key</code>.
        </p>
      </div>
    </div>
  );
};

export default GoogleServiceAccountSection;
