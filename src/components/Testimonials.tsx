"use client";
import { useState, useEffect, useRef } from "react";
import { Star, ShieldCheck, Quote, ChevronLeft, ChevronRight, Pause, Play, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TestimonialItem } from "@/lib/cms-defaults";

interface TestimonialsProps {
  items?: TestimonialItem[];
}

export default function Testimonials({ items }: TestimonialsProps) {
  const reviews = items && items.length > 0 ? items : [];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const n = reviews.length;

  const next = () => setCurrent((c) => (c + 1) % (n || 1));
  const prev = () => setCurrent((c) => (c - 1 + (n || 1)) % (n || 1));

  useEffect(() => {
    if (paused || n <= 1) return;
    timer.current = setInterval(next, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, current, n]);

  if (n === 0) return null;

  const rev = reviews[current] || reviews[0];
  const avatarText = rev.avatarText || rev.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "LU";
  const accentColor = rev.accentColor || "from-brand to-accent";

  return (
    <section
      className="section pt-0"
      aria-labelledby="testimonials-heading"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container-x">
        {/* Section Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Real Experiences & Verified Stays
            </span>
            <h2 id="testimonials-heading" className="mt-1 text-3xl font-bold sm:text-5xl text-ink">
              Resident Voices & Experiences
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-ok/15 px-3.5 py-1.5 text-xs font-bold text-ok border border-ok/25">
              <ShieldCheck size={15} /> 100% Genuine Resident Feedback
            </span>

            {/* Slider Controls */}
            {n > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaused(!paused)}
                  className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink hover:text-brand"
                  aria-label={paused ? "Resume auto-slideshow" : "Pause auto-slideshow"}
                >
                  {paused ? <Play size={14} /> : <Pause size={14} />}
                </button>
                <button
                  onClick={prev}
                  className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink hover:text-brand"
                  aria-label="Previous review"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={next}
                  className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink hover:text-brand"
                  aria-label="Next review"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Featured Auto-Slider Card */}
        <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-gradient-to-br from-surface via-surface/90 to-brand/5 p-6 sm:p-12 shadow-xl">
          {/* Progress Timer Line */}
          {!paused && n > 1 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-ink/10 overflow-hidden">
              <motion.div
                key={current}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-full bg-brand"
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="grid gap-8 lg:grid-cols-12 items-center"
            >
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} size={18} className="fill-amber-400" />
                    ))}
                  </div>
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                    {(rev.rating || 5).toFixed(1)} / 5 Verified Review
                  </span>
                </div>

                <blockquote className="text-base sm:text-2xl font-medium leading-relaxed text-ink italic">
                  "{rev.text}"
                </blockquote>

                <div className="flex items-center gap-4 pt-2">
                  {rev.avatarUrl ? (
                    <img
                      src={rev.avatarUrl}
                      alt={rev.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-brand/30 shadow-md shrink-0"
                    />
                  ) : (
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr ${accentColor} text-white font-bold text-sm shadow-md`}>
                      {avatarText}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-base text-ink">{rev.name}</h4>
                    {rev.role && <p className="text-xs text-mute">{rev.role}</p>}
                    <p className="text-[11px] font-semibold text-brand mt-0.5">
                      {rev.property} {rev.verifiedStay ? `· ${rev.verifiedStay}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-ink/10 pt-6 lg:pt-0 lg:pl-8 space-y-3">
                <Quote size={40} className="text-brand/20 hidden lg:block" />
                <div className="rounded-2xl border border-ink/10 bg-bg/60 p-4 text-xs space-y-2">
                  <p className="font-bold text-ink flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-ok" /> The Verification Guarantee
                  </p>
                  <p className="text-mute leading-relaxed">
                    Collected directly from residents with confirmed lease agreements. Zero incentivized or fake testimonials.
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          {n > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {reviews.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === current ? "w-8 bg-brand" : "w-2.5 bg-ink/20 hover:bg-ink/40"
                  }`}
                  aria-label={`Go to resident testimonial ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
