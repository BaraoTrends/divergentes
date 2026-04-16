import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncSessionState = useCallback((nextSession: Session | null) => {
    const nextUser = nextSession?.user ?? null;

    setSession(nextSession);
    setUser(nextUser);
    setAuthReady(true);
    setLoading(!!nextUser);

    if (!nextUser) {
      setIsAdmin(false);
    }
  }, []);

  const checkAdmin = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      if (!error && data === true) {
        return true;
      }

      if (error) {
        console.error("[useAuth] has_role RPC error:", error);
      }

      const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        console.error("[useAuth] user_roles fallback error:", roleError);
        return false;
      }

      return !!roleRow;
    } catch (e) {
      console.error("[useAuth] checkAdmin exception:", e);
      return false;
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        syncSessionState(newSession);
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      syncSessionState(initialSession);
    });

    return () => subscription.unsubscribe();
  }, [syncSessionState]);

  useEffect(() => {
    let cancelled = false;

    if (!authReady) {
      setLoading(true);
      return () => {
        cancelled = true;
      };
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);

    void checkAdmin(user.id).then((admin) => {
      if (cancelled) return;
      setIsAdmin(admin);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [authReady, checkAdmin, user]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setIsAdmin(false);
    }
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setIsAdmin(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
