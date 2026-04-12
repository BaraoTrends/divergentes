import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Shield, ShieldOff, Search, Users } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: "admin" | "moderator" | "user";
}

const useProfiles = () =>
  useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

const useUserRoles = () =>
  useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      return data as UserRole[];
    },
  });

const UsuariosTab = () => {
  const { data: profiles = [], isLoading: loadingProfiles } = useProfiles();
  const { data: roles = [], isLoading: loadingRoles } = useUserRoles();
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    name: string;
    action: "grant" | "revoke";
  } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const grantAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" as const });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({ title: "Role atribuída", description: "Usuário agora é administrador." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const revokeAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin" as const);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({ title: "Role removida", description: "Permissão de admin removida." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const isAdmin = (userId: string) =>
    roles.some((r) => r.user_id === userId && r.role === "admin");

  const filtered = profiles.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.display_name?.toLowerCase().includes(q) ||
      p.user_id.toLowerCase().includes(q)
    );
  });

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.action === "grant") {
      grantAdmin.mutate(confirmAction.userId);
    } else {
      revokeAdmin.mutate(confirmAction.userId);
    }
    setConfirmAction(null);
  };

  const isLoading = loadingProfiles || loadingRoles;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Usuários</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {profiles.length} cadastrado{profiles.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
          {search ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="divide-y">
            {filtered.map((profile) => {
              const admin = isAdmin(profile.user_id);
              return (
                <div key={profile.id} className="flex items-center gap-4 p-4">
                  <div className="flex-shrink-0">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                        {(profile.display_name || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm truncate">
                        {profile.display_name || "Sem nome"}
                      </p>
                      {admin && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary/10 rounded text-primary font-medium flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Desde {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    {admin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() =>
                          setConfirmAction({
                            userId: profile.user_id,
                            name: profile.display_name || "este usuário",
                            action: "revoke",
                          })
                        }
                      >
                        <ShieldOff className="h-3.5 w-3.5" /> Remover Admin
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() =>
                          setConfirmAction({
                            userId: profile.user_id,
                            name: profile.display_name || "este usuário",
                            action: "grant",
                          })
                        }
                      >
                        <Shield className="h-3.5 w-3.5" /> Tornar Admin
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "grant"
                ? "Atribuir permissão de admin?"
                : "Remover permissão de admin?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "grant"
                ? `"${confirmAction.name}" terá acesso total ao painel administrativo, incluindo criar, editar e excluir artigos.`
                : `"${confirmAction?.name}" perderá o acesso ao painel administrativo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                confirmAction?.action === "revoke"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmAction?.action === "grant" ? "Confirmar" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsuariosTab;
