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
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  return "desktop";
}

/**
 * Tracks article view + read time + scroll depth.
 * - Records view once per session per article (30 min dedup window).
 * - On unmount/unload, updates with final read time + max scroll depth.
 */
export function useArticleTracking(articleId: string | undefined) {
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);
  const viewIdRef = useRef<string | null>(null);
  const trackedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!articleId || trackedRef.current) return;
    trackedRef.current = true;

    const dedupKey = `${VIEW_DEDUP_PREFIX}${articleId}`;
    const lastView = Number(localStorage.getItem(dedupKey) || 0);
    if (Date.now() - lastView < DEDUP_WINDOW_MS) {
      return; // already tracked recently
    }

    const sessionId = getSessionId();
    const device = detectDevice();
    startTimeRef.current = Date.now();
    maxScrollRef.current = 0;

    // Record initial view
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

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100));
      if (pct > maxScrollRef.current) maxScrollRef.current = pct;
    };

    const flush = () => {
      if (!viewIdRef.current) return;
      const seconds = Math.min(3600, Math.round((Date.now() - startTimeRef.current) / 1000));
      const payload = {
        read_time_seconds: seconds,
        scroll_depth: maxScrollRef.current,
      };
      // Use sendBeacon for reliable unload delivery via REST endpoint
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/article_views?id=eq.${viewIdRef.current}`;
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      try {
        // sendBeacon doesn't support PATCH, so fall back to fetch keepalive
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
        // ignore
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [articleId]);
}
