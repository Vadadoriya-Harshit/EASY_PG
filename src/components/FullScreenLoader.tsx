"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  message?: string;
  subtext?: string;
  onClose?: () => void;
}

// Luxury & Royal Color Spectrum Ribbons (Warm 24K Gold, Amber, Champagne, Royal Indigo, Emerald, White Glint)
const LUXURY_SPECTRUM_COLORS = [
  "#F59E0B", // Luxury Gold
  "#FBBF24", // Luminous Amber
  "#FDE047", // Radiant Champagne
  "#D97706", // Deep Rich Gold
  "#8B5CF6", // Royal Violet
  "#6366F1", // Midnight Indigo
  "#10B981", // Emerald Safe
  "#FCD34D", // Warm Light Gold
  "#FFFFFF", // Pure White Spark
  "#B45309", // Warm Bronze
];

// 32 Optimized Light Ribbons for Ultra-Smooth 60FPS Performance
const LIGHT_RIBBONS = Array.from({ length: 32 }).map((_, i) => {
  const angle = (i - 15.5) * 4.8;
  return {
    id: i,
    color: LUXURY_SPECTRUM_COLORS[i % LUXURY_SPECTRUM_COLORS.length],
    width: i % 4 === 0 ? 3 : i % 2 === 0 ? 1.8 : 2.4,
    height: 65 + ((i * 11) % 40),
    delay: 0.12 + Math.abs(i - 16) * 0.02,
    xOffset: (i - 15.5) * 12,
    tilt: angle * 0.12,
  };
});

export default function FullScreenLoader({
  message = "Entering Luxora PG...",
  subtext,
  onClose,
}: Props) {
  const [stage, setStage] = useState<"intro" | "ribbon_burst" | "brand_reveal">("intro");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Elegant, snappy staging sequence:
    // 0ms: Initial Monogram appears with soft golden aura
    // 400ms: Light ribbons fan forward
    // 1000ms: Kinetic Typography reveal
    const t1 = setTimeout(() => setStage("ribbon_burst"), 400);
    const t2 = setTimeout(() => setStage("brand_reveal"), 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (onClose) onClose();
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[250] flex flex-col items-center justify-center select-none overflow-hidden bg-[#0A0E1A] text-white"
      >
        {/* =========================================================================
            1. REFINED LUXURY AMBIENCE (Warm Gold & Midnight Obsidian Vignette)
            ========================================================================= */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.18)_0%,rgba(16,24,45,0.85)_55%,#080C16_100%)] pointer-events-none" />

        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-brand/15 blur-[120px] pointer-events-none" />

        {/* Central Luminous Horizon Beam */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[60px] bg-gradient-to-r from-transparent via-amber-500/15 to-transparent blur-2xl pointer-events-none" />

        {/* =========================================================================
            2. LIGHTWEIGHT 3D RIBBON SPECTRUM CHAMBER
            ========================================================================= */}
        <div className="relative flex items-center justify-center w-72 h-72 sm:w-88 sm:h-88">
          {/* Dynamic Light Ribbon Streamers */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden [perspective:900px]">
            {LIGHT_RIBBONS.map((ribbon) => (
              <motion.div
                key={ribbon.id}
                initial={{
                  scaleY: 0,
                  scaleZ: 0.2,
                  opacity: 0,
                  z: -180,
                  rotateY: ribbon.tilt * 2,
                }}
                animate={
                  stage === "intro"
                    ? {
                      scaleY: [0, 0.6, 0.4],
                      opacity: [0, 0.5, 0.2],
                      z: -100,
                    }
                    : {
                      scaleY: [0.5, 2.8, 4],
                      scaleX: [1, 1.4, 2],
                      opacity: [0.3, 0.85, 0],
                      z: [0, 320, 600],
                      transition: {
                        duration: 1.1,
                        delay: ribbon.delay,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    }
                }
                style={{
                  position: "absolute",
                  width: `${ribbon.width}px`,
                  height: `${ribbon.height}%`,
                  backgroundColor: ribbon.color,
                  boxShadow: `0 0 16px ${ribbon.color}`,
                  transform: `translateX(${ribbon.xOffset}px) rotateY(${ribbon.tilt}deg)`,
                  transformOrigin: "center center",
                }}
              />
            ))}
          </div>

          {/* =========================================================================
              3. ARCHITECTURAL LUXORA 'L' CREST EMBLEM
              ========================================================================= */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={
              stage === "intro"
                ? { scale: 1, opacity: 1 }
                : stage === "ribbon_burst"
                  ? { scale: 1.08, opacity: 1 }
                  : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-20 flex items-center justify-center"
          >
            {/* Ambient Halo Behind Emblem */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-400/25 to-brand/20 blur-2xl"
            />

            {/* SVG Crest Artwork */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 filter drop-shadow-[0_12px_28px_rgba(245,158,11,0.35)]">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <defs>
                  {/* Vertical Stem Gold Gradient */}
                  <linearGradient id="lux-gold-stem" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="25%" stopColor="#FDE047" />
                    <stop offset="65%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>

                  {/* Horizontal Base Gold Gradient */}
                  <linearGradient id="lux-gold-base" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D97706" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#FDE047" />
                  </linearGradient>

                  {/* Roof Crest Gradient */}
                  <linearGradient id="lux-gold-roof" x1="0%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#FDE047" />
                    <stop offset="100%" stopColor="#FFFFFF" />
                  </linearGradient>
                </defs>

                {/* Central Soft Glow Circle */}
                <circle cx="50" cy="50" r="38" fill="url(#lux-gold-stem)" opacity="0.15" className="blur-lg" />

                {/* 1. Iconic Vertical Stem of 'L' */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  d="M 34 80 L 34 26 L 45 26 L 45 80 Z"
                  fill="url(#lux-gold-stem)"
                  className="drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                />

                {/* Bevel Shadow */}
                <path d="M 34 26 L 37.5 26 L 37.5 80 L 34 80 Z" fill="#000000" opacity="0.35" />

                {/* 2. Horizontal Pedestal of 'L' */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
                  d="M 34 69 L 70 69 L 70 80 L 34 80 Z"
                  fill="url(#lux-gold-base)"
                  className="drop-shadow-[0_0_14px_rgba(251,191,36,0.5)]"
                />

                {/* Pedestal Top Edge Highlight */}
                <path d="M 34 69 L 70 69 L 70 71 L 34 71 Z" fill="#FFFFFF" opacity="0.8" />

                {/* 3. Architectural PG Roof Apex */}
                <motion.polygon
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
                  points="32,26 50,14 68,26 64,26 50,17 36,26"
                  fill="url(#lux-gold-roof)"
                  className="drop-shadow-[0_0_10px_#FDE047]"
                />

                {/* 4. Illuminated 4-Window PG Residence Cluster */}
                <g className="animate-pulse">
                  <rect x="52" y="38" width="6.5" height="6.5" rx="1.5" fill="#FDE047" opacity="0.9" className="shadow-[0_0_8px_#FDE047]" />
                  <rect x="61" y="38" width="6.5" height="6.5" rx="1.5" fill="#FDE047" opacity="0.9" className="shadow-[0_0_8px_#FDE047]" />
                  <rect x="52" y="47" width="6.5" height="6.5" rx="1.5" fill="#F59E0B" opacity="0.9" className="shadow-[0_0_8px_#F59E0B]" />
                  <rect x="61" y="47" width="6.5" height="6.5" rx="1.5" fill="#F59E0B" opacity="0.9" className="shadow-[0_0_8px_#F59E0B]" />
                </g>

                {/* 5. Apex Crown Star Glint Flare */}
                <circle cx="50" cy="14" r="3.2" fill="#FFFFFF" className="animate-ping" />
                <circle cx="50" cy="14" r="2.2" fill="#FDE047" />
              </svg>
            </div>
          </motion.div>
        </div>

        {/* =========================================================================
            4. KINETIC REVEAL TYPOGRAPHY & MOTTO
            ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-30 flex flex-col items-center text-center mt-1 space-y-2.5"
        >
          {/* LUXORA PG Brand Wordmark */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.2em] sm:tracking-[0.26em] text-white flex items-center">
              {/* 'L' with illuminated gold pedestal */}
              <span className="relative inline-block text-amber-400">
                L
                <motion.span
                  animate={{
                    opacity: [0.7, 1, 0.7],
                    scaleX: [0.95, 1.15, 0.95],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-1 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full shadow-[0_0_12px_#FDE047]"
                />
              </span>
              <span className="bg-gradient-to-r from-white via-slate-100 to-amber-100 bg-clip-text text-transparent">
                UXOR
              </span>
              <span>A</span>
            </span>

            {/* 24K Gold Foil 'PG' */}
            <span className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(245,158,11,0.6)]">
              PG
            </span>
          </div>

          {/* Slogan Capsule Badge: FEEL AT HOME • LIVE IN LUXURY */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <span className="text-[8px] text-amber-300 animate-pulse">✦</span>
            <span className="text-[9px] sm:text-[10.5px] font-black uppercase tracking-[0.22em] text-amber-200">
              FEEL AT HOME &nbsp;•&nbsp; LIVE IN LUXURY
            </span>
            <span className="text-[8px] text-amber-300 animate-pulse">✦</span>
          </div>
        </motion.div>

        {/* =========================================================================
            5. GOLDEN SHIMMER PROGRESS LINE
            ========================================================================= */}
        <div className="w-56 sm:w-72 h-[2.5px] rounded-full bg-white/10 overflow-hidden my-5 relative">
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_10px_#FDE047]"
          />
        </div>

        {/* =========================================================================
            6. SUBTEXT HINT
            ========================================================================= */}
        <div className="h-6 flex items-center justify-center">
          <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide">
            {subtext || "Streaming verified student & executive stays in Ahmedabad..."}
          </p>
        </div>

        {/* =========================================================================
            7. SLEEK SKIP BUTTON
            ========================================================================= */}
        <button
          onClick={handleDismiss}
          className="absolute bottom-6 right-6 z-40 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 hover:border-amber-400/50 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
        >
          <span>Skip Intro</span>
          <span>⤑</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
