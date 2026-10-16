"use client";
import { useState, useEffect, useRef } from "react";
import { Star, ShieldCheck, Quote, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Review {
  name: string;
  role: string;
  property: string;
  rating: number;
  text: string;
  verifiedStay: string;
  avatarText: string;
  accentColor: string;
}

const REVIEWS: Review[] = [
  {
    name: "Aakash Patel",
    role: "Senior Full-Stack Engineer, SG Highway IT Park",
    property: "Luxora Boys PG, Satellite",
    rating: 5,
    text: "The Wi-Fi never drops even during my late-night sprint deployments. Having Doordarshan Kendra metro just 10 mins walk away saves me at least 45 minutes of daily commute in Ahmedabad traffic. Zero brokerage and exact sub-meter billing.",
    verifiedStay: "Resident for 11 months",
    avatarText: "AP",
    accentColor: "from-blue-600 to-indigo-600",
  },
  {
    name: "Pooja Trivedi",
    role: "M.Arch Student, CEPT University",
    property: "Luxora Girls PG, Navrangpura",
    rating: 5,
    text: "Finding a girls' PG in Navrangpura that actually respects student architecture project timings was tough until Luxora. The biometric entry, 24/7 on-site lady warden, and walking distance to Commerce Six Roads Metro make it unbeatable.",
    verifiedStay: "Resident for 9 months",
    avatarText: "PT",
    accentColor: "from-pink-600 to-rose-600",
  },
  {
    name: "Rohan Deshmukh",
    role: "CAT Aspirant & IIM Ahmedabad Candidate",
    property: "Luxora Boys PG, Vastrapur",
    rating: 5,
    text: "The 24/7 co-working study lounge is a complete game-changer. Total silence after 10:30 PM, ergonomic high-back chairs, and zero disturbance from loud roommates. Got my deposit refunded cleanly without any dispute.",
    verifiedStay: "Resident for 7 months",
    avatarText: "RD",
    accentColor: "from-purple-600 to-brand",
  },
  {
    name: "Sneha Goswami",
    role: "Software Developer, Infocity & SG Highway",
    property: "Luxora Girls PG, Satellite",
    rating: 5,
    text: "The hygiene standards are genuinely exceptional. Fresh linen changes every week, hot geyser water without fail in the morning, and the rooftop garden terrace is my favorite place to unwind after long coding sessions.",
    verifiedStay: "Resident for 14 months",
    avatarText: "SG",
    accentColor: "from-teal-600 to-emerald-600",
  },
  {
    name: "Hardik Shah",
    role: "Chartered Accountant (CA Final), Navrangpura",
    property: "Luxora Boys PG, Thaltej",
    rating: 5,
    text: "Transparent pricing is what sold me. What they quoted on this website is exactly what was written on the stay agreement. Covered bike parking with 24/7 CCTV gives me total peace of mind.",
    verifiedStay: "Resident for 10 months",
    avatarText: "HS",
    accentColor: "from-amber-600 to-orange-600",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const n = REVIEWS.length;

  const next = () => setCurrent((c) => (c + 1) % n);
  const prev = () => setCurrent((c) => (c - 1 + n) % n);

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(next, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, current]);

  const rev = REVIEWS[current];

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
              Trusted by 450+ students & professionals
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-ok/15 px-3.5 py-1.5 text-xs font-bold text-ok border border-ok/25">
              <ShieldCheck size={15} /> 100% Genuine Resident Feedback
            </span>

            {/* Slider Controls */}
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
          </div>
        </div>

        {/* Featured Auto-Slider Card */}
        <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-gradient-to-br from-surface via-surface/90 to-brand/5 p-8 sm:p-12 shadow-xl">
          {/* Progress Timer Line */}
          {!paused && (
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
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={18} className="fill-amber-400" />
                    ))}
                  </div>
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                    5.0 / 5 Verified Review
                  </span>
                </div>

                <blockquote className="text-lg sm:text-2xl font-medium leading-relaxed text-ink italic">
                  "{rev.text}"
                </blockquote>

                <div className="flex items-center gap-4 pt-2">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr ${rev.accentColor} text-white font-bold text-sm shadow-md`}>
                    {rev.avatarText}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-ink">{rev.name}</h4>
                    <p className="text-xs text-mute">{rev.role}</p>
                    <p className="text-[11px] font-semibold text-brand mt-0.5">{rev.property} · {rev.verifiedStay}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-ink/10 pt-6 lg:pt-0 lg:pl-8 space-y-3">
                <Quote size={40} className="text-brand/20 hidden lg:block" />
                <div className="rounded-2xl border border-ink/10 bg-bg/60 p-4 text-xs space-y-2">
                  <p className="font-bold text-ink flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-ok" /> The Luxora Verification Guarantee
                  </p>
                  <p className="text-mute leading-relaxed">
                    All reviews are collected directly from residents with confirmed lease agreements. Zero incentivized or fake testimonials.
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {REVIEWS.map((_, idx) => (
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
        </div>
      </div>
    </section>
  );
}
