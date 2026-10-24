"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Users,
  Compass,
  ArrowRight,
  Pause,
  Play,
  CheckCircle2,
  MapPin
} from "lucide-react";
import VirtualTourModal from "./VirtualTourModal";

export const ABOUT_SLIDES = [
  {
    image: "/images/hero-building.jpg",
    title: "Revolutionising PG Living in Ahmedabad",
    subtitle: "From a single 12-bed facility in Satellite in 2021 to Gujarat's leading verified student and executive co-living network.",
    location: "Satellite Headquarters",
    stat: "500+ Beds Managed",
  },
  {
    image: "/images/room-single.jpg",
    title: "Radical Transparency & Zero Brokerage",
    subtitle: "Every room, meal plan, meter policy, and metro distance verified by the founders before admission opens.",
    location: "Executive Single Suites",
    stat: "0% Brokerage Guarantee",
  },
  {
    image: "/images/study-lounge.jpg",
    title: "Built for Academic & Professional Success",
    subtitle: "Acoustically treated quiet study lounges, dual 100 Mbps fibre connections, and nutritious chef-curated meals.",
    location: "24/7 Co-working Pods",
    stat: "99.8% Wi-Fi Uptime",
  },
  {
    image: "/images/rooftop-terrace.jpg",
    title: "A Community Where You Truly Belong",
    subtitle: "Sunset yoga sessions, weekend screenings, and lifelong friendships across CEPT, Nirma, GU, and tech corridors.",
    location: "Sunset Terrace Deck",
    stat: "4.8★ Resident Rating",
  },
];

export default function AboutInteractiveHero() {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = ABOUT_SLIDES.length;

  useEffect(() => {
    if (paused || reduce) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, 5500);
    return () => clearInterval(timer);
  }, [paused, reduce, count]);

  const currentObj = ABOUT_SLIDES[current];

  return (
    <div className="relative isolate overflow-hidden min-h-[75svh] flex flex-col justify-end pb-12 pt-24 sm:pt-32">
      {/* =========================================================================
          BACKGROUND SLIDESHOW - BRIGHT, SUNNY, NATURAL (NO HEAVY DARK CAVE)
          ========================================================================= */}
      <div className="absolute inset-0 -z-20 overflow-hidden bg-bg">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full"
          >
            <img loading="lazy" decoding="async"
              src={currentObj.image}
              alt={currentObj.title}
              className="h-full w-full object-cover brightness-100 contrast-[1.02] saturate-[1.08]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Dynamic Glow Orbs (Soft) */}
        <div className="absolute -left-[10%] top-[-10%] h-[45vmax] w-[45vmax] animate-drift rounded-full bg-brand/15 blur-[130px] pointer-events-none" />
        <div className="absolute -right-[10%] top-[10%] h-[35vmax] w-[35vmax] animate-drift rounded-full bg-accent/15 blur-[130px] [animation-delay:-6s] pointer-events-none" />

        {/* Soft, Balanced Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent hidden sm:block" />

        {/* Bottom subtle transition into the page body */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-bg via-bg/30 to-transparent pointer-events-none" />
      </div>

      {/* =========================================================================
          CONTENT SECTION WITH FROSTED SHOWCASE
          ========================================================================= */}
      <div className="container-x relative z-10 flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl rounded-3xl bg-black/40 dark:bg-black/55 p-6 sm:p-9 backdrop-blur-xl border border-white/20 shadow-2xl space-y-4"
        >
          {/* Eyebrow Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/50 bg-brand/35 px-3.5 py-1 text-xs font-bold text-white shadow-md shadow-brand/20">
              <Sparkles size={14} className="text-accent" /> The Luxora Story & Mission
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/90">
              <ShieldCheck size={14} className="text-emerald-400" /> Setting The Standard Since 2021
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/25 px-3 py-1 text-xs font-extrabold text-accent">
              {currentObj.stat}
            </span>
          </div>

          {/* Main Animated Headline */}
          <motion.h1
            key={current}
            initial={reduce ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md"
          >
            {currentObj.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            key={`sub-${current}`}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl text-sm sm:text-base text-white/90 font-medium leading-relaxed drop-shadow"
          >
            {currentObj.subtitle}
          </motion.p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/pgs" className="btn btn-primary text-xs gap-2 shadow-xl shadow-brand/35">
              Browse All Residences <ArrowRight size={14} />
            </Link>
            <VirtualTourModal />
            <Link
              href="/contact"
              className="btn btn-ghost text-xs border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              Schedule a Guided Visit
            </Link>
          </div>
        </motion.div>

        {/* Interactive Slide Indicators Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/20 bg-black/45 p-3 backdrop-blur-xl shadow-xl text-xs">
          <div className="flex items-center gap-2 text-white/85">
            <MapPin size={14} className="text-accent" />
            <span className="font-semibold">{currentObj.location}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/70">Space {current + 1} of {count}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {ABOUT_SLIDES.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === current
                      ? "w-7 bg-brand shadow-md shadow-brand/50 ring-1 ring-white/30"
                      : "w-2.5 bg-white/25 hover:bg-white/50"
                  }`}
                  aria-label={`Slide ${idx + 1}: ${slide.title}`}
                  title={slide.title}
                />
              ))}
            </div>

            <button
              onClick={() => setPaused(!paused)}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/20 transition backdrop-blur-md ml-2"
            >
              {paused ? <Play size={11} className="fill-white" /> : <Pause size={11} className="fill-white" />}
              <span>{paused ? "Resume" : "Pause"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
