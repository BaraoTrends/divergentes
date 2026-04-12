import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, User } from "lucide-react";

const AdminLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
        setLoading(false);
      } else {
        // Navigation will happen via useEffect when auth state updates
        // Add safety timeout
        setTimeout(() => setLoading(false), 5000);
      }
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
      }
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead title="Acesso Admin" description="Painel administrativo" path="/admin/login" noindex />
      <div className="container py-16 flex justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {isLogin ? "Acesso Administrativo" : "Criar Conta"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Entre com suas credenciais" : "Registre-se para solicitar acesso"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-card border rounded-lg p-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
                {isLogin ? "Registre-se" : "Faça login"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AdminLogin;
