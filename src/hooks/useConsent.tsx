import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

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

  const accept = useCallback(() => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setConsent("accepted");
  }, []);

  const decline = useCallback(() => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setConsent("declined");
  }, []);

  // Inject GTM only after consent is accepted
  useEffect(() => {
    if (consent !== "accepted") return;

    // Check if GTM is already loaded
    if (document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) return;

    // Load GTM dynamically
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX";
    document.head.appendChild(script);
  }, [consent]);

  return (
    <ConsentContext.Provider value={{ consent, accept, decline }}>
      {children}
    </ConsentContext.Provider>
  );
};
