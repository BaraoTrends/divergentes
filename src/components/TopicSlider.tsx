import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopicSliderProps {
  suggestions: string[];
  disabled?: boolean;
  onSelect: (topic: string) => void;
}

export default function TopicSlider({ suggestions, disabled, onSelect }: TopicSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-topic-card]");
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    setActiveIndex(index);
  }, []);

  const next = useCallback(() => {
    setActiveIndex((prev) => {
      const nextIdx = prev + 1 >= suggestions.length ? 0 : prev + 1;
      setTimeout(() => scrollToIndex(nextIdx), 0);
      return nextIdx;
    });
  }, [suggestions.length, scrollToIndex]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => {
      const prevIdx = prev - 1 < 0 ? suggestions.length - 1 : prev - 1;
      setTimeout(() => scrollToIndex(prevIdx), 0);
      return prevIdx;
    });
  }, [suggestions.length, scrollToIndex]);

  // Auto-scroll every 4 seconds
  useEffect(() => {
    if (isPaused || suggestions.length <= 1) return;
    intervalRef.current = setInterval(next, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, next, suggestions.length]);

  // Reset on new suggestions
  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [suggestions]);

  if (suggestions.length === 0) return null;

  return (
    <div
      className="relative rounded-lg border bg-muted/30 p-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">
        💡 Clique em um tema para gerar o artigo automaticamente:
      </p>

      <div className="relative flex items-center gap-1">
        {/* Left arrow */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 hidden sm:flex"
          onClick={(e) => { e.preventDefault(); prev(); }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide flex-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              type="button"
              data-topic-card
              disabled={disabled}
              className={`snap-center shrink-0 w-[85%] sm:w-[260px] text-left text-sm px-4 py-3 rounded-lg border transition-all disabled:opacity-50
                ${activeIndex === i
                  ? "bg-primary/10 border-primary/40 shadow-sm"
                  : "bg-background/60 border-border/50 hover:bg-primary/5 hover:border-primary/20"
                }`}
              onClick={() => onSelect(suggestion)}
            >
              <span className="text-xs font-semibold text-primary/60 mr-1">{i + 1}.</span>
              {suggestion}
            </button>
          ))}
        </div>

        {/* Right arrow */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 hidden sm:flex"
          onClick={(e) => { e.preventDefault(); next(); }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-2">
        {suggestions.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`h-1.5 rounded-full transition-all ${
              activeIndex === i ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
