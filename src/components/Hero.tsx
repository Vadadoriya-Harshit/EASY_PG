"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_CMS_DATA } from "@/lib/cms-store";
import VirtualTourModal from "./VirtualTourModal";

export default function Hero({ children, initialHero }: { children: React.ReactNode; initialHero?: typeof DEFAULT_CMS_DATA.hero }) {
  const reduce = useReducedMotion();
  const [heroData, setHeroData] = useState(initialHero || DEFAULT_CMS_DATA.hero);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  // Sync with CMS content from server / localStorage / database
  useEffect(() => {
    const syncData = () => {
      try {
        const local = localStorage.getItem("luxora_cms_content") || localStorage.getItem("sorath_cms_content");
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.hero) setHeroData(parsed.hero);
        }
      } catch { }

      // Fetch live from public site-settings endpoint (No admin auth required)
      fetch("/api/site-settings")
        .then((r) => r.json())
        .then((res) => {
          if (res.ok && res.data?.hero) {
            setHeroData(res.data.hero);
          }
        })
        .catch(() => {});
    };

    syncData();
    window.addEventListener("luxora_cms_updated", syncData);
    window.addEventListener("sorath_cms_updated", syncData);
    return () => {
      window.removeEventListener("luxora_cms_updated", syncData);
      window.removeEventListener("sorath_cms_updated", syncData);
    };
  }, []);



  const slides = heroData.slides && heroData.slides.length > 0 ? heroData.slides : DEFAULT_CMS_DATA.hero.slides;
  const slideCount = slides.length;

  // Auto-rotate background slides every 5.5 seconds
  useEffect(() => {
    if (paused || reduce || slideCount <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5500);
    return () => clearInterval(interval);
  }, [paused, reduce, slideCount]);

  const currentObj = slides[currentSlide % slideCount] || slides[0];
  const lines = [heroData.line1, heroData.line2, heroData.line3];

  return (
    <section
      className={`relative isolate overflow-hidden py-8 sm:py-12 lg:py-14 min-h-[560px] lg:min-h-[620px] flex flex-col justify-center ${paused ? "hero-paused" : ""
        }`}
      aria-label="Welcome to Luxora PG"
    >
      {/* =========================================================================
          BACKGROUND SLIDESHOW - DYNAMICALLY MANAGED FROM ADMIN CMS
          ========================================================================= */}
      <div className="absolute inset-0 -z-20 overflow-hidden bg-bg">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full"
          >
            <img
              src={currentObj.image}
              alt={currentObj.label}
              className="h-full w-full object-cover brightness-100 contrast-[1.02] saturate-[1.08]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Ambient Glow Accents */}
        <div className="absolute -left-[10%] top-[-10%] h-[40vmax] w-[40vmax] animate-drift rounded-full bg-brand/15 blur-[140px] pointer-events-none" />
        <div className="absolute -right-[15%] top-[10%] h-[30vmax] w-[30vmax] animate-drift rounded-full bg-accent/15 blur-[140px] [animation-delay:-7s] pointer-events-none" />

        {/* Light Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent hidden sm:block" />

        {/* Bottom subtle transition into the page body */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-bg via-bg/25 to-transparent pointer-events-none" />
      </div>

      {/* =========================================================================
          HERO MAIN CONTENT - COMPACT, BALANCED & DYNAMICALLY MANAGED
          ========================================================================= */}
      <div className="container-x relative z-10 w-full space-y-4 sm:space-y-5">
        {/* Top Floating Showcase Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl rounded-2xl sm:rounded-3xl bg-black/40 dark:bg-black/55 p-5 sm:p-7 backdrop-blur-xl border border-white/20 shadow-2xl space-y-3.5"
        >
          {/* Top Eyebrow Badges & Location Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-950/85 border border-amber-400/50 shadow-md backdrop-blur-md">
                <span className="relative w-4 h-4 shrink-0 block">
                  <img src="/images/luxora-emblem-dark.png" alt="Luxora Emblem" className="w-full h-full object-contain" />
                </span>
                <span className="font-serif font-black text-[11px] tracking-wider text-amber-300">LUXORA PG</span>
                <span className="text-amber-400/40">·</span>
                <span className="text-[10px] text-amber-200/90 font-bold uppercase tracking-wider">It&apos;s Your Home</span>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/50 bg-brand/35 px-3 py-0.5 text-[11px] sm:text-xs font-bold text-white shadow-sm">
                <Sparkles size={13} className="text-accent" /> {heroData.badge1}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-[11px] sm:text-xs font-semibold text-white/90">
                <ShieldCheck size={13} className="text-emerald-400" /> {heroData.badge2}
              </span>
            </div>

            {/* Quick Slide Tag Pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-black/40 border border-white/15 px-2.5 py-0.5 text-[11px] text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span>{currentObj.tag}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/60 font-mono text-[10px]">
                {(currentSlide % slideCount) + 1}/{slideCount}
              </span>
            </div>
          </div>

          {/* Compact Main Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-black leading-[1.08] tracking-tight text-white drop-shadow-md">
            {lines.map((l, i) => (
              <span key={i} className="inline-block sm:block mr-2 sm:mr-0">
                <motion.span
                  className={cn(
                    "inline-block",
                    i === 1
                      ? "bg-gradient-to-r from-white via-cyan-200 to-accent bg-clip-text text-transparent"
                      : ""
                  )}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.08 + i * 0.08 }}
                >
                  {l}{" "}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            className="max-w-2xl text-xs sm:text-sm font-normal leading-relaxed text-white/90 drop-shadow"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            {heroData.subtitle}
          </motion.p>

          {/* Action CTAs & Virtual Tour */}
          <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
            <Link href="/pgs/boys" className="btn btn-primary text-xs py-2 px-4 shadow-md shadow-brand/35 whitespace-nowrap shrink-0">
              Explore Boys PGs
            </Link>
            <Link href="/pgs/girls" className="btn btn-accent text-xs py-2 px-4 shadow-md shadow-accent/35 whitespace-nowrap shrink-0">
              Explore Girls PGs
            </Link>

            <VirtualTourModal />
          </div>
        </motion.div>

        {/* Search Bar / Filter Slot */}
        <div className="max-w-4xl">{children}</div>

        {/* Slim Interactive Photo Selector (Bottom Strip) */}
        <div className="max-w-4xl flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 text-white/80 truncate">
            <MapPin size={14} className="text-accent shrink-0" />
            <span className="font-semibold truncate">{currentObj.label}</span>
            <span className="text-white/40 hidden sm:inline">·</span>
            <span className="text-white/60 text-[11px] hidden sm:inline">{currentObj.location}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-bold transition",
                  idx === currentSlide % slideCount
                    ? "bg-brand text-white shadow-sm ring-1 ring-white/30"
                    : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                )}
                aria-label={`Slide ${idx + 1}: ${slide.tag}`}
              >
                {slide.tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
