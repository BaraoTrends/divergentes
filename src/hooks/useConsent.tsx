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

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const ConsentProvider = ({ children }: { children: ReactNode }) => {
  const [consent, setConsent] = useState<ConsentStatus>(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (stored === "accepted") return "accepted";
    if (stored === "declined") return "declined";
    return "pending";
  });

  const [gtmId, setGtmId] = useState<string | null>(null);
  const [ga4Id, setGa4Id] = useState<string | null>(null);

  // Fetch GTM + GA4 IDs from site_settings
  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["gtm_id", "seo_ga_id"])
      .then(({ data }) => {
        if (!data) return;
        for (const row of data) {
          const v = row.value?.trim();
          if (!v) continue;
          if (row.key === "gtm_id" && v.startsWith("GTM-")) setGtmId(v);
          if (row.key === "seo_ga_id" && v.startsWith("G-")) setGa4Id(v);
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

  // Inject GTM after consent
  useEffect(() => {
    if (consent !== "accepted" || !gtmId) return;
    if (document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    script.onerror = () => console.warn("[analytics] GTM bloqueado (provavelmente por adblocker)");
    document.head.appendChild(script);

    // Nota: o fallback <noscript><iframe> do GTM não é necessário em SPAs (JS sempre habilitado)
    // e inserir nodes em document.body fora do controle do React causa erros de reconciliação (#61).
  }, [consent, gtmId]);

  // Inject GA4 (gtag.js) directly — independente do GTM
  useEffect(() => {
    if (consent !== "accepted" || !ga4Id) return;
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${ga4Id}"]`)) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    script.onerror = () => console.warn("[analytics] GA4 bloqueado (provavelmente por adblocker)");
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", ga4Id, { anonymize_ip: true });
  }, [consent, ga4Id]);

  return (
    <ConsentContext.Provider value={{ consent, accept, decline }}>
      {children}
    </ConsentContext.Provider>
  );
};
