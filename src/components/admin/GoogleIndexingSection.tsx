import { useState } from "react";
import { useArticles } from "@/hooks/useArticles";
import { useGoogleIndexing } from "@/hooks/useGoogleIndexing";
import { SITE_URL } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle2, XCircle, Loader2, Plus, Trash2 } from "lucide-react";

const GoogleIndexingSection = () => {
  const { data: articles = [] } = useArticles();
  const { submitUrls, isLoading, results } = useGoogleIndexing();
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [customUrls, setCustomUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [mode, setMode] = useState<"URL_UPDATED" | "URL_DELETED">("URL_UPDATED");

  const publishedArticles = articles.filter((a) => a.published);

  const toggleSlug = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedSlugs.size === publishedArticles.length) {
      setSelectedSlugs(new Set());
    } else {
      setSelectedSlugs(new Set(publishedArticles.map((a) => a.slug)));
    }
  };

  const addCustomUrl = () => {
    const url = newUrl.trim();
    if (url && !customUrls.includes(url)) {
      setCustomUrls((prev) => [...prev, url]);
      setNewUrl("");
    }
  };

  const removeCustomUrl = (url: string) => {
    setCustomUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = () => {
    const urls: string[] = [
      ...Array.from(selectedSlugs).map((slug) => `${SITE_URL}/blog/${slug}`),
      ...customUrls,
    ];
    if (urls.length === 0) return;
    submitUrls(urls, mode);
  };

  const totalSelected = selectedSlugs.size + customUrls.length;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Envie URLs para a API de Indexação Instantânea do Google para solicitar rastreamento imediato.
        Requer uma conta de serviço configurada no Google Cloud com a API de Indexação habilitada.
      </p>

      {/* Mode selector */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "URL_UPDATED" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("URL_UPDATED")}
        >
          Atualizar / Indexar
        </Button>
        <Button
          type="button"
          variant={mode === "URL_DELETED" ? "destructive" : "outline"}
          size="sm"
          onClick={() => setMode("URL_DELETED")}
        >
          Remover do Índice
        </Button>
      </div>

      {/* Article list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Artigos publicados</Label>
          <Button type="button" variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
            {selectedSlugs.size === publishedArticles.length ? "Desmarcar todos" : "Selecionar todos"}
          </Button>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border p-2 bg-background">
          {publishedArticles.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhum artigo publicado</p>
          ) : (
            publishedArticles.map((a) => (
              <label
                key={a.slug}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/30 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selectedSlugs.has(a.slug)}
                  onCheckedChange={() => toggleSlug(a.slug)}
                />
                <span className="truncate flex-1">{a.title}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">{a.category}</Badge>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Custom URLs */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">URLs avulsas</Label>
        <div className="flex gap-2">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder={`${SITE_URL}/minha-pagina`}
            className="text-xs font-mono"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomUrl())}
          />
          <Button type="button" variant="outline" size="icon" onClick={addCustomUrl} className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {customUrls.length > 0 && (
          <div className="space-y-1">
            {customUrls.map((url) => (
              <div key={url} className="flex items-center gap-2 text-xs font-mono bg-accent/20 px-2 py-1 rounded">
                <span className="truncate flex-1">{url}</span>
                <button type="button" onClick={() => removeCustomUrl(url)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || totalSelected === 0}
        className="w-full gap-2"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {isLoading
          ? "Enviando..."
          : `Enviar ${totalSelected} URL(s) para indexação`}
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1 rounded-lg border p-3 bg-background">
          <p className="text-xs font-medium text-muted-foreground mb-2">Resultados:</p>
          {results.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {r.status === "ok" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="font-mono truncate block">{r.url}</span>
                {r.error && <span className="text-destructive text-[11px]">{r.error}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setup info */}
      <div className="rounded-lg border border-dashed p-3 bg-accent/10 space-y-2">
        <p className="text-xs font-semibold text-foreground">📋 Configuração necessária:</p>
        <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Criar projeto no Google Cloud Console</li>
          <li>Ativar a <strong>Web Search Indexing API</strong></li>
          <li>Criar uma <strong>conta de serviço</strong> com permissão na API</li>
          <li>Adicionar o e-mail da conta de serviço como <strong>proprietário</strong> no Google Search Console</li>
          <li>Baixar o JSON da chave e adicioná-lo como secret <code>GOOGLE_SERVICE_ACCOUNT_JSON</code></li>
        </ol>
      </div>
    </div>
  );
};

export default GoogleIndexingSection;
