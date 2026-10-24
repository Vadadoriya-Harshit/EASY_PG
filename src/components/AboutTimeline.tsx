"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCircle2, Building, ShieldCheck, Sparkles, Trophy, ArrowRight } from "lucide-react";

interface Milestone {
  year: string;
  badge: string;
  title: string;
  desc: string;
  image: string;
  stats: string;
}

const MILESTONES: Milestone[] = [
  {
    year: "2021",
    badge: "The Beginning",
    title: "Flagship Satellite Residence Opens",
    desc: "Frustrated with hidden broker commissions and fake room photos, we launched our first 35-bed residence in Satellite with honest transparent agreements.",
    image: "/images/hero-building.jpg",
    stats: "35 Initial Residents · 100% Direct Management",
  },
  {
    year: "2022",
    badge: "Academic Expansion",
    title: "Navrangpura CEPT & University Hub",
    desc: "Expanded to the historic student heart of Ahmedabad near Gujarat University and CEPT. Introduced specialized architectural drawing desks and project-friendly hours.",
    image: "/images/study-lounge.jpg",
    stats: "90+ Students · 500m to Commerce Six Roads Metro",
  },
  {
    year: "2023",
    badge: "Safety Standard",
    title: "24/7 Biometric Turnstiles & Resident Wardens",
    desc: "Became the first PG network in Gujarat to deploy full biometric RFID turnstiles and full-time on-site female resident wardens in all girls' residences.",
    image: "/images/bathroom.jpg",
    stats: "16+ HD CCTV Cameras · 100% Female Warden Coverage",
  },
  {
    year: "2024",
    badge: "Productivity",
    title: "Vastrapur 24/7 Co-Working Study Lounge",
    desc: "Inaugurated our flagship 1,200 sq.ft co-working study lounge adjoining Vastrapur Lake and IIM Ahmedabad with 100 Mbps commercial dual-line fiber.",
    image: "/images/dining-hall.jpg",
    stats: "Zero-Noise Study Pods · Dual 100 Mbps ISP Mesh",
  },
  {
    year: "2025",
    badge: "IT Executive Hub",
    title: "Thaltej SG Highway Technology Residence",
    desc: "Opened our modern executive residence near Thaltej Metro Station, serving software engineers working along the SG Highway and Sola IT corridor.",
    image: "/images/rooftop-terrace.jpg",
    stats: "Flexible Shift Hours · Covered Motorcycle Parking",
  },
  {
    year: "2026",
    badge: "Next-Gen Platform",
    title: "Gujarat's Most Transparent PG Discovery & CMS",
    desc: "Launched our full-scale digital discovery platform with live room inspection, 360 virtual tours, route-checked metro distances, and 5-day deposit refund guarantees.",
    image: "/images/room-single.jpg",
    stats: "450+ Active Residents · 4 Premier Corridors",
  },
];

export default function AboutTimeline() {
  const [activeIdx, setActiveIdx] = useState(MILESTONES.length - 1);
  const m = MILESTONES[activeIdx];

  return (
    <div className="space-y-8">
      {/* Year Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2" role="tablist">
        {MILESTONES.map((item, idx) => (
          <button
            key={item.year}
            onClick={() => setActiveIdx(idx)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
              activeIdx === idx
                ? "bg-brand text-white shadow-lg shadow-brand/25 scale-[1.03]"
                : "border border-ink/10 bg-surface text-mute hover:border-ink/20 hover:text-ink"
            }`}
          >
            <Calendar size={14} />
            <span>{item.year}</span>
          </button>
        ))}
      </div>

      {/* Active Milestone Card */}
      <div className="card overflow-hidden border border-ink/10 bg-surface shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={m.year}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="grid gap-8 lg:grid-cols-12 p-6 sm:p-10 items-center"
          >
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-display text-4xl font-extrabold text-brand">
                  {m.year}
                </span>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                  {m.badge}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-ink">
                {m.title}
              </h3>

              <p className="text-sm text-mute leading-relaxed">
                {m.desc}
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-ok">
                <CheckCircle2 size={16} />
                <span>{m.stats}</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-ink/10 shadow-lg">
                <img loading="lazy" decoding="async"
                  src={m.image}
                  alt={m.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-semibold">
                  <span>Luxora Living Archive · {m.year} Milestone</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
