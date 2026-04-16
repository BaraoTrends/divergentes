import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "nr_session_id";
const VIEW_DEDUP_PREFIX = "nr_viewed_";
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 min

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

/**
 * Tracks article view + active read time + scroll depth.
 * - Records view once per session per article (30 min dedup window).
 * - Active read time only counts while tab is visible (não conta tempo em background).
 * - Envia eventos para dataLayer/gtag (GTM/GA4) caso disponíveis.
 * - Salva métricas finais via fetch keepalive em hide/unload.
 */
export function useArticleTracking(articleId: string | undefined) {
  const activeMsRef = useRef<number>(0);
  const lastTickRef = useRef<number>(Date.now());
  const isVisibleRef = useRef<boolean>(typeof document !== "undefined" ? document.visibilityState === "visible" : true);
  const maxScrollRef = useRef<number>(0);
  const viewIdRef = useRef<string | null>(null);
  const trackedRef = useRef<boolean>(false);
  const scrollMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!articleId || trackedRef.current) return;
    trackedRef.current = true;

    const dedupKey = `${VIEW_DEDUP_PREFIX}${articleId}`;
    const lastView = Number(localStorage.getItem(dedupKey) || 0);
    const isDuplicate = Date.now() - lastView < DEDUP_WINDOW_MS;

    const sessionId = getSessionId();
    const device = detectDevice();
    activeMsRef.current = 0;
    lastTickRef.current = Date.now();
    maxScrollRef.current = 0;
    scrollMilestonesRef.current = new Set();

    // Push page_view event para GTM/GA4 (mesmo se duplicado)
    try {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({
        event: "article_view",
        article_id: articleId,
        page_path: window.location.pathname,
        page_referrer: document.referrer || "(direct)",
      });
    } catch {
      /* ignore */
    }

    // Insert único por sessão/janela
    if (!isDuplicate) {
      supabase
        .from("article_views")
        .insert({
          article_id: articleId,
          session_id: sessionId,
          referrer: document.referrer || null,
          device,
          user_agent: navigator.userAgent.slice(0, 500),
          read_time_seconds: 0,
          scroll_depth: 0,
        })
        .select("id")
        .single()
        .then(({ data, error }) => {
          if (error || !data) return;
          viewIdRef.current = data.id;
          localStorage.setItem(dedupKey, String(Date.now()));
        });
    }

    const tickActive = () => {
      const now = Date.now();
      if (isVisibleRef.current) {
        activeMsRef.current += now - lastTickRef.current;
      }
      lastTickRef.current = now;
    };

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100));
      if (pct > maxScrollRef.current) maxScrollRef.current = pct;

      // Marcos 25/50/75/100% para GTM/GA4
      for (const m of [25, 50, 75, 100]) {
        if (pct >= m && !scrollMilestonesRef.current.has(m)) {
          scrollMilestonesRef.current.add(m);
          try {
            const w = window as any;
            w.dataLayer?.push({
              event: "scroll_depth",
              article_id: articleId,
              percent: m,
            });
          } catch {
            /* ignore */
          }
        }
      }
    };

    const onVisibility = () => {
      tickActive();
      isVisibleRef.current = document.visibilityState === "visible";
      if (document.visibilityState === "hidden") flush();
    };

    const flush = () => {
      tickActive();
      if (!viewIdRef.current) return;
      const seconds = Math.min(3600, Math.round(activeMsRef.current / 1000));
      const payload = {
        read_time_seconds: seconds,
        scroll_depth: maxScrollRef.current,
      };
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/article_views?id=eq.${viewIdRef.current}`;
      try {
        fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    };

    // Tick periódico para acumular tempo ativo
    const tickInterval = window.setInterval(tickActive, 5000);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      window.clearInterval(tickInterval);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [articleId]);
}
