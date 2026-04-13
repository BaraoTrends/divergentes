import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_KEY = "neurorotina_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-3xl bg-card border border-border rounded-xl shadow-lg p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="h-8 w-8 text-primary shrink-0 hidden sm:block" />
        <div className="flex-1 text-sm text-muted-foreground leading-relaxed">
          <p>
            Usamos cookies para melhorar sua experiência, analisar tráfego e exibir anúncios relevantes.
            Ao continuar navegando, você concorda com nossa{" "}
            <Link to="/politica-de-privacidade" className="text-primary underline underline-offset-2 hover:text-primary/80">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button onClick={accept} size="sm" className="flex-1 sm:flex-none">
            Aceitar
          </Button>
          <Button onClick={decline} variant="outline" size="sm" className="flex-1 sm:flex-none">
            Recusar
          </Button>
          <button onClick={decline} className="text-muted-foreground hover:text-foreground p-1 sm:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
