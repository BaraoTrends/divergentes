import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { logError } from "@/lib/errorLogger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Erro capturado:", error, errorInfo);
    logError({
      message: error.message || "Unknown error",
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      source: "boundary",
    });
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
