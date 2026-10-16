"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Pause, Play, X, Sparkles } from "lucide-react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import type { Media } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function GallerySlider({ media, autoplay = true }: { media: Media[]; autoplay?: boolean }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(autoplay && !reduce);
  const [isHovered, setIsHovered] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);
  const touch = useRef(0);
  const n = media.length;

  const go = useCallback((d: number) => setI((c) => (c + d + n) % n), [n]);

  // Auto-slide every 4 seconds when playing
  useEffect(() => {
    if (!playing || n < 2 || reduce) return;
    const t = setInterval(() => go(1), 4000);
    return () => clearInterval(t);
  }, [playing, n, go, reduce]);

  if (!n) {
    return (
      <div className="card grid aspect-[16/9] place-items-center text-sm text-mute">
        Photos coming soon
      </div>
    );
  }

  const m = media[i];
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Property photos"
      onKeyDown={key}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-surface border border-ink/10 shadow-lg"
        tabIndex={0}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const d = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(d) > 50) go(d < 0 ? 1 : -1);
        }}
      >
        <div className="aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-black/90">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0.85, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.85 }}
              transition={{ duration: 0.4 }}
              className="h-full w-full"
            >
              {m.type === "video" ? (
                <video
                  src={m.url}
                  poster={m.poster}
                  controls
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                  aria-label={m.alt}
                />
              ) : (
                <img
                  src={m.url}
                  alt={m.alt}
                  className="h-full w-full object-cover"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide Progress Timer Bar */}
        {n > 1 && playing && !isHovered && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-10 overflow-hidden">
            <motion.div
              key={i}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4.5, ease: "linear" }}
              className="h-full bg-brand"
            />
          </div>
        )}

        {/* Caption & Tag */}
        {(m.caption || m.tag) && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-black/65 px-3.5 py-1 text-xs text-white backdrop-blur-md">
            <span className="font-bold text-accent">{m.tag}</span>
            {m.caption && <span className="opacity-80">· {m.caption}</span>}
          </div>
        )}

        {/* Slide Counter Badge */}
        <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/65 px-3 py-1 text-[11px] font-mono text-white backdrop-blur-md">
          {i + 1} / {n}
        </div>

        {/* Controls Overlay */}
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          {n > 1 && (
            <button
              className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
              onClick={() => setPlaying(!playing)}
              aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            >
              {playing && !isHovered ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
          <button
            className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
            onClick={() => dlg.current?.showModal()}
            aria-label="View fullscreen photo"
          >
            <Expand size={14} />
          </button>
        </div>

        {/* Prev / Next Arrows */}
        {n > 1 && (
          <>
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 hover:scale-105"
              onClick={() => go(-1)}
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 hover:scale-105"
              onClick={() => go(1)}
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {n > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Choose photo">
          {media.map((x, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === i}
              aria-label={`Photo ${idx + 1}`}
              onClick={() => setI(idx)}
              className={cn(
                "h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                idx === i
                  ? "border-brand scale-105 shadow-md shadow-brand/20 opacity-100"
                  : "border-transparent opacity-60 hover:opacity-90"
              )}
            >
              <img
                src={x.type === "video" ? x.poster || "" : x.url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Dialog Lightbox */}
      <dialog
        ref={dlg}
        className="m-auto max-h-[94vh] w-[min(1200px,96vw)] rounded-3xl bg-slate-950 p-0 text-white backdrop:bg-black/85 shadow-2xl overflow-hidden"
        onKeyDown={key}
        onClick={(e) => e.target === dlg.current && dlg.current?.close()}
      >
        <div className="relative overflow-hidden">
          {/* Progress bar inside fullscreen dialog */}
          {n > 1 && playing && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30 overflow-hidden">
              <motion.div
                key={i}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "linear" }}
                className="h-full bg-brand"
              />
            </div>
          )}

          {/* Top Controls: Play/Pause + Photo Index + Close */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-bold text-white">
                {i + 1} / {n}
              </span>
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white hover:bg-black transition"
                aria-label={playing ? "Pause auto-slide" : "Start auto-slide"}
              >
                {playing ? <Pause size={13} className="text-emerald-400" /> : <Play size={13} className="text-amber-400" />}
                <span className="hidden sm:inline">{playing ? "Auto-Slide ON" : "Paused"}</span>
              </button>
            </div>

            <button
              className="grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white hover:bg-black backdrop-blur-md"
              onClick={() => dlg.current?.close()}
              aria-label="Close fullscreen view"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative aspect-[16/10] max-h-[85vh] w-full bg-black flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={i}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.8 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full flex items-center justify-center"
              >
                {m.type === "video" ? (
                  <video src={m.url} controls className="max-h-[85vh] w-full" />
                ) : (
                  <img src={m.url} alt={m.alt} className="max-h-[85vh] w-full object-contain" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          {n > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-black/70 text-white hover:bg-black z-20"
                onClick={() => go(-1)}
                aria-label="Previous photo"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-black/70 text-white hover:bg-black z-20"
                onClick={() => go(1)}
                aria-label="Next photo"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
