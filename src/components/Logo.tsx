"use client";
import React, { useState, useRef, MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";

interface LogoProps {
  className?: string;
  compact?: boolean;
  showTagline?: boolean;
  variant?: "horizontal" | "stacked" | "full-artwork";
}

export default function Logo({
  className = "",
  compact = false,
  showTagline = true,
  variant = "horizontal",
}: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Magnetic Interactive Tilt Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const currentX = (e.clientX - rect.left) / width - 0.5;
    const currentY = (e.clientY - rect.top) / height - 0.5;
    mouseX.set(currentX);
    mouseY.set(currentY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  // =========================================================================
  // 1. FULL ARTWORK / STACKED: 100% AUTHENTIC TO REFERENCE IMAGE WITH 3D TILT
  // =========================================================================
  if (variant === "stacked" || variant === "full-artwork") {
    return (
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative inline-flex flex-col items-center justify-center select-none cursor-pointer text-center p-3 rounded-2xl ${className}`}
      >
        {/* Soft Golden Ambient Aura on Hover */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-b from-amber-500/30 via-yellow-400/20 to-transparent blur-2xl transition-opacity duration-500 pointer-events-none ${
            isHovered ? "opacity-100 scale-110" : "opacity-0"
          }`}
        />

        {/* Shimmer Sheen Sweep */}
        <motion.div
          initial={false}
          animate={isHovered ? { x: ["-150%", "200%"] } : { x: "-150%" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none z-20"
        />

        {/* Full Authentic Artwork Direct Render */}
        <div className="relative w-48 sm:w-56 h-auto aspect-[851/456]">
          {/* Light Mode */}
          <Image
            src="/images/luxora-logo-clean.png"
            alt="Luxora PG Logo"
            fill
            sizes="256px"
            className="block dark:hidden object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            priority
          />
          {/* Dark Mode */}
          <Image
            src="/images/luxora-logo-clean-dark.png"
            alt="Luxora PG Logo"
            fill
            sizes="256px"
            className="hidden dark:block object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            priority
          />

          {/* Interactive Window Glow Overlay (Lights Up Warmly on Hover) */}
          <div
            className={`absolute top-[34%] left-[53.2%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 grid grid-cols-2 gap-0.5 pointer-events-none transition-all duration-300 ${
              isHovered ? "opacity-100 scale-125" : "opacity-0"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-[0.5px] bg-yellow-300 shadow-[0_0_12px_#FDE047] animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-[0.5px] bg-yellow-300 shadow-[0_0_12px_#FDE047] animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-[0.5px] bg-amber-400 shadow-[0_0_12px_#F59E0B] animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-[0.5px] bg-amber-400 shadow-[0_0_12px_#F59E0B] animate-pulse" />
          </div>

          {/* Roof Pinnacle Glint Sparkle */}
          <span
            className={`absolute top-[20%] left-[53.4%] -translate-x-1/2 -translate-y-1/2 text-yellow-300 text-xs pointer-events-none transition-all duration-300 ${
              isHovered ? "opacity-100 scale-150 animate-bounce" : "opacity-0"
            }`}
          >
            ✦
          </span>
        </div>
      </motion.div>
    );
  }

  // =========================================================================
  // 2. HORIZONTAL LOCKUP: FREE-STANDING CREST + 3D TILT + LUXURY WORDMARK
  // =========================================================================
  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.035, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative inline-flex items-center gap-2.5 sm:gap-4 select-none cursor-pointer py-1 shrink-0 ${className}`}
    >
      {/* 1. Continuous Living Ambient Aura Bloom */}
      <motion.div
        animate={{
          scale: isHovered ? [1.1, 1.25, 1.1] : [1, 1.12, 1],
          opacity: isHovered ? [0.6, 0.9, 0.6] : [0.25, 0.45, 0.25],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-amber-500/30 via-brand/25 to-yellow-400/20 blur-xl pointer-events-none"
      />

      {/* 2. Architectural 3D Squircle Crest Badge */}
      <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center shrink-0 rounded-2xl border border-amber-500/35 dark:border-amber-400/40 bg-gradient-to-br from-surface via-surface/95 to-amber-500/10 shadow-lg shadow-black/5 dark:shadow-[0_8px_25px_rgba(0,0,0,0.5)] ring-1 ring-amber-500/20 dark:ring-amber-400/25 overflow-hidden transition-all duration-300 group-hover:border-amber-500 group-hover:ring-amber-400/50 group-hover:shadow-[0_0_28px_rgba(245,158,11,0.35)]">
        {/* Specular Curved Top Glass Gloss */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 dark:from-white/15 to-transparent pointer-events-none rounded-t-2xl z-10" />

        {/* Continuous Metallic Shimmer Beam Sweep */}
        <motion.div
          animate={{ x: ["-200%", "250%"] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
          className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-amber-200/40 dark:via-amber-300/25 to-transparent skew-x-12 pointer-events-none z-20"
        />

        {/* Four Architectural Corner Accent Brackets */}
        <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-[1px] bg-amber-500/50 dark:bg-amber-400/60 pointer-events-none" />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-[1px] bg-amber-500/50 dark:bg-amber-400/60 pointer-events-none" />
        <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-[1px] bg-amber-500/50 dark:bg-amber-400/60 pointer-events-none" />
        <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-[1px] bg-amber-500/50 dark:bg-amber-400/60 pointer-events-none" />

        {/* Authentic Monogram Emblem with Rock-Solid Pixel Dimensions */}
        <div className="relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center">
          {/* Light Mode: Navy 'L' + Gold 'G' + Roof + Windows */}
          <Image
            src="/images/luxora-emblem.png"
            alt="Luxora PG Monogram"
            width={40}
            height={40}
            className="block dark:hidden object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-108 shrink-0"
            priority
          />

          {/* Dark Mode: Titanium White 'L' + Radiant Gold 'G' + Roof + Windows */}
          <Image
            src="/images/luxora-emblem-dark.png"
            alt="Luxora PG Monogram"
            width={40}
            height={40}
            className="hidden dark:block object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-108 shrink-0"
            priority
          />

          {/* Living Warm 4-Window Illumination (Continuous Gentle Pulse + Ignite on Hover) */}
          <motion.div
            animate={{
              opacity: isHovered ? 1 : [0.55, 0.9, 0.55],
              scale: isHovered ? 1.3 : 1,
            }}
            transition={{ duration: isHovered ? 0.2 : 2.2, repeat: isHovered ? 0 : Infinity, ease: "easeInOut" }}
            className="absolute top-[49%] left-[53%] -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 grid grid-cols-2 gap-0.5 pointer-events-none z-10"
          >
            <span className="w-1.5 h-1.5 rounded-[0.4px] bg-yellow-300 shadow-[0_0_12px_#FDE047]" />
            <span className="w-1.5 h-1.5 rounded-[0.4px] bg-yellow-300 shadow-[0_0_12px_#FDE047]" />
            <span className="w-1.5 h-1.5 rounded-[0.4px] bg-amber-400 shadow-[0_0_12px_#F59E0B]" />
            <span className="w-1.5 h-1.5 rounded-[0.4px] bg-amber-400 shadow-[0_0_12px_#F59E0B]" />
          </motion.div>

          {/* Roof Pinnacle Apex Star Glint (✦ Continuous Twinkle) */}
          <motion.span
            animate={{
              scale: isHovered ? [1.2, 1.6, 1.2] : [0.95, 1.3, 0.95],
              rotate: isHovered ? [0, 90, 180] : [0, 45, 0],
              opacity: isHovered ? 1 : [0.7, 1, 0.7],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[23%] left-[53.5%] -translate-x-1/2 -translate-y-1/2 text-yellow-300 text-xs pointer-events-none z-10 drop-shadow-[0_0_8px_#FDE047]"
          >
            ✦
          </motion.span>
        </div>

        {/* Floating Micro Gold Glint Particle on Hover */}
        {isHovered && (
          <motion.span
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], y: -20, x: 10, scale: 1.3 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            className="absolute -top-1 right-1 text-amber-400 text-xs pointer-events-none z-20"
          >
            ✨
          </motion.span>
        )}
      </div>

      {/* 3. Grand & Commanding Typographic Wordmark Lockup */}
      <div className="flex flex-col justify-center leading-none shrink-0">
        {/* Row 1: LUXORA (Grand Display) + Gold PG + Verified Luxury Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <span className="font-serif text-[20px] sm:text-[26px] lg:text-[28px] font-black tracking-[0.14em] sm:tracking-[0.18em] text-ink flex items-center transition-all duration-300">
            {/* 'L' with illuminated architectural pedestal underline */}
            <span className="relative inline-block">
              L
              <span className="absolute -bottom-0.5 left-0 w-full h-[2.5px] sm:h-[3px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-300 group-hover:w-[115%]" />
            </span>
            <span className="transition-colors duration-300 group-hover:text-amber-500">
              UXOR
            </span>
            {/* Signature Chevron Apex 'A' */}
            <span className="relative inline-block transition-colors duration-300 group-hover:text-amber-500">
              A
            </span>
          </span>

          {/* 24K Gold Foil Gradient 'PG' */}
          <span className="font-serif text-[20px] sm:text-[26px] lg:text-[28px] font-black tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 dark:from-amber-300 dark:via-yellow-300 dark:to-amber-500 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-transform duration-300 group-hover:scale-108">
            PG
          </span>

          {/* Micro Admissions Live Badge on Desktop */}
          {!compact && showTagline && (
            <span
              className={`hidden md:inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-emerald-500/15 to-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-sm transition-all duration-300 ${
                isHovered ? "opacity-100 scale-105" : "opacity-0 scale-95"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Admissions Open
            </span>
          )}
        </div>

        {/* Row 2: "FEEL AT HOME • LIVE IN LUXURY" with Dynamic Glowing Micro-Ribbon */}
        {showTagline && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="relative inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-600/10 dark:from-amber-400/15 dark:via-yellow-300/10 dark:to-amber-500/15 border border-amber-500/25 dark:border-amber-400/35 backdrop-blur-sm shadow-[0_1px_5px_rgba(245,158,11,0.12)] group-hover:border-amber-400/70 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all duration-300 overflow-hidden">
              {/* Dynamic Living Sparkle */}
              <motion.span
                animate={{ rotate: [0, 180, 360], scale: [0.9, 1.25, 0.9] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="text-[8px] text-amber-500 dark:text-yellow-300 leading-none shrink-0"
              >
                ✦
              </motion.span>

              {/* Part 1: Feel At Home */}
              <span className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-[0.14em] text-ink/90 dark:text-amber-100 whitespace-nowrap transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-200">
                FEEL AT HOME
              </span>

              {/* Glowing Jewel Divider */}
              <span className="h-1 w-1 rounded-full bg-amber-500 dark:bg-yellow-400 shadow-[0_0_6px_#F59E0B] shrink-0 animate-pulse" />

              {/* Part 2: Live In Luxury with 24k Gold Foil Sheen */}
              <span className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-[0.14em] bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 dark:from-yellow-300 dark:via-amber-300 dark:to-yellow-400 bg-clip-text text-transparent whitespace-nowrap group-hover:brightness-115">
                LIVE IN LUXURY
              </span>

              {/* Shimmer light beam on hover */}
              <div className="absolute inset-0 pointer-events-none">
                <span className="absolute -inset-full w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-[400%] transition-all duration-1000 ease-out" />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
