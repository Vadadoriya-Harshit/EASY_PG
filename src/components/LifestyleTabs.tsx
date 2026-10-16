"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, BookOpen, Utensils, Sparkles, Sun, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LifestyleTab {
  id: string;
  label: string;
  icon: any;
  title: string;
  subtitle: string;
  image: string;
  badge: string;
  highlights: string[];
}

const TABS: LifestyleTab[] = [
  {
    id: "security",
    label: "24/7 Security & Wardens",
    icon: ShieldCheck,
    title: "Multi-Tiered Safety with Full-Time Resident Wardens",
    subtitle: "Complete peace of mind for both students and parents with biometric gates, continuous HD CCTV, and dedicated female wardens.",
    image: "/images/hero-building.jpg",
    badge: "Safety Standard",
    highlights: [
      "Biometric fingerprint & RFID keycard entry gates",
      "Full-time female resident superintendent at girls' residences",
      "16+ High-definition CCTV cameras in public common corridors",
      "Well-lit approach roads within prime gated residential societies",
      "Digital visitor log and late-arrival parent intimation protocol",
    ],
  },
  {
    id: "study",
    label: "Co-working & Study Lounges",
    icon: BookOpen,
    title: "Quiet Spaces Engineered for High-Focus Exam & Work Sprints",
    subtitle: "Say goodbye to noisy hostel rooms. Our dedicated silent library and co-working pods give you the focus needed to crack exams and deliver projects.",
    image: "/images/study-lounge.jpg",
    badge: "Productivity First",
    highlights: [
      "100 Mbps dual commercial fiber optic lines with automatic failover",
      "Strict silence protocol observed in study carrels after 10:30 PM",
      "Ergonomic high-back chairs and individual warm desk lamps",
      "Multi-plug surge protectors with fast USB charging at every desk",
      "Open student library stocked with GATE, CAT, and engineering reference texts",
    ],
  },
  {
    id: "food",
    label: "Nutrition & Hygienic Food",
    icon: Utensils,
    title: "Fresh Vegetarian Menus Cooked with Homestyle Care",
    subtitle: "Nutritious breakfasts and homestyle dinners prepared in spotless, FSSAI-compliant kitchens using filtered water and farm-fresh vegetables.",
    image: "/images/dining-hall.jpg",
    badge: "Clean & Fresh",
    highlights: [
      "Daily fresh breakfast buffet + homestyle dinner plans",
      "Jain and Swaminarayan meal options prepared with strict dietary guidelines",
      "Multi-stage commercial RO drinking water dispensers on every floor",
      "Stainless steel hot buffet tables maintaining hygienic food temperatures",
      "Verified directory of nearby authentic Gujarati, Kathiyawadi, and South Indian tiffin spots",
    ],
  },
  {
    id: "hygiene",
    label: "Daily Housekeeping & Laundry",
    icon: Sparkles,
    title: "Hospital-Grade Cleanliness Maintained Every Single Day",
    subtitle: "A clean environment is essential for good health. Our trained staff handles daily room floor cleaning, garbage collection, and washroom sanitization.",
    image: "/images/bathroom.jpg",
    badge: "Hygiene Guaranteed",
    highlights: [
      "Daily floor sweeping and wet mopping in all bedrooms",
      "Attached ensuite washrooms deep-cleaned twice weekly with disinfectant",
      "In-house automatic washing machines for free self-wash",
      "Optional steam iron garment service delivered to your room",
      "Solar water heaters and backup geysers for 24/7 hot showers",
    ],
  },
  {
    id: "community",
    label: "Aesthetic Rooftop & Living",
    icon: Sun,
    title: "Vibrant Community Living with Open Sky Terrace Gardens",
    subtitle: "Relax after long college hours. Our rooftop pergolas with fairy lights and turf grass are built for community connections, morning yoga, and calm sunsets.",
    image: "/images/rooftop-terrace.jpg",
    badge: "Community Life",
    highlights: [
      "Panoramic evening skyline views overlooking Ahmedabad city",
      "Artificial grass lawn with comfortable outdoor lounge sofas",
      "Morning yoga and quiet open-air reading deck open from 6:00 AM",
      "Respectful community of ambitious students and professionals",
      "Zero tolerance for loud partying, smoking, alcohol, or nuisance",
    ],
  },
];

export default function LifestyleTabs() {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <section className="section pt-0" aria-labelledby="lifestyle-title">
      <div className="container-x">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            The Luxora Standard
          </span>
          <h2 id="lifestyle-title" className="mt-1 text-3xl font-bold sm:text-5xl text-ink">
            A PG Experience Designed Around Real Student Needs
          </h2>
          <p className="mt-2 text-sm text-mute max-w-2xl">
            We listened to what students and young professionals actually care about: high-speed internet that never drops, absolute hygiene, and quiet spaces where you can genuinely study.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab.id === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all ${isSelected
                  ? "bg-brand text-white shadow-lg shadow-brand/25 scale-[1.02]"
                  : "border border-ink/10 bg-surface text-mute hover:border-ink/20 hover:text-ink"
                  }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="card overflow-hidden border border-ink/10 bg-surface shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid gap-8 lg:grid-cols-12 p-6 sm:p-10 items-center"
            >
              {/* Left Details */}
              <div className="lg:col-span-6 space-y-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                  <Sparkles size={13} /> {activeTab.badge}
                </span>

                <h3 className="text-2xl sm:text-3xl font-bold text-ink leading-snug">
                  {activeTab.title}
                </h3>

                <p className="text-sm text-mute leading-relaxed">
                  {activeTab.subtitle}
                </p>

                <ul className="space-y-2.5 pt-2">
                  {activeTab.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-ink/90 font-medium">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 flex flex-wrap gap-3">
                  <Link href="/facilities" className="btn btn-primary text-xs gap-1.5">
                    View Complete Facilities Matrix <ArrowRight size={14} />
                  </Link>
                  <Link href="/contact" className="btn btn-ghost text-xs">
                    Schedule Free Visit
                  </Link>
                </div>
              </div>

              {/* Right Image Showcase */}
              <div className="lg:col-span-6">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-ink/10 shadow-lg">
                  <img
                    src={activeTab.image}
                    alt={activeTab.title}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white text-xs font-semibold">
                    <span>{activeTab.label} · Verified Facility</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
