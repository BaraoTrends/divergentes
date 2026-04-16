import { supabase } from "@/integrations/supabase/client";

const RATE_LIMIT_KEY = "nr_error_log_last";
const RATE_LIMIT_MS = 10_000; // 1 log a cada 10s por sessão
const SESSION_KEY = "nr_session_id";
const RECENT_KEY = "nr_error_log_recent";
const RECENT_TTL_MS = 60_000; // dedup de mensagens iguais por 1 min

interface LogPayload {
  message: string;
  stack?: string | null;
  componentStack?: string | null;
  source?: string; // "boundary" | "window.onerror" | "unhandledrejection"
}

function shouldSkip(message: string): boolean {
  // Filtra ruído comum (extensions, scripts cross-origin, etc.)
  if (!message) return true;
  if (/ResizeObserver loop/i.test(message)) return true;
  if (/Script error\.?$/i.test(message)) return true;
  if (/Non-Error promise rejection captured/i.test(message)) return true;
  return false;
}

function isDuplicate(message: string): boolean {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    // Limpa expirados
    for (const k of Object.keys(map)) {
      if (now - map[k] > RECENT_TTL_MS) delete map[k];
    }
    const key = message.slice(0, 200);
    if (map[key]) {
      sessionStorage.setItem(RECENT_KEY, JSON.stringify(map));
      return true;
    }
    map[key] = now;
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(map));
    return false;
  } catch {
    return false;
  }
}

export async function logError({ message, stack, componentStack, source = "unknown" }: LogPayload) {
  try {
    if (shouldSkip(message)) return;
    if (isDuplicate(message)) return;

    const last = Number(localStorage.getItem(RATE_LIMIT_KEY) || 0);
    if (Date.now() - last < RATE_LIMIT_MS) return;
    localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));

    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = localStorage.getItem(SESSION_KEY);

    await supabase.from("error_logs").insert({
      message: `[${source}] ${message}`.slice(0, 1000),
      stack: stack?.slice(0, 4000) || null,
      component_stack: componentStack?.slice(0, 4000) || null,
      url: window.location.href.slice(0, 500),
      user_agent: navigator.userAgent.slice(0, 500),
      user_id: user?.id ?? null,
      session_id: sessionId,
    });
  } catch {
    /* não propagar */
  }
}

let installed = false;

export function installGlobalErrorHandlers() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event: ErrorEvent) => {
    const msg = event.message || event.error?.message || "Unknown window error";
    logError({
      message: msg,
      stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
      source: "window.onerror",
    });
  });

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const msg =
      typeof reason === "string"
        ? reason
        : reason?.message || JSON.stringify(reason)?.slice(0, 500) || "Unhandled promise rejection";
    logError({
      message: msg,
      stack: reason?.stack || null,
      source: "unhandledrejection",
    });
  });
}
