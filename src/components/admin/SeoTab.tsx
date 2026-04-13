import { useState, useEffect, useMemo } from "react";
import { useSiteSettings, useBulkUpdateSettings } from "@/hooks/useSiteSettings";
import { useArticles, useUpdateArticle, type Article } from "@/hooks/useArticles";
import { analyzeSeo, calculateScore, countWords, type SeoCheck } from "@/lib/seoAnalysis";
import { SITE_URL } from "@/lib/seo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Globe,
  Share2,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Map,
  Shield,
  Code,
  BarChart3,
  ExternalLink,
} from "lucide-react";

const SeoTab = () => {
  const { data: settings = [], isLoading } = useSiteSettings();
  const bulkUpdate = useBulkUpdateSettings();
  const { data: articles = [] } = useArticles();
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [expandedSection, setExpandedSection] = useState<string | null>("global");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

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
      onSuccess: () => toast({ title: "Configurações SEO salvas!" }),
      onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
    });
  };

  const val = (key: string) => values[key] || "";
  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  // Article SEO analysis
  const articleScores = useMemo(() => {
    return articles.map((a) => {
      const checks = analyzeSeo({
        title: a.title,
        excerpt: a.excerpt || "",
        content: a.content,
        slug: a.slug,
        imageUrl: a.image_url || "",
      });
      return {
        article: a,
        checks,
        score: calculateScore(checks),
        wordCount: countWords(a.content),
      };
    });
  }, [articles]);

  const avgScore = articleScores.length > 0
    ? Math.round(articleScores.reduce((sum, a) => sum + a.score, 0) / articleScores.length)
    : 0;

  const goodArticles = articleScores.filter((a) => a.score >= 80).length;
  const warningArticles = articleScores.filter((a) => a.score >= 50 && a.score < 80).length;
  const errorArticles = articleScores.filter((a) => a.score < 50).length;

  const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

  if (isLoading) return <div className="text-muted-foreground text-sm">Carregando...</div>;

  const renderField = (
    key: string,
    label: string,
    desc: string,
    placeholder: string,
    opts?: { maxChars?: number; multiline?: boolean; mono?: boolean }
  ) => {
    const len = (values[key] || "").length;
    const max = opts?.maxChars;
    const isOver = max ? len > max : false;

    return (
      <div key={key} className="space-y-1.5">
        <Label className="text-foreground font-medium text-sm">{label}</Label>
        {opts?.multiline ? (
          <textarea
            value={val(key)}
            onChange={(e) => set(key, e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
          />
        ) : (
          <Input
            value={val(key)}
            onChange={(e) => set(key, e.target.value)}
            placeholder={placeholder}
            className={opts?.mono ? "font-mono text-xs" : "text-sm"}
          />
        )}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">{desc}</p>
          {max && (
            <span className={`text-[11px] ${isOver ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
              {len}/{max}
            </span>
          )}
        </div>
      </div>
    );
  };

  const SectionHeader = ({ id, icon: Icon, title, badge }: { id: string; icon: any; title: string; badge?: string }) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-4.5 w-4.5 text-primary" />
        <span className="font-heading font-semibold text-foreground text-sm">{title}</span>
        {badge && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{badge}</Badge>}
      </div>
      {expandedSection === id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">SEO</h1>
          <p className="text-sm text-muted-foreground mt-1">Otimização para mecanismos de busca</p>
        </div>
        <Button onClick={handleSave} disabled={bulkUpdate.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {bulkUpdate.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xs text-muted-foreground font-medium">Score Médio</p>
          <p className={`text-2xl font-bold ${avgScore >= 80 ? "text-green-600" : avgScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
            {avgScore}%
          </p>
        </div>
        <div className="border rounded-xl p-4 bg-green-500/5 border-green-500/20">
          <p className="text-xs text-muted-foreground font-medium">Bom (80%+)</p>
          <p className="text-2xl font-bold text-green-600">{goodArticles}</p>
        </div>
        <div className="border rounded-xl p-4 bg-yellow-500/5 border-yellow-500/20">
          <p className="text-xs text-muted-foreground font-medium">Atenção (50-79%)</p>
          <p className="text-2xl font-bold text-yellow-600">{warningArticles}</p>
        </div>
        <div className="border rounded-xl p-4 bg-red-500/5 border-red-500/20">
          <p className="text-xs text-muted-foreground font-medium">Crítico (&lt;50%)</p>
          <p className="text-2xl font-bold text-red-600">{errorArticles}</p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Global SEO */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <SectionHeader id="global" icon={Globe} title="SEO Global" badge="Essencial" />
          {expandedSection === "global" && (
            <div className="p-4 pt-0 space-y-4 border-t">
              <div className="pt-4 space-y-4">
                {renderField("site_name", "Nome do Site (Title Tag)", "Aparece na aba do navegador e resultados de busca", "Neurodivergências", { maxChars: 60 })}
                {renderField("site_description", "Meta Description Padrão", "Descrição exibida nos resultados de busca quando não há uma específica", "Informação acessível sobre neurodivergências...", { maxChars: 160, multiline: true })}
                {renderField("seo_title_separator", "Separador de Título", "Caractere entre o nome da página e do site (ex: | — –)", "|")}
                {renderField("seo_default_og_image", "Imagem OG Padrão", "URL da imagem padrão para compartilhamento social (1200×630px)", "https://exemplo.com/og-image.jpg", { mono: true })}
                {renderField("seo_canonical_url", "URL Canônica Base", "Domínio principal do site para URLs canônicas", SITE_URL, { mono: true })}
              </div>
            </div>
          )}
        </div>

        {/* Social Media / Open Graph */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <SectionHeader id="social" icon={Share2} title="Redes Sociais / Open Graph" />
          {expandedSection === "social" && (
            <div className="p-4 pt-0 space-y-4 border-t">
              <div className="pt-4 space-y-4">
                {renderField("seo_og_type", "Tipo OG Padrão", "Tipo de conteúdo para Open Graph (website, blog, article)", "website")}
                {renderField("seo_twitter_card", "Tipo de Twitter Card", "summary, summary_large_image, app, player", "summary_large_image")}
                {renderField("seo_twitter_handle", "Handle do Twitter", "Conta do Twitter do site", "@neurodiv_br")}
                {renderField("seo_facebook_app_id", "Facebook App ID", "ID do app do Facebook para insights", "", { mono: true })}
                {renderField("seo_og_locale", "Locale OG", "Idioma e região para Open Graph", "pt_BR")}
              </div>
            </div>
          )}
        </div>

        {/* Indexação & Robots */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <SectionHeader id="robots" icon={Shield} title="Indexação & Robots" />
          {expandedSection === "robots" && (
            <div className="p-4 pt-0 space-y-4 border-t">
              <div className="pt-4 space-y-4">
                {renderField("seo_google_verification", "Google Search Console", "Cole o código de verificação (apenas o valor do content da meta tag)", "abc123...", { mono: true })}
                {renderField("seo_bing_verification", "Bing Webmaster Tools", "Cole o código de verificação do Bing (apenas o valor do content)", "abc123...", { mono: true })}
                {renderField("seo_robots_default", "Meta Robots Padrão", "Diretivas para crawlers (index, follow, noindex, nofollow)", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1")}
                {renderField("seo_robots_txt_custom", "Robots.txt Personalizado", "Regras adicionais para o robots.txt (uma por linha)", "User-agent: *\nAllow: /", { multiline: true })}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                  <div>
                    <Label className="text-foreground font-medium text-sm">Noindex em páginas de arquivo</Label>
                    <p className="text-[11px] text-muted-foreground">Evitar indexação de páginas de categoria/tag</p>
                  </div>
                  <Switch
                    checked={val("seo_noindex_archives") === "true"}
                    onCheckedChange={(c) => set("seo_noindex_archives", c ? "true" : "false")}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sitemap */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <SectionHeader id="sitemap" icon={Map} title="Sitemap XML" />
          {expandedSection === "sitemap" && (
            <div className="p-4 pt-0 space-y-4 border-t">
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                  <div>
                    <Label className="text-foreground font-medium text-sm">Sitemap ativo</Label>
                    <p className="text-[11px] text-muted-foreground">Gerar sitemap XML automaticamente</p>
                  </div>
                  <Switch
                    checked={val("seo_sitemap_enabled") !== "false"}
                    onCheckedChange={(c) => set("seo_sitemap_enabled", c ? "true" : "false")}
                  />
                </div>
                {renderField("seo_sitemap_changefreq", "Frequência de Atualização", "Frequência de mudança padrão (daily, weekly, monthly)", "weekly")}
                {renderField("seo_sitemap_priority", "Prioridade Padrão", "Prioridade padrão das páginas (0.0 a 1.0)", "0.7")}
                <div className="p-3 rounded-lg bg-accent/30 border">
                  <p className="text-xs text-muted-foreground">
                    <strong>URL do Sitemap:</strong>{" "}
                    <a
                      href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      sitemap.xml <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Schema / Dados Estruturados */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <SectionHeader id="schema" icon={Code} title="Dados Estruturados (Schema.org)" />
          {expandedSection === "schema" && (
            <div className="p-4 pt-0 space-y-4 border-t">
              <div className="pt-4 space-y-4">
                {renderField("seo_org_name", "Nome da Organização", "Nome exibido no schema Organization", "Neurodivergências")}
                {renderField("seo_org_logo", "Logo URL", "URL do logo para schema Organization (mín. 112×112px)", `${SITE_URL}/logo.png`, { mono: true })}
                {renderField("seo_org_social_instagram", "Instagram", "URL do perfil no Instagram", "https://instagram.com/neurodivergencias", { mono: true })}
                {renderField("seo_org_social_twitter", "Twitter/X", "URL do perfil no Twitter", "https://twitter.com/neurodiv_br", { mono: true })}
                {renderField("seo_org_social_facebook", "Facebook", "URL da página no Facebook", "", { mono: true })}
                {renderField("seo_org_social_youtube", "YouTube", "URL do canal no YouTube", "", { mono: true })}
              </div>
            </div>
          )}
        </div>

        {/* Verificações e Integrações */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <SectionHeader id="verification" icon={Search} title="Verificação & Analytics" />
          {expandedSection === "verification" && (
            <div className="p-4 pt-0 space-y-4 border-t">
              <div className="pt-4 space-y-4">
                {renderField("google_verification", "Google Search Console", "Meta tag de verificação do Google", "google-site-verification=...", { mono: true })}
                {renderField("seo_bing_verification", "Bing Webmaster Tools", "Meta tag de verificação do Bing", "", { mono: true })}
                {renderField("gtm_id", "Google Tag Manager", "ID do container GTM", "GTM-XXXXXXX", { mono: true })}
                {renderField("seo_ga_id", "Google Analytics (GA4)", "ID de medição do GA4", "G-XXXXXXXXXX", { mono: true })}
              </div>
            </div>
          )}
        </div>

        {/* Article SEO Analysis */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <SectionHeader id="articles" icon={BarChart3} title="Análise SEO dos Artigos" badge={`${articleScores.length} artigos`} />
          {expandedSection === "articles" && (
            <div className="p-4 pt-0 border-t">
              <div className="pt-4 space-y-2">
                {articleScores.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum artigo encontrado.</p>
                ) : (
                  articleScores
                    .sort((a, b) => a.score - b.score)
                    .map(({ article, checks, score, wordCount }) => {
                      const scoreColor = score >= 80 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
                      const scoreBg = score >= 80 ? "bg-green-500/10" : score >= 50 ? "bg-yellow-500/10" : "bg-red-500/10";
                      const isExpanded = expandedArticle === article.id;
                      const errors = checks.filter((c) => c.status === "error");
                      const warnings = checks.filter((c) => c.status === "warning");

                      return (
                        <div key={article.id} className="border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors text-left"
                          >
                            <div className={`w-10 h-10 rounded-lg ${scoreBg} flex items-center justify-center shrink-0`}>
                              <span className={`text-sm font-bold ${scoreColor}`}>{score}%</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{article.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-muted-foreground">{wordCount} palavras</span>
                                {!article.published && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 text-amber-600 border-amber-500/30">Rascunho</Badge>
                                )}
                                {errors.length > 0 && (
                                  <span className="text-[11px] text-red-600 flex items-center gap-0.5">
                                    <XCircle className="h-3 w-3" /> {errors.length}
                                  </span>
                                )}
                                {warnings.length > 0 && (
                                  <span className="text-[11px] text-yellow-600 flex items-center gap-0.5">
                                    <AlertTriangle className="h-3 w-3" /> {warnings.length}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                          </button>

                          {isExpanded && (
                            <div className="border-t px-3 py-2 space-y-1 bg-accent/10">
                              {checks.map((check) => (
                                <div key={check.id} className="flex items-start gap-2 py-1">
                                  {check.status === "good" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                                  ) : check.status === "warning" ? (
                                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                                  )}
                                  <div className="min-w-0">
                                    <span className="text-[11px] font-medium text-foreground">{check.label}</span>
                                    <p className="text-[11px] text-muted-foreground">{check.message}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeoTab;
