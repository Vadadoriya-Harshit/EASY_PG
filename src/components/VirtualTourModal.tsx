"use client";
import { useState } from "react";
import { Play, X, Compass, CheckCircle2, Calendar, Sparkles, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const TOUR_STOPS = [
  { id: "lobby", title: "Lobby & Biometric Gate", image: "/images/hero-building.jpg", tag: "Security & First Impression", desc: "Digital keycard & biometric entry turnstiles, 24/7 CCTV surveillance, and visitor verification desk." },
  { id: "room", title: "Private Bedroom Suite", image: "/images/room-single.jpg", tag: "Comfort & Rest", desc: "Sound-insulated room with ergonomic study desk, orthopedic mattress, personal wardrobe, and warm lighting." },
  { id: "study", title: "Co-working & Study Zone", image: "/images/study-lounge.jpg", tag: "Focus & Productivity", desc: "Dual high-speed 100 Mbps commercial fiber lines, silent reading pods, and comfortable armchairs." },
  { id: "dining", title: "Clean Dining Hall", image: "/images/dining-hall.jpg", tag: "Nutrition & Community", desc: "Spotless dining hall serving nutritious hot meals with fresh vegetarian menus and RO drinking water." },
  { id: "rooftop", title: "Rooftop Sunset Terrace", image: "/images/rooftop-terrace.jpg", tag: "Evening Unwind", desc: "Aesthetic turf lawn with fairy lights and open breeze overlooking Ahmedabad cityscape." },
];

export default function VirtualTourModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  const currentStop = TOUR_STOPS[currentStopIndex];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-surface/80 px-5 py-2.5 text-sm font-semibold text-ink shadow-sm backdrop-blur transition hover:border-brand hover:bg-surface hover:text-brand"
      >
        <Compass size={17} className="text-brand animate-spin [animation-duration:12s]" />
        <span>Experience Virtual 360° Walkthrough</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-950 text-white shadow-2xl"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/20 text-brand">
                    <Sparkles size={14} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">Luxora PG Guided Virtual Tour</h3>
                    <p className="text-xs text-slate-400">Step {currentStopIndex + 1} of {TOUR_STOPS.length} · {currentStop.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMuted(!muted)}
                    aria-label={muted ? "Unmute ambient sounds" : "Mute ambient sounds"}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                  >
                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close tour"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Main Visual Display */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
                <motion.img
                  key={currentStop.id}
                  src={currentStop.image}
                  alt={currentStop.title}
                  initial={{ opacity: 0.8, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                {/* Tour Stop Info Card */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
                  <div className="max-w-xl">
                    <span className="rounded-full bg-brand/30 px-3 py-1 text-xs font-semibold text-brand backdrop-blur-md">
                      {currentStop.tag}
                    </span>
                    <h4 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{currentStop.title}</h4>
                    <p className="mt-1 text-sm text-slate-300 sm:text-base">{currentStop.desc}</p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href="/contact"
                      onClick={() => setIsOpen(false)}
                      className="btn btn-primary gap-1.5 shadow-lg shadow-brand/40"
                    >
                      <Calendar size={15} /> Book Live In-Person Visit
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom Step Switcher */}
              <div className="flex gap-3 overflow-x-auto border-t border-white/10 bg-slate-900/90 p-4">
                {TOUR_STOPS.map((stop, idx) => (
                  <button
                    key={stop.id}
                    onClick={() => setCurrentStopIndex(idx)}
                    className={`flex shrink-0 items-center gap-3 rounded-xl border p-2 text-left transition ${
                      idx === currentStopIndex
                        ? "border-brand bg-brand/20 text-white"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <img loading="lazy" decoding="async" src={stop.image} alt="" className="h-12 w-16 rounded-lg object-cover" />
                    <div>
                      <p className="text-xs font-semibold text-white">{stop.title}</p>
                      <p className="text-[11px] text-slate-400">{stop.tag}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
