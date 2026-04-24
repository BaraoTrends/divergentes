import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import ArticleEditor from "@/components/ArticleEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/lib/content";
import {
  useArticles,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  type Article,
} from "@/hooks/useArticles";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import UsuariosTab from "@/components/admin/UsuariosTab";
import ConfiguracoesTab from "@/components/admin/ConfiguracoesTab";
import AnunciosTab from "@/components/admin/AnunciosTab";
import SeoTab from "@/components/admin/SeoTab";
import MetricasTab from "@/components/admin/MetricasTab";
import SocialPublishLogsTab from "@/components/admin/SocialPublishLogsTab";
import SeoInspectorTab from "@/components/admin/SeoInspectorTab";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Megaphone,
  Wrench,
  SearchIcon,
  TrendingUp,
  Share2,
} from "lucide-react";

type Tab = "dashboard" | "artigos" | "metricas" | "categorias" | "usuarios" | "configuracoes" | "anuncios" | "seo" | "seo-inspector" | "social" | "perfil";
type EditorMode = null | "create" | "edit";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const openEditor = (mode: EditorMode, article?: Article) => {
    setEditorMode(mode);
    setEditingArticle(article || null);
  };

  const closeEditor = () => {
    setEditorMode(null);
    setEditingArticle(null);
  };

  const { data: allArticlesForJump = [] } = useArticles();

  // Listen for global "open article in editor" requests (e.g. from SEO broken-links report)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ articleId: string }>).detail;
      const found = allArticlesForJump.find((a) => a.id === detail?.articleId);
      if (found) {
        setActiveTab("artigos");
        openEditor("edit", found);
      }
    };
    window.addEventListener("admin:open-article-editor", handler);
    return () => window.removeEventListener("admin:open-article-editor", handler);
  }, [allArticlesForJump]);

  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "artigos" as Tab, label: "Artigos", icon: FileText },
    { id: "metricas" as Tab, label: "Métricas", icon: TrendingUp },
    { id: "categorias" as Tab, label: "Categorias", icon: BarChart3 },
    { id: "usuarios" as Tab, label: "Usuários", icon: Users },
    { id: "configuracoes" as Tab, label: "Configurações", icon: Wrench },
    { id: "seo" as Tab, label: "SEO", icon: SearchIcon },
    { id: "seo-inspector" as Tab, label: "SEO Inspector", icon: Eye },
    { id: "anuncios" as Tab, label: "Anúncios", icon: Megaphone },
    { id: "social" as Tab, label: "Autopublicação", icon: Share2 },
    { id: "perfil" as Tab, label: "Perfil", icon: Settings },
  ];

  return (
    <Layout>
      <SEOHead title="Painel Admin" description="Painel administrativo" path="/admin" />
      <div className="container py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="md:w-64 shrink-0">
            <div className="bg-card border rounded-lg p-4 space-y-1 sticky top-24">
              <div className="px-3 py-2 mb-3 border-b">
                <p className="font-heading font-bold text-sm text-foreground truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); closeEditor(); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors mt-4"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {activeTab === "dashboard" && <DashboardTab onEditArticle={(a) => { setActiveTab("artigos"); openEditor("edit", a); }} onNavigate={(tab) => { setActiveTab(tab); closeEditor(); }} />}
            {activeTab === "artigos" && (
              editorMode ? (
                <EditorWrapper
                  mode={editorMode}
                  article={editingArticle}
                  onClose={closeEditor}
                  userId={user?.id || ""}
                />
              ) : (
                <ArtigosTab
                  onNew={() => openEditor("create")}
                  onEdit={(a) => openEditor("edit", a)}
                  categoryFilter={categoryFilter}
                  onClearFilter={() => setCategoryFilter(null)}
                />
              )
            )}
            {activeTab === "metricas" && <MetricasTab />}
            {activeTab === "categorias" && <CategoriasTab onSelectCategory={(slug) => { setCategoryFilter(slug); setActiveTab("artigos"); closeEditor(); }} />}
            {activeTab === "usuarios" && <UsuariosTab />}
            {activeTab === "configuracoes" && <ConfiguracoesTab />}
            {activeTab === "seo" && <SeoTab />}
            {activeTab === "anuncios" && <AnunciosTab />}
            {activeTab === "social" && <SocialPublishLogsTab />}
            {activeTab === "perfil" && <PerfilTab />}
          </main>
        </div>
      </div>
    </Layout>
  );
};

const EditorWrapper = ({
  mode,
  article,
  onClose,
  userId,
}: {
  mode: "create" | "edit";
  article: Article | null;
  onClose: () => void;
  userId: string;
}) => {
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();

  const handleSave = (data: any) => {
    if (mode === "edit" && article) {
      updateArticle.mutate({ id: article.id, ...data }, { onSuccess: onClose });
    } else {
      createArticle.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
        {mode === "create" ? "Novo Artigo" : "Editar Artigo"}
      </h1>
      <ArticleEditor
        article={article}
        onSave={handleSave}
        onCancel={onClose}
        saving={createArticle.isPending || updateArticle.isPending}
        userId={userId}
      />
    </div>
  );
};

const DashboardTab = ({ onEditArticle, onNavigate }: { onEditArticle: (a: Article) => void; onNavigate: (tab: Tab) => void }) => {
  const { data: articles = [], isLoading } = useArticles();

  const publishedCount = articles.filter((a) => a.published).length;
  const draftCount = articles.filter((a) => !a.published).length;
  const featuredCount = articles.filter((a) => a.featured).length;

  const quickActions = [
    {
      label: "Publicados",
      value: publishedCount,
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-500/10 border-green-500/20",
      tab: "artigos" as Tab,
    },
    {
      label: "Rascunhos",
      value: draftCount,
      icon: EyeOff,
      color: "text-amber-600",
      bg: "bg-amber-500/10 border-amber-500/20",
      tab: "artigos" as Tab,
    },
    {
      label: "Categorias",
      value: categories.length,
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-500/10 border-blue-500/20",
      tab: "categorias" as Tab,
    },
    {
      label: "Destaques",
      value: featuredCount,
      icon: Eye,
      color: "text-purple-600",
      bg: "bg-purple-500/10 border-purple-500/20",
      tab: "artigos" as Tab,
    },
  ];

  const shortcuts = [
    { label: "Novo Artigo", icon: Plus, tab: "artigos" as Tab, action: "new" },
    { label: "SEO", icon: SearchIcon, tab: "seo" as Tab },
    { label: "Usuários", icon: Users, tab: "usuarios" as Tab },
    { label: "Anúncios", icon: Megaphone, tab: "anuncios" as Tab },
    { label: "Configurações", icon: Wrench, tab: "configuracoes" as Tab },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do seu blog</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((stat) => (
          <button
            key={stat.label}
            onClick={() => onNavigate(stat.tab)}
            className={`group relative border rounded-xl p-4 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${stat.bg}`}
          >
            <div className={`p-2 rounded-lg bg-background/60 w-fit mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Quick Shortcuts */}
      <div>
        <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Acesso Rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {shortcuts.map((s) => (
            <button
              key={s.label}
              onClick={() => onNavigate(s.tab)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-sm font-medium text-foreground group"
            >
              <s.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Articles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider">Artigos Recentes</h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => onNavigate("artigos")}>
            Ver todos
          </Button>
        </div>
        {isLoading ? (
          <div className="text-muted-foreground text-sm">Carregando...</div>
        ) : articles.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum artigo criado ainda</p>
            <p className="text-xs mt-1">Clique em "Novo Artigo" para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {articles.slice(0, 5).map((article) => (
              <button
                key={article.id}
                onClick={() => onEditArticle(article)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/30 hover:border-primary/20 transition-all text-left group"
              >
                {article.image_url ? (
                  <img src={article.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">{article.title}</p>
                    {!article.published ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 rounded-full text-amber-600 shrink-0">Rascunho</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 rounded-full text-green-600 shrink-0">Publicado</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(article.created_at).toLocaleDateString("pt-BR")} • {article.category} • {article.read_time} min
                  </p>
                </div>
                <Edit className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ArtigosTab = ({
  onNew,
  onEdit,
  categoryFilter,
  onClearFilter,
}: {
  onNew: () => void;
  onEdit: (a: Article) => void;
  categoryFilter: string | null;
  onClearFilter: () => void;
}) => {
  const { data: articles = [], isLoading } = useArticles();
  const deleteArticle = useDeleteArticle();
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const filteredArticles = categoryFilter
    ? articles.filter((a) => a.category === categoryFilter)
    : articles;
  const categoryName = categoryFilter
    ? categories.find((c) => c.slug === categoryFilter)?.name || categoryFilter
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {categoryName ? `Artigos — ${categoryName}` : "Artigos"}
          </h1>
          {categoryFilter && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={onClearFilter}>
              ✕ Limpar filtro
            </Button>
          )}
        </div>
        <Button size="sm" className="gap-1" onClick={onNew}>
          <Plus className="h-4 w-4" /> Novo Artigo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Carregando...</div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {categoryFilter ? "Nenhum artigo nesta categoria." : "Nenhum artigo criado ainda."}
          </p>
          {!categoryFilter && (
            <Button onClick={onNew} className="gap-1">
              <Plus className="h-4 w-4" /> Criar primeiro artigo
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="divide-y">
            {filteredArticles.map((article) => (
              <div key={article.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">{article.title}</p>
                    {article.published ? (
                      <span className="text-xs px-1.5 py-0.5 bg-green-500/10 rounded text-green-600">Publicado</span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Rascunho</span>
                    )}
                    {article.featured && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary/10 rounded text-primary">Destaque</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {article.category} • {article.read_time} min • {new Date(article.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-1">
                  {article.published && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={`/blog/${article.slug}`} target="_blank" rel="noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(article)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteTarget(article)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) deleteArticle.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const CategoriasTab = ({ onSelectCategory }: { onSelectCategory: (slug: string) => void }) => {
  const { data: articles = [] } = useArticles();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Categorias</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const count = articles.filter((a) => a.category === cat.slug).length;
          return (
            <button
              key={cat.slug}
              onClick={() => onSelectCategory(cat.slug)}
              className="bg-card border rounded-lg p-5 text-left transition-all hover:shadow-md hover:border-primary/30 hover:scale-[1.02] active:scale-[0.98] group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-8 h-8 rounded-full ${cat.bgClass} flex items-center justify-center text-white text-sm`}>
                  {cat.icon}
                </span>
                <div>
                  <p className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{count} artigo{count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const PerfilTab = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Meu Perfil</h1>
      <div className="bg-card border rounded-lg p-6 space-y-4 max-w-lg">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled />
        </div>
        <div className="space-y-2">
          <Label>Nome de Exibição</Label>
          <Input placeholder="Seu nome" defaultValue={user?.user_metadata?.display_name || ""} />
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea placeholder="Uma breve descrição sobre você" />
        </div>
        <Button>Salvar Alterações</Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
