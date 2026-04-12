import { useState } from "react";
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
} from "lucide-react";

type Tab = "dashboard" | "artigos" | "categorias" | "usuarios" | "perfil";
type EditorMode = null | "create" | "edit";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
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

  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "artigos" as Tab, label: "Artigos", icon: FileText },
    { id: "categorias" as Tab, label: "Categorias", icon: BarChart3 },
    { id: "usuarios" as Tab, label: "Usuários", icon: Users },
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
            {activeTab === "dashboard" && <DashboardTab onEditArticle={(a) => { setActiveTab("artigos"); openEditor("edit", a); }} />}
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
                />
              )
            )}
            {activeTab === "categorias" && <CategoriasTab />}
            {activeTab === "usuarios" && <UsuariosTab />}
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

const DashboardTab = ({ onEditArticle }: { onEditArticle: (a: Article) => void }) => {
  const { data: articles = [], isLoading } = useArticles();

  const publishedCount = articles.filter((a) => a.published).length;
  const draftCount = articles.filter((a) => !a.published).length;

  const stats = [
    { label: "Publicados", value: publishedCount, icon: FileText },
    { label: "Rascunhos", value: draftCount, icon: EyeOff },
    { label: "Categorias", value: categories.length, icon: BarChart3 },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-heading text-lg font-bold text-foreground mb-4">Artigos Recentes</h2>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Carregando...</div>
      ) : articles.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
          Nenhum artigo criado ainda. Vá em "Artigos" para criar o primeiro!
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="divide-y">
            {articles.slice(0, 5).map((article) => (
              <div key={article.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">{article.title}</p>
                    {!article.published && (
                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Rascunho</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(article.created_at).toLocaleDateString("pt-BR")} • {article.category}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditArticle(article)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ArtigosTab = ({
  onNew,
  onEdit,
}: {
  onNew: () => void;
  onEdit: (a: Article) => void;
}) => {
  const { data: articles = [], isLoading } = useArticles();
  const deleteArticle = useDeleteArticle();
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Artigos</h1>
        <Button size="sm" className="gap-1" onClick={onNew}>
          <Plus className="h-4 w-4" /> Novo Artigo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Carregando...</div>
      ) : articles.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">Nenhum artigo criado ainda.</p>
          <Button onClick={onNew} className="gap-1">
            <Plus className="h-4 w-4" /> Criar primeiro artigo
          </Button>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="divide-y">
            {articles.map((article) => (
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

const CategoriasTab = () => {
  const { data: articles = [] } = useArticles();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Categorias</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const count = articles.filter((a) => a.category === cat.slug).length;
          return (
            <div key={cat.slug} className="bg-card border rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-8 h-8 rounded-full ${cat.bgClass} flex items-center justify-center text-white text-sm`}>
                  {cat.icon}
                </span>
                <div>
                  <p className="font-heading font-bold text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{count} artigo{count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>
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
