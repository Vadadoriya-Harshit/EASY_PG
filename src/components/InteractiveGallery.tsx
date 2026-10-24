"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Expand,
  X,
  Sparkles,
  Filter,
  ChevronRight,
  ChevronLeft,
  Eye,
  CheckCircle2,
  Calendar,
  Share2,
  Maximize2,
  Play,
  Pause
} from "lucide-react";
import Link from "next/link";

interface GalleryItem {
  id: string;
  category: "all" | "bedroom" | "study" | "dining" | "rooftop" | "washroom";
  title: string;
  property: string;
  image: string;
  description: string;
  tag: string;
  specs: string[];
}

const ITEMS: GalleryItem[] = [
  {
    id: "g1",
    category: "bedroom",
    title: "Executive Single Private Bedroom",
    property: "Luxora Boys & Girls Satellite",
    image: "/images/room-single.jpg",
    description: "Quiet private room with orthopedic mattress, warm headboard backlighting, dedicated study desk, and acoustic balcony windows.",
    tag: "Single Bedroom",
    specs: ["154 sq.ft Area", "Attached Bathroom", "5-Star AC", "Personal Balcony"],
  },
  {
    id: "g2",
    category: "bedroom",
    title: "Spacious Double Twin-Sharing Suite",
    property: "Luxora Boys Vastrapur & Thaltej",
    image: "/images/room-double.jpg",
    description: "Symmetrical arrangement with individual modular wardrobes, bedside charging ports, and separate study pods for each roommate.",
    tag: "Twin Sharing",
    specs: ["252 sq.ft Area", "Dual Wardrobes", "Twin Study Desks", "Attached Washroom"],
  },
  {
    id: "g3",
    category: "study",
    title: "24/7 Co-working Study Lounge",
    property: "All Luxora PG Residences",
    image: "/images/study-lounge.jpg",
    description: "High-speed dual 100 Mbps commercial fiber connections, acoustic silent booths, and ergonomic high-back chairs.",
    tag: "Study Lounge",
    specs: ["Dual Fiber Mesh", "Zero Noise Policy", "Ergonomic Chairs", "Open Reference Library"],
  },
  {
    id: "g4",
    category: "dining",
    title: "Spotless Hygienic Dining Cafeteria",
    property: "Luxora Navrangpura & Satellite",
    image: "/images/dining-hall.jpg",
    description: "FSSAI compliant kitchen serving fresh hot Gujarati, Punjabi, and Kathiyawadi vegetarian meals with RO drinking water.",
    tag: "Dining Cafeteria",
    specs: ["FSSAI Certified", "RO Water Dispensers", "Stainless Buffet", "Jain/Swaminarayan Meals"],
  },
  {
    id: "g5",
    category: "rooftop",
    title: "Aesthetic Rooftop Sunset Terrace",
    property: "Luxora Thaltej & Satellite",
    image: "/images/rooftop-terrace.jpg",
    description: "Aesthetic timber pergola, green turf lawn, warm fairy lights, and panoramic city skyline views.",
    tag: "Rooftop Garden",
    specs: ["Artificial Turf Lawn", "Fairy Light Pergola", "Outdoor Lounge Sofas", "Open 6 AM - 10:30 PM"],
  },
  {
    id: "g6",
    category: "washroom",
    title: "Modern Ensuite Luxury Bathroom",
    property: "All Attached Rooms",
    image: "/images/bathroom.jpg",
    description: "Glass shower partitions separating wet and dry zones, touch-dimming LED backlit vanity mirror and hot water geysers.",
    tag: "Ensuite Washroom",
    specs: ["Glass Partition", "Anti-Fog LED Mirror", "24/7 Hot Water", "Anti-Skid Flooring"],
  },
  {
    id: "g7",
    category: "bedroom",
    title: "Contemporary Exterior Facade at Dusk",
    property: "Luxora PG Satellite Flagship",
    image: "/images/hero-building.jpg",
    description: "Modern gated building with landscaped walkways, 24/7 security guard post, and well-lit approach street.",
    tag: "Flagship Facade",
    specs: ["Gated Society", "Biometric Turnstiles", "HD CCTV", "Covered Bike Parking"],
  },
];

export default function InteractiveGallery() {
  const [items, setItems] = useState<GalleryItem[]>(ITEMS);
  const [filter, setFilter] = useState<string>("all");
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [autoSlideModal, setAutoSlideModal] = useState(true);

  // Auto-sliding Hero Showcase at the top of the Gallery
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [featuredPlaying, setFeaturedPlaying] = useState(true);

  useEffect(() => {
    const fetchGallery = () => {
      fetch("/api/gallery")
        .then((r) => r.json())
        .then((res) => {
          if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
            setItems(res.data);
          }
        })
        .catch(() => {});
    };
    fetchGallery();
    window.addEventListener("sorath_cms_updated", fetchGallery);
    return () => window.removeEventListener("sorath_cms_updated", fetchGallery);
  }, []);

  const filtered = filter === "all" ? items : items.filter((item) => item.category === filter);


  const handleNext = () => {
    if (!activeItem) return;
    const idx = filtered.findIndex((x) => x.id === activeItem.id);
    setActiveItem(filtered[(idx + 1) % filtered.length]);
    setZoomLevel(1);
  };

  const handlePrev = () => {
    if (!activeItem) return;
    const idx = filtered.findIndex((x) => x.id === activeItem.id);
    setActiveItem(filtered[(idx - 1 + filtered.length) % filtered.length]);
    setZoomLevel(1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!activeItem) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") setActiveItem(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeItem, filtered]);

  // 1. Auto-Slide inside Fullscreen Lightbox Modal
  useEffect(() => {
    if (!activeItem || !autoSlideModal || zoomLevel > 1) return;
    const timer = setInterval(() => {
      const idx = filtered.findIndex((x) => x.id === activeItem.id);
      setActiveItem(filtered[(idx + 1) % filtered.length]);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeItem, autoSlideModal, filtered, zoomLevel]);

  // 2. Auto-Slide inside Top Featured Showcase Banner
  useEffect(() => {
    if (!featuredPlaying || ITEMS.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIdx((prev) => (prev + 1) % ITEMS.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [featuredPlaying]);

  const featuredItem = ITEMS[featuredIdx];

  return (
    <div className="space-y-10">
      {/* =========================================================================
          FEATURED AUTO-SLIDE SHOWCASE BANNER (Dynamic Live Slideshow)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-surface shadow-xl">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[460px] w-full overflow-hidden bg-black/90">
          <AnimatePresence mode="wait">
            <motion.div
              key={featuredItem.id}
              initial={{ opacity: 0.6, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.7 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute inset-0 h-full w-full"
            >
              <img loading="lazy" decoding="async"
                src={featuredItem.image}
                alt={featuredItem.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
            </motion.div>
          </AnimatePresence>

          {/* Progress Bar for Auto-Slide */}
          {featuredPlaying && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20 overflow-hidden">
              <motion.div
                key={featuredIdx}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4.2, ease: "linear" }}
                className="h-full bg-gradient-to-r from-amber-400 to-brand"
              />
            </div>
          )}

          {/* Top Controls Overlay */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-bold text-amber-400">
              <Sparkles size={13} /> Featured Live Showcase
            </span>

            <button
              onClick={() => setFeaturedPlaying((p) => !p)}
              className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-black/80 transition"
              aria-label={featuredPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {featuredPlaying ? <Pause size={13} className="text-emerald-400" /> : <Play size={13} className="text-amber-400" />}
              <span className="hidden sm:inline">{featuredPlaying ? "Auto-Slide ON" : "Paused"}</span>
            </button>
          </div>

          {/* Bottom Captions & Action */}
          <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-wrap items-end justify-between gap-4 text-white">
            <div className="max-w-xl space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
                  {featuredItem.tag}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {featuredItem.property}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight drop-shadow-md">
                {featuredItem.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 drop-shadow">
                {featuredItem.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveItem(featuredItem);
                  setZoomLevel(1);
                }}
                className="btn btn-primary text-xs gap-1.5 shadow-xl shadow-brand/40"
              >
                <Expand size={14} /> View Fullscreen 360°
              </button>
            </div>
          </div>

          {/* Left / Right Nav Arrows */}
          <button
            onClick={() => setFeaturedIdx((prev) => (prev - 1 + ITEMS.length) % ITEMS.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/80 transition hover:scale-105"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setFeaturedIdx((prev) => (prev + 1) % ITEMS.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/80 transition hover:scale-105"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {ITEMS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setFeaturedIdx(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === featuredIdx ? "w-6 bg-brand" : "w-1.5 bg-white/40 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-mute mr-2 flex items-center gap-1.5">
            <Filter size={14} className="text-brand" /> Filter by Space:
          </span>
          {[
            { id: "all", label: "All Spaces" },
            { id: "bedroom", label: "Bedrooms" },
            { id: "study", label: "Study Lounges" },
            { id: "dining", label: "Dining Cafeteria" },
            { id: "rooftop", label: "Rooftop Garden" },
            { id: "washroom", label: "Ensuite Washrooms" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                filter === tab.id
                  ? "bg-brand text-white shadow-lg shadow-brand/25 scale-[1.03]"
                  : "border border-ink/10 bg-surface text-mute hover:border-ink/20 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-mute font-medium">
          Showing {filtered.length} high-definition spaces
        </span>
      </div>

      {/* Modern Card Showcase Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item, idx) => (
          <motion.div
            layout
            key={item.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-md hover:border-brand/40 hover:shadow-xl transition-all"
            onClick={() => {
              setActiveItem(item);
              setZoomLevel(1);
            }}
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-black/10">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <span className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                {item.tag}
              </span>

              <button
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                aria-label="View Fullscreen"
              >
                <Expand size={15} />
              </button>

              <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs font-semibold text-brand">{item.property}</p>
                <p className="text-xs text-slate-200 mt-0.5 line-clamp-1">{item.description}</p>
              </div>
            </div>

            <div className="p-5 space-y-2">
              <h3 className="font-bold text-base text-ink group-hover:text-brand transition-colors">
                {item.title}
              </h3>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.specs.slice(0, 3).map((spec, sIdx) => (
                  <span
                    key={sIdx}
                    className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[10px] font-medium text-mute"
                  >
                    ✓ {spec}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fullscreen Interactive Lightbox Modal with Auto-Slide */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveItem(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-slate-950 text-white shadow-2xl flex flex-col justify-between"
            >
              {/* Auto-Slide Progress Bar */}
              {autoSlideModal && zoomLevel === 1 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30 overflow-hidden">
                  <motion.div
                    key={activeItem.id}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-brand to-emerald-400"
                  />
                </div>
              )}

              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand/30 px-3 py-1 text-xs font-bold text-brand">
                    {activeItem.tag}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {activeItem.property}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Auto-Slide Toggle Button */}
                  <button
                    onClick={() => setAutoSlideModal((s) => !s)}
                    className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 transition"
                    aria-label={autoSlideModal ? "Pause auto-slide" : "Start auto-slide"}
                  >
                    {autoSlideModal ? <Pause size={13} className="text-emerald-400" /> : <Play size={13} className="text-amber-400" />}
                    <span className="hidden sm:inline">{autoSlideModal ? "Auto-Slide ON" : "Paused"}</span>
                  </button>

                  <button
                    onClick={() => setZoomLevel((z) => (z === 1 ? 1.35 : 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    aria-label="Toggle zoom"
                  >
                    <Maximize2 size={16} />
                  </button>

                  <button
                    onClick={() => setActiveItem(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* High-Resolution Center Stage with Cross-fade */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-black flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeItem.id}
                    src={activeItem.image}
                    alt={activeItem.title}
                    initial={{ opacity: 0.8, scale: 1.01 }}
                    animate={{ opacity: 1, scale: zoomLevel }}
                    exit={{ opacity: 0.8 }}
                    transition={{ duration: 0.35 }}
                    className="max-h-[70vh] w-full object-contain transition-transform duration-300"
                  />
                </AnimatePresence>

                {/* Left / Right Nav Arrows */}
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 hover:scale-105 z-20"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 hover:scale-105 z-20"
                  aria-label="Next photo"
                >
                  <ChevronRight size={22} />
                </button>
              </div>

              {/* Bottom Information Bar */}
              <div className="p-6 border-t border-white/10 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
                <div className="max-w-xl">
                  <h3 className="text-xl font-bold text-white">{activeItem.title}</h3>
                  <p className="text-xs text-slate-300 mt-1">{activeItem.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeItem.specs.map((s, idx) => (
                      <span key={idx} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-slate-300">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/contact"
                    onClick={() => setActiveItem(null)}
                    className="btn btn-primary text-xs gap-1.5 shadow-lg shadow-brand/40"
                  >
                    <Calendar size={14} /> Schedule Visit For This Space
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
