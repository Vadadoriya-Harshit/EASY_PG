"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Flame,
  Star,
  Compass,
  Pause,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  intro?: string;
  badge?: string;
  image?: string;
  slides?: string[];
  children?: React.ReactNode;
}

// Contextual photography collections matching each page topic
const PHOTO_PRESETS = {
  rooms: [
    { src: "/images/room-single.jpg", caption: "Single Luxury Suite with AC", tag: "Private Room" },
    { src: "/images/room-double.jpg", caption: "Twin Sharing Room with Study Pods", tag: "Twin Sharing" },
    { src: "/images/hero-building.jpg", caption: "Luxora Flagship Campus Exterior", tag: "Residence Hub" },
  ],
  areas: [
    { src: "/images/hero-building.jpg", caption: "Prime Ahmedabad Campus", tag: "Ahmedabad" },
    { src: "/images/rooftop-terrace.jpg", caption: "Rooftop Sunset City Vista", tag: "Skyline" },
    { src: "/images/study-lounge.jpg", caption: "Coliving Common Workspace", tag: "Study Pods" },
  ],
  facilities: [
    { src: "/images/dining-hall.jpg", caption: "Hygienic Dining Cafeteria", tag: "3 Meals Daily" },
    { src: "/images/study-lounge.jpg", caption: "High-Speed Co-working Lounge", tag: "100 Mbps Wi-Fi" },
    { src: "/images/bathroom.jpg", caption: "Attached Modern Ceramic Washroom", tag: "Clean & Sanitized" },
  ],
  gallery: [
    { src: "/images/rooftop-terrace.jpg", caption: "Sunset Sky Lounge & Deck", tag: "Rooftop" },
    { src: "/images/room-single.jpg", caption: "Fully Furnished Bed Space", tag: "Interiors" },
    { src: "/images/dining-hall.jpg", caption: "Cafeteria & Community Dining", tag: "Dining Hall" },
  ],
  transit: [
    { src: "/images/hero-building.jpg", caption: "Connected Transit Hub", tag: "Metro Proximity" },
    { src: "/images/rooftop-terrace.jpg", caption: "Ahmedabad Metro Line Route", tag: "Walking Distance" },
    { src: "/images/study-lounge.jpg", caption: "Cafes & Libraries Hub", tag: "Essentials" },
  ],
  contact: [
    { src: "/images/hero-building.jpg", caption: "Luxora Reception & Help Desk", tag: "Helpdesk" },
    { src: "/images/study-lounge.jpg", caption: "Resident Support Lounge", tag: "Fast WhatsApp" },
    { src: "/images/room-double.jpg", caption: "Guided Property Tours", tag: "Free Visit" },
  ],
  default: [
    { src: "/images/hero-building.jpg", caption: "Luxora PG Living Ahmedabad", tag: "Coliving" },
    { src: "/images/room-single.jpg", caption: "Executive Bedrooms", tag: "Rooms" },
    { src: "/images/rooftop-terrace.jpg", caption: "Rooftop Community Deck", tag: "Aesthetic" },
  ],
};

function getContextualPreset(title: string, customImage?: string, customSlides?: string[]) {
  if (customSlides && customSlides.length > 0) {
    return {
      slides: customSlides.map((s, i) => ({ src: s, caption: `View ${i + 1}`, tag: `Photo ${i + 1}` })),
      badge: "Verified Ahmedabad Residence",
      highlights: ["0% Brokerage", "Daily Housekeeping", "High-Speed Wi-Fi"],
    };
  }

  if (customImage) {
    return {
      slides: [{ src: customImage, caption: "Featured Residence", tag: "Verified Space" }],
      badge: "Verified Listing",
      highlights: ["Zero Brokerage", "Owner Verified", "Clean Facilities"],
    };
  }

  const t = title.toLowerCase();

  if (t.includes("find") || t.includes("pg") || t.includes("boy") || t.includes("girl") || t.includes("room")) {
    return {
      slides: PHOTO_PRESETS.rooms,
      badge: "Verified Student & Professional Living",
      highlights: ["Zero Brokerage", "Furnished with AC", "Daily Housekeeping"],
    };
  }

  if (t.includes("area") || t.includes("satellite") || t.includes("navrangpura") || t.includes("vastrapur") || t.includes("thaltej")) {
    return {
      slides: PHOTO_PRESETS.areas,
      badge: "Prime Ahmedabad Localities",
      highlights: ["Metro Connected", "Near Colleges & Tech Hubs", "24/7 CCTV & Security"],
    };
  }

  if (t.includes("facilit") || t.includes("amenit") || t.includes("food")) {
    return {
      slides: PHOTO_PRESETS.facilities,
      badge: "Hygienic Living Standards",
      highlights: ["3 Fresh Gujarati/North Meals", "100 Mbps Wi-Fi", "Biometric Access"],
    };
  }

  if (t.includes("gallery") || t.includes("space") || t.includes("photo") || t.includes("explore")) {
    return {
      slides: PHOTO_PRESETS.gallery,
      badge: "Authentic Unedited Photographs",
      highlights: ["Real Camera Captures", "360° Visualizer", "Verified Standards"],
    };
  }

  if (t.includes("metro") || t.includes("nashta") || t.includes("near")) {
    return {
      slides: PHOTO_PRESETS.transit,
      badge: "Transit & Food Explorer",
      highlights: ["Walking to Metro", "Verified Breakfast Spots", "Safe Late-Night Return"],
    };
  }

  if (t.includes("connect") || t.includes("contact") || t.includes("visit")) {
    return {
      slides: PHOTO_PRESETS.contact,
      badge: "Direct Owner Coordination",
      highlights: ["30-Min WhatsApp Reply", "Free Walkthrough Tours", "Direct Booking"],
    };
  }

  if (t.includes("match") || t.includes("compare")) {
    return {
      slides: PHOTO_PRESETS.rooms,
      badge: "Smart Match Engine",
      highlights: ["Budget Optimised", "Side-by-Side Specs", "Zero Hidden Charges"],
    };
  }

  return {
    slides: PHOTO_PRESETS.default,
    badge: "Luxora Living Ecosystem",
    highlights: ["100% Owner Verified", "Biometric Security", "Flexible Stay Terms"],
  };
}

export default function PageHeader({
  title,
  intro,
  badge: customBadge,
  image: customImage,
  slides: customSlides,
  children,
}: PageHeaderProps) {
  const { slides, badge, highlights } = getContextualPreset(title, customImage, customSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto crossfade background slides every 5.2 seconds
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5200);
    return () => clearInterval(interval);
  }, [slides.length, paused]);

  return (
    <header className="relative isolate overflow-hidden border-b border-ink/10 bg-bg text-white min-h-[360px] sm:min-h-[420px] flex items-center">
      {/* =========================================================================
          BACKGROUND IMAGES - NATURAL BRIGHT DAYLIGHT, VIVID & CLEAN
          ========================================================================= */}
      <div className="absolute inset-0 -z-20 overflow-hidden" aria-hidden="true">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.src}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
            >
              <Image
                src={slide.src}
                alt={slide.caption}
                fill
                priority={index === 0}
                sizes="100vw"
                className={cn(
                  "object-cover object-center brightness-100 contrast-[1.02] saturate-[1.08] transition-transform duration-[6000ms] ease-out",
                  isActive ? "scale-105" : "scale-100"
                )}
              />
            </div>
          );
        })}

        {/* Soft, Balanced Scrim - leaves photo bright and natural */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/40 via-transparent to-transparent hidden sm:block" />

        {/* Dynamic Theme Glow Spheres (Soft & ambient) */}
        <div
          className="absolute -right-20 -top-32 z-10 h-80 w-80 rounded-full bg-brand/20 blur-[120px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -left-20 bottom-0 z-10 h-64 w-64 rounded-full bg-accent/15 blur-[100px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Bottom subtle transition into the page body */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-bg via-bg/30 to-transparent z-10 pointer-events-none" />
      </div>

      {/* =========================================================================
          CONTENT SECTION WITH FROSTED SHOWCASE CONTAINER
          ========================================================================= */}
      <div className="container-x relative z-20 py-10 sm:py-16 w-full">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          {/* Left Main Titles inside Frosted Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-8 rounded-3xl bg-black/40 dark:bg-black/55 p-6 sm:p-8 backdrop-blur-xl border border-white/20 shadow-2xl"
          >
            {/* Pulsing Pill Badge */}
            <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-brand/50 bg-brand/35 px-3.5 py-1 text-xs font-bold text-white shadow-md shadow-brand/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span>{customBadge || badge}</span>
            </div>

            {/* Main Page Title */}
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl max-w-3xl leading-[1.12] drop-shadow-md">
              {title}
            </h1>

            {/* Intro Description */}
            {intro && (
              <p className="mt-3.5 max-w-2xl text-sm sm:text-base leading-relaxed text-white/90 font-medium drop-shadow">
                {intro}
              </p>
            )}

            {/* Children elements (e.g. search bars, tabs, or action CTAs) */}
            {children && <div className="mt-5">{children}</div>}
          </motion.div>

          {/* Right Highlights & Interactive Slide Controller */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="lg:col-span-4 flex flex-col gap-3 justify-end items-start lg:items-end"
          >
            {/* Quick Feature Pills */}
            <div className="flex flex-wrap lg:flex-col gap-2 w-full max-w-xs">
              {highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-xs font-semibold text-white shadow-md backdrop-blur-md hover:border-brand/50 hover:bg-black/55 transition"
                >
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Interactive Slide Selector & Thumbnail Switcher */}
            {slides.length > 1 && (
              <div className="mt-1 flex items-center gap-2 rounded-2xl bg-black/45 px-3 py-1.5 border border-white/20 text-xs font-medium text-white/85 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-1.5">
                  {slides.map((s, idx) => (
                    <button
                      key={s.src}
                      onClick={() => setCurrentSlide(idx)}
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-[10px] font-bold transition",
                        idx === currentSlide
                          ? "bg-brand text-white shadow-sm ring-1 ring-white/30"
                          : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                      )}
                    >
                      {s.tag || `0${idx + 1}`}
                    </button>
                  ))}
                </div>

                <div className="h-3 w-px bg-white/20" />

                <button
                  onClick={() => setPaused((p) => !p)}
                  className="text-white/70 hover:text-white p-0.5 transition"
                  title={paused ? "Play" : "Pause"}
                  aria-label={paused ? "Play background slides" : "Pause background slides"}
                >
                  {paused ? <Play size={11} className="fill-white" /> : <Pause size={11} className="fill-white" />}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </header>
  );
}
