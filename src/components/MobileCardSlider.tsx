"use client";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileCardSliderProps {
  children: React.ReactNode;
  desktopGridClass?: string;
  /** Kept for backwards compatibility; the real count is taken from the children. */
  itemCount?: number;
  label?: string;
  className?: string;
}

const GAP = 16; // px between cards on mobile (matches gap-4)

/**
 * Below the `sm` breakpoint: a one-card-at-a-time carousel. Every card is exactly as wide as the track, so partial
 * neighbours can never show. Swipe (native scroll-snap), arrows, dots and Arrow keys all move one card.
 * From `sm` up the children are laid out with `desktopGridClass` exactly as before.
 */
export default function MobileCardSlider({
  children,
  desktopGridClass = "sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6",
  label = "Cards",
  className,
}: MobileCardSliderProps) {
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const count = React.Children.toArray(children).length;
  const [index, setIndex] = useState(0);
  const raf = useRef(0);

  const readIndex = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const step = el.clientWidth + GAP;
    setIndex(Math.min(Math.max(Math.round(el.scrollLeft / step), 0), Math.max(count - 1, 0)));
  }, [count]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(readIndex);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    // keep the active card aligned when the viewport (and so the card width) changes
    const onResize = () => { el.scrollTo({ left: index * (el.clientWidth + GAP) }); };
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf.current);
    };
  }, [readIndex, index]);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.min(Math.max(i, 0), count - 1);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * (el.clientWidth + GAP), behavior: reduce ? "auto" : "smooth" });
    setIndex(next);
  };

  const btn =
    "flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-surface text-ink shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:text-brand";

  return (
    <div className={cn("relative w-full", className)}>
      <div
        ref={track}
        role="group"
        aria-roledescription="carousel"
        aria-label={label}
        aria-describedby={`${id}-status`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
        }}
        className={cn(
          // mobile: one full-width card per snap point
          "flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 scrollbar-none focus-visible:outline-none",
          "max-sm:[&>*]:w-full max-sm:[&>*]:max-w-none max-sm:[&>*]:shrink-0 max-sm:[&>*]:grow-0 max-sm:[&>*]:basis-full max-sm:[&>*]:snap-center max-sm:[&>*]:snap-always",
          // sm and up: the original grid, no scrolling
          desktopGridClass,
          "sm:flex-none sm:snap-none sm:overflow-visible sm:pb-0"
        )}
      >
        {children}
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3 sm:hidden">
          <button type="button" className={btn} onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous card">
            <ChevronLeft size={18} />
          </button>
          <div className="flex min-w-0 flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5" role="tablist" aria-label={`${label} pages`}>
              {Array.from({ length: count }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Go to card ${i + 1} of ${count}`}
                  onClick={() => goTo(i)}
                  className="flex h-6 w-4 items-center justify-center"
                >
                  <span className={cn("block h-1.5 rounded-full transition-all duration-300", i === index ? "w-5 bg-brand" : "w-1.5 bg-ink/25")} />
                </button>
              ))}
            </div>
            <span id={`${id}-status`} className="text-[11px] font-semibold text-mute" aria-live="polite">
              {index + 1} / {count}
            </span>
          </div>
          <button type="button" className={btn} onClick={() => goTo(index + 1)} disabled={index === count - 1} aria-label="Next card">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
