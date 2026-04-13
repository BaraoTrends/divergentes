import { useIsAdEnabled } from "@/hooks/useAdSettings";

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
  const size = sizeMap[format];

  if (!enabled) return null;

  return (
    <div
      className={`ad-slot flex items-center justify-center mx-auto ${className}`}
      data-ad-slot={slotId}
      style={{ maxWidth: size.width, minHeight: size.height }}
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
