interface AdSlotProps {
  /** Unique slot identifier for ad network targeting */
  slotId: string;
  /** Common ad sizes: "banner" (728x90), "rectangle" (300x250), "leaderboard" (970x90), "mobile" (320x50) */
  format?: "banner" | "rectangle" | "leaderboard" | "mobile";
  className?: string;
}

const sizeMap = {
  banner: { width: 728, height: 90, label: "728×90" },
  rectangle: { width: 300, height: 250, label: "300×250" },
  leaderboard: { width: 970, height: 90, label: "970×90" },
  mobile: { width: 320, height: 50, label: "320×50" },
};

/**
 * Placeholder ad slot — replace the inner content with your ad network code
 * (Google AdSense, Ad Manager, etc).
 *
 * Usage:
 *   <AdSlot slotId="header-banner" format="banner" />
 *
 * To activate ads, replace the placeholder <div> inside with your ad script, e.g.:
 *   <ins className="adsbygoogle" data-ad-client="ca-pub-XXXX" data-ad-slot="YYYY" ... />
 */
const AdSlot = ({ slotId, format = "banner", className = "" }: AdSlotProps) => {
  const size = sizeMap[format];

  return (
    <div
      className={`ad-slot flex items-center justify-center mx-auto ${className}`}
      data-ad-slot={slotId}
      style={{ maxWidth: size.width, minHeight: size.height }}
    >
      {/* ===== REPLACE THIS BLOCK WITH YOUR AD CODE ===== */}
      <div
        className="w-full border-2 border-dashed border-muted-foreground/20 rounded-md flex items-center justify-center text-muted-foreground/40 text-xs select-none"
        style={{ height: size.height }}
      >
        Anúncio • {size.label} • {slotId}
      </div>
      {/* ===== END AD PLACEHOLDER ===== */}
    </div>
  );
};

export default AdSlot;
