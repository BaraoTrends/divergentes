import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";

interface AuditCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  value: string;
  detail?: string;
}

interface RouteAudit {
  path: string;
  label: string;
  status: "pass" | "warn" | "fail" | "error";
  checks: AuditCheck[];
}

interface AuditResult {
  summary: { total: number; pass: number; warn: number; fail: number };
  routes: RouteAudit[];
  timestamp: string;
}

const ACTIVE_JOB_KEY = "nr_seo_audit_active_job";

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />;
    case "warn":
      return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />;
    default:
      return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  }
};

const SeoAuditSection = () => {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const isRunning = jobStatus === "pending" || jobStatus === "processing";

  // Retoma job ativo ao montar (se o user minimizou/saiu da página)
  useEffect(() => {
    const saved = localStorage.getItem(ACTIVE_JOB_KEY);
    if (saved) {
      setJobId(saved);
      setJobStatus("processing");
    }
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  // Polling do status do job
  useEffect(() => {
    if (!jobId || !isRunning) return;

    const poll = async () => {
      const { data, error: err } = await supabase
        .from("seo_audit_jobs")
        .select("status, result, error_message, progress_done, progress_total")
        .eq("id", jobId)
        .maybeSingle();
      if (err) {
        setError(err.message);
        return;
      }
      if (!data) return;

      setJobStatus(data.status);
      setProgress({ done: data.progress_done || 0, total: data.progress_total || 0 });

      if (data.status === "completed" && data.result) {
        setResult(data.result as unknown as AuditResult);
        localStorage.removeItem(ACTIVE_JOB_KEY);
        if (pollRef.current) window.clearInterval(pollRef.current);
      } else if (data.status === "failed") {
        setError(data.error_message || "Auditoria falhou.");
        localStorage.removeItem(ACTIVE_JOB_KEY);
        if (pollRef.current) window.clearInterval(pollRef.current);
      }
    };

    poll();
    pollRef.current = window.setInterval(poll, 3000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [jobId, isRunning]);

  const runAudit = async () => {
    setError(null);
    setResult(null);
    setProgress({ done: 0, total: 0 });
    setJobStatus("pending");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seo-audit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok && res.status !== 202) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
      }
      const data = await res.json();
      if (!data.jobId) throw new Error("Resposta sem jobId");
      setJobId(data.jobId);
      localStorage.setItem(ACTIVE_JOB_KEY, data.jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setJobStatus(null);
    }
  };

  const statusBg = (status: string) => {
    switch (status) {
      case "pass": return "bg-green-500/10 border-green-500/20";
      case "warn": return "bg-yellow-500/10 border-yellow-500/20";
      default: return "bg-red-500/10 border-red-500/20";
    }
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Auditoria SEO Automatizada</p>
          <p className="text-[11px] text-muted-foreground">
            Roda em background — pode minimizar ou trocar de página sem interromper.
          </p>
        </div>
        <Button onClick={runAudit} disabled={isRunning} size="sm" className="gap-2">
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          {isRunning ? "Auditando..." : result ? "Reaudit" : "Executar Auditoria"}
        </Button>
      </div>

      {isRunning && (
        <div className="border rounded-lg p-3 bg-card space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {jobStatus === "pending" ? "Iniciando…" : `Processando rota ${progress.done} de ${progress.total || "?"}`}
            </span>
            <span className="font-medium text-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-sm text-red-600">
          Erro: {error}
        </div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="border rounded-lg p-3 bg-card text-center">
              <p className="text-[11px] text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground">{result.summary.total}</p>
            </div>
            <div className={`border rounded-lg p-3 text-center ${statusBg("pass")}`}>
              <p className="text-[11px] text-muted-foreground">OK</p>
              <p className="text-lg font-bold text-green-600">{result.summary.pass}</p>
            </div>
            <div className={`border rounded-lg p-3 text-center ${statusBg("warn")}`}>
              <p className="text-[11px] text-muted-foreground">Atenção</p>
              <p className="text-lg font-bold text-yellow-600">{result.summary.warn}</p>
            </div>
            <div className={`border rounded-lg p-3 text-center ${statusBg("fail")}`}>
              <p className="text-[11px] text-muted-foreground">Falha</p>
              <p className="text-lg font-bold text-red-600">{result.summary.fail}</p>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-right">
            Última auditoria: {new Date(result.timestamp).toLocaleString("pt-BR")}
          </p>

          <div className="space-y-1.5">
            {result.routes.map((route) => {
              const isExpanded = expandedRoute === route.path;
              return (
                <div key={route.path} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedRoute(isExpanded ? null : route.path)}
                    className="w-full flex items-center gap-2.5 p-2.5 hover:bg-accent/30 transition-colors text-left"
                  >
                    <StatusIcon status={route.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{route.label}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{route.path}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {route.checks.filter((c) => c.status === "fail").length > 0 && (
                        <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                          {route.checks.filter((c) => c.status === "fail").length} falha(s)
                        </Badge>
                      )}
                      {route.checks.filter((c) => c.status === "warn").length > 0 && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 text-yellow-600 border-yellow-500/30">
                          {route.checks.filter((c) => c.status === "warn").length} aviso(s)
                        </Badge>
                      )}
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-3 py-2 space-y-1.5 bg-accent/10">
                      {route.checks.map((check) => (
                        <div key={check.id} className="flex items-start gap-2 py-1">
                          <StatusIcon status={check.status} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-foreground">{check.label}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{check.value}</span>
                            </div>
                            {check.detail && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 break-all">{check.detail}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SeoAuditSection;
