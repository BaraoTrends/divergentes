import { useEffect, useRef } from "react";
import { useIsAdEnabled, useAdCode } from "@/hooks/useAdSettings";
import { useConsent } from "@/hooks/useConsent";

interface AdSlotProps {
  slotId: string;
  format?: "banner" | "rectangle" | "leaderboard" | "mobile";
  className?: string;
}

const sizeMap = {
  banner: { width: 728, height: 90, label: "728×90" },
  rectangle: { width: 300, height: 250, label: "300×250" },
  leaderboard: { width: 970, height: 90, label: "970×90" },
  mobile: { width: 320, height: 50, label: "320×50" },
};

const AdSlot = ({ slotId, format = "banner", className = "" }: AdSlotProps) => {
  const enabled = useIsAdEnabled(slotId);
  const adCode = useAdCode(slotId);
  const { consent } = useConsent();
  const size = sizeMap[format];
  const containerRef = useRef<HTMLDivElement>(null);

  // Inject ad HTML and execute scripts
  useEffect(() => {
    if (!containerRef.current || !adCode || consent !== "accepted") return;

    const container = containerRef.current;
    container.innerHTML = adCode;

    // Execute any script tags in the ad code
    const scripts = container.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [adCode, consent]);

  // Always reserve the slot's vertical space to prevent CLS, even when ad is disabled
  // or consent is pending. This avoids layout shifts when ads load asynchronously.
  if (!enabled || consent !== "accepted") {
    return (
      <div
        aria-hidden="true"
        className={`ad-slot mx-auto ${className}`}
        data-ad-slot={slotId}
        data-ad-state={!enabled ? "disabled" : "pending-consent"}
        style={{ maxWidth: size.width, height: size.height, width: "100%" }}
      />
    );
  }

  // If there's custom ad code, render it
  if (adCode) {
    return (
      <div
        className={`ad-slot flex items-center justify-center mx-auto ${className}`}
        data-ad-slot={slotId}
        style={{ maxWidth: size.width, minHeight: size.height, height: size.height }}
        ref={containerRef}
      />
    );
  }

  // Placeholder
  return (
    <div
      className={`ad-slot flex items-center justify-center mx-auto ${className}`}
      data-ad-slot={slotId}
      style={{ maxWidth: size.width, minHeight: size.height, height: size.height }}
    >
      <div
        className="w-full border-2 border-dashed border-muted-foreground/20 rounded-md flex items-center justify-center text-muted-foreground/40 text-xs select-none"
        style={{ height: size.height }}
      >
        Anúncio • {size.label} • {slotId}
      </div>
    </div>
  );
};

export default AdSlot;
