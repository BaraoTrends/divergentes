import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type ConsentStatus = "pending" | "accepted" | "declined";

interface ConsentContextType {
  consent: ConsentStatus;
  accept: () => void;
  decline: () => void;
}

const COOKIE_KEY = "neurorotina_cookie_consent";

const ConsentContext = createContext<ConsentContextType>({
  consent: "pending",
  accept: () => {},
  decline: () => {},
});

export const useConsent = () => useContext(ConsentContext);

export const ConsentProvider = ({ children }: { children: ReactNode }) => {
  const [consent, setConsent] = useState<ConsentStatus>(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (stored === "accepted") return "accepted";
    if (stored === "declined") return "declined";
    return "pending";
  });

  const [gtmId, setGtmId] = useState<string | null>(null);

  // Fetch GTM ID from site_settings
  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "gtm_id")
      .maybeSingle()
      .then(({ data, error }) => {
        console.log("[GTM] Fetched gtm_id:", data, "error:", error);
        const id = data?.value?.trim();
        if (id && id.length > 3 && id.startsWith("GTM-")) {
          console.log("[GTM] Valid GTM ID found:", id);
          setGtmId(id);
        }
      });
  }, []);

  const accept = useCallback(() => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setConsent("accepted");
  }, []);

  const decline = useCallback(() => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setConsent("declined");
  }, []);

  // Inject GTM only after consent is accepted AND we have a valid GTM ID
  useEffect(() => {
    if (consent !== "accepted" || !gtmId) return;

    // Check if GTM is already loaded
    if (document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) return;

    // Load GTM dynamically
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    document.head.appendChild(script);

    // Also inject noscript iframe in body
    const noscript = document.createElement("noscript");
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);
  }, [consent, gtmId]);

  return (
    <ConsentContext.Provider value={{ consent, accept, decline }}>
      {children}
    </ConsentContext.Provider>
  );
};
