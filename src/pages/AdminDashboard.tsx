import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { blogPosts, categories } from "@/lib/content";
import { blogImages } from "@/lib/images";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
} from "lucide-react";

type Tab = "dashboard" | "artigos" | "categorias" | "perfil";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "artigos" as Tab, label: "Artigos", icon: FileText },
    { id: "categorias" as Tab, label: "Categorias", icon: BarChart3 },
    { id: "perfil" as Tab, label: "Perfil", icon: Settings },
  ];

  return (
    <Layout>
      <SEOHead title="Painel Admin" description="Painel administrativo" path="/admin" />
      <div className="container py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-64 shrink-0">
            <div className="bg-card border rounded-lg p-4 space-y-1 sticky top-24">
              <div className="px-3 py-2 mb-3 border-b">
                <p className="font-heading font-bold text-sm text-foreground truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {activeTab === "dashboard" && <DashboardTab />}
            {activeTab === "artigos" && <ArtigosTab />}
            {activeTab === "categorias" && <CategoriasTab />}
            {activeTab === "perfil" && <PerfilTab />}
          </main>
        </div>
      </div>
    </Layout>
  );
};

const DashboardTab = () => {
  const stats = [
    { label: "Total de Artigos", value: blogPosts.length, icon: FileText },
    { label: "Categorias", value: categories.length, icon: BarChart3 },
    { label: "Autores", value: [...new Set(blogPosts.map((p) => p.author))].length, icon: Users },
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
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="divide-y">
          {blogPosts.slice(0, 5).map((post) => (
            <div key={post.slug} className="flex items-center gap-4 p-4">
              {blogImages[post.slug] && (
                <img src={blogImages[post.slug]} alt="" className="w-12 h-12 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{post.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.datePublished).toLocaleDateString("pt-BR")} • {post.category}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                    <Eye className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ArtigosTab = () => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Artigos</h1>
      <Button size="sm" className="gap-1">
        <Plus className="h-4 w-4" /> Novo Artigo
      </Button>
    </div>
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="divide-y">
        {blogPosts.map((post) => (
          <div key={post.slug} className="flex items-center gap-4 p-4">
            {blogImages[post.slug] && (
              <img src={blogImages[post.slug]} alt="" className="w-16 h-10 rounded object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{post.title}</p>
              <p className="text-xs text-muted-foreground">
                {post.category} • {post.readingTime} min • {new Date(post.datePublished).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                  <Eye className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CategoriasTab = () => (
  <div>
    <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Categorias</h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {categories.map((cat) => {
        const count = blogPosts.filter((p) => p.category === cat.slug).length;
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
