import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const RATE_LIMIT_KEY = "nr_error_log_last";
const RATE_LIMIT_MS = 10_000; // no máx. 1 log a cada 10s por sessão
const SESSION_KEY = "nr_session_id";

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Erro capturado:", error, errorInfo);
    try {
      const last = Number(localStorage.getItem(RATE_LIMIT_KEY) || 0);
      if (Date.now() - last < RATE_LIMIT_MS) return;
      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));

      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = localStorage.getItem(SESSION_KEY);

      await supabase.from("error_logs").insert({
        message: error.message?.slice(0, 1000) || "Unknown error",
        stack: error.stack?.slice(0, 4000) || null,
        component_stack: errorInfo.componentStack?.slice(0, 4000) || null,
        url: window.location.href.slice(0, 500),
        user_agent: navigator.userAgent.slice(0, 500),
        user_id: user?.id ?? null,
        session_id: sessionId,
      });
    } catch {
      /* não propagar erro do logger */
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Algo deu errado
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Encontramos um problema inesperado ao carregar esta página. Nossa equipe foi notificada.
            </p>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details className="text-left bg-muted rounded-md p-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium mb-2">Detalhes técnicos</summary>
              <pre className="whitespace-pre-wrap break-words">{this.state.error.message}</pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Recarregar
            </button>
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Home className="w-4 h-4" /> Ir para o início
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
