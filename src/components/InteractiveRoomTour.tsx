"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Info, Sparkles, CheckCircle2, Maximize2, ShieldCheck, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface Hotspot {
  id: string;
  x: number; // percentage
  y: number; // percentage
  title: string;
  detail: string;
  spec: string;
}

interface RoomScene {
  id: string;
  name: string;
  image: string;
  tag: string;
  description: string;
  dimensions: string;
  features: string[];
  hotspots: Hotspot[];
}

const SCENES: RoomScene[] = [
  {
    id: "single",
    name: "Executive Single Room",
    image: "/images/room-single.jpg",
    tag: "Private Sanctuary",
    description: "Designed for intensive study and peaceful recovery with zero roommate disturbance.",
    dimensions: "14 ft × 11 ft · 154 sq.ft",
    features: ["Private Attached Ensuite", "Noise-Insulated Windows", "Dedicated Study Pod", "High-speed Ethernet & Wi-Fi"],
    hotspots: [
      { id: "bed", x: 42, y: 65, title: "Orthopedic Sleep Suite", detail: "8-inch high-resilience memory foam mattress with hypoallergenic protector.", spec: "Queen Size (6ft x 5ft)" },
      { id: "desk", x: 80, y: 68, title: "Ergonomic Study Station", detail: "Spacious wooden desk with cable organizer, study lamp, and high-back lumbar support chair.", spec: "Dual Power & USB Sockets" },
      { id: "light", x: 26, y: 44, title: "Warm Architectural Backlight", detail: "Glare-free LED fluted panel ambient lighting for comfortable late-night reading.", spec: "3000K Warm White" },
      { id: "window", x: 60, y: 35, title: "Acoustic Balcony Window", detail: "Floor-to-ceiling double-glazed sliding glass providing abundant daylight and noise dampening.", spec: "UPVC Sound Dampening" },
    ],
  },
  {
    id: "double",
    name: "Premium Twin Sharing",
    image: "/images/room-double.jpg",
    tag: "Balanced & Spacious",
    description: "Symmetrical layout giving each resident independent study, wardrobe, and sleeping zones.",
    dimensions: "18 ft × 14 ft · 252 sq.ft",
    features: ["Dual Wardrobes with Locks", "Twin Independent Study Desks", "Attached Washroom", "Individual Bedside Lighting"],
    hotspots: [
      { id: "bed1", x: 40, y: 72, title: "Resident Bed 01", detail: "Individual single wooden bed with under-bed slide-out storage drawers.", spec: "Solid Sheesham Frame" },
      { id: "bed2", x: 66, y: 72, title: "Resident Bed 02", detail: "Dedicated mattress with fresh linen change included every week.", spec: "Individual Bedside Sockets" },
      { id: "desk", x: 18, y: 70, title: "Independent Study Pods", detail: "Two separate study setups so roommates never compete for space.", spec: "Personal Desk Lamps" },
      { id: "closet", x: 92, y: 48, title: "Individual Modular Wardrobe", detail: "Full-height wardrobe with separate digital/keyed lock and hanger rail.", spec: "Dual Compartment" },
    ],
  },
  {
    id: "study",
    name: "24/7 Co-working Study Lounge",
    image: "/images/study-lounge.jpg",
    tag: "Productivity Hub",
    description: "Quiet library ambience with dedicated Wi-Fi lines, private acoustic booths, and comfortable armchairs.",
    dimensions: "45 ft × 28 ft · 1,260 sq.ft",
    features: ["100 Mbps Dual ISP Mesh", "Strict Silence Protocol", "Ergonomic Seating", "Coffee & Tea Station"],
    hotspots: [
      { id: "booths", x: 24, y: 60, title: "Individual Study Pods", detail: "Partitioned acoustic wood carrels equipped with individual warm task lights.", spec: "Zero Eye Strain LEDs" },
      { id: "lounge", x: 55, y: 72, title: "Discussion & Reading Zone", detail: "Comfortable velvet armchairs for reading reference books and casual discussion.", spec: "Plush High-Back Seating" },
      { id: "library", x: 86, y: 45, title: "Curated Reference Books", detail: "Textbooks, engineering manuals, GATE/CAT prep material, and magazines.", spec: "Open Student Library" },
    ],
  },
  {
    id: "dining",
    name: "Hygienic Dining Cafeteria",
    image: "/images/dining-hall.jpg",
    tag: "Clean & Nutritious",
    description: "Well-ventilated cafeteria offering freshly cooked meals, pure RO water, and daily sanitized cutlery.",
    dimensions: "50 ft × 32 ft · 1,600 sq.ft",
    features: ["FSSAI-Compliant Kitchen", "RO Water Dispenser", "Live Breakfast Station", "Dietary Flexibility (Jain/Swaminarayan)"],
    hotspots: [
      { id: "buffet", x: 18, y: 55, title: "Hot Buffet Counter", detail: "Stainless steel warmers maintaining food temperature at safe hygienic standards.", spec: "Freshly Cooked 3x Daily" },
      { id: "tables", x: 52, y: 75, title: "Sanitized Dining Tables", detail: "Wiped down after every meal session with hospital-grade disinfectant.", spec: "Solid Birch Wood" },
      { id: "windows", x: 80, y: 40, title: "Sunlit Garden View", detail: "Large glass facade looking onto green trees for a peaceful breakfast experience.", spec: "Natural Cross-Ventilation" },
    ],
  },
  {
    id: "rooftop",
    name: "Aesthetic Rooftop Terrace",
    image: "/images/rooftop-terrace.jpg",
    tag: "Sunset & Community",
    description: "Open sky terrace for evening relaxation, morning yoga, and weekend community gatherings.",
    dimensions: "60 ft × 35 ft · 2,100 sq.ft",
    features: ["Fairy Light Pergola", "Artificial Grass Lawn", "Panoramic Sunset Views", "Open 6 AM - 10:30 PM"],
    hotspots: [
      { id: "pergola", x: 45, y: 30, title: "Timber Pergola with Ambient Lights", detail: "Cozy warm fairy lighting creating a cafe-like vibe after sunset.", spec: "Warm Filament Bulbs" },
      { id: "lounge", x: 38, y: 78, title: "Weatherproof Lounge Sofas", detail: "Comfortable cushioned seating for socialising, reading or unwinding.", spec: "UV-Resistant Fabric" },
    ],
  },
  {
    id: "washroom",
    name: "Ensuite Modern Bathroom",
    image: "/images/bathroom.jpg",
    tag: "Hygiene Guaranteed",
    description: "Immaculate private bathroom with glass shower cubicle, hot water geyser, and LED vanity mirror.",
    dimensions: "8 ft × 6 ft · 48 sq.ft",
    features: ["24/7 Hot Water Geyser", "Glass Shower Partition", "Backlit Vanity Mirror", "Anti-Skid Matte Tiles"],
    hotspots: [
      { id: "shower", x: 32, y: 55, title: "Glass Rain Shower", detail: "High-pressure chrome shower with tempered glass partition separating wet/dry zones.", spec: "Thermostatic Mixer" },
      { id: "mirror", x: 74, y: 35, title: "Smart Backlit Vanity", detail: "Touch-activated anti-fog LED mirror with bright grooming illumination.", spec: "Touch Dimmer Switch" },
    ],
  },
];

export default function InteractiveRoomTour() {
  const [selectedScene, setSelectedScene] = useState<RoomScene>(SCENES[0]);
  const [nightMode, setNightMode] = useState(false);
  const [activePin, setActivePin] = useState<Hotspot | null>(null);
  const [autoTour, setAutoTour] = useState(true);

  // Auto-tour rotation every 5 seconds
  useEffect(() => {
    if (!autoTour || activePin) return;
    const interval = setInterval(() => {
      setSelectedScene((prev) => {
        const curIdx = SCENES.findIndex((s) => s.id === prev.id);
        return SCENES[(curIdx + 1) % SCENES.length];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [autoTour, activePin]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-ink/10 bg-surface shadow-2xl" aria-label="Interactive Virtual Room Tour">
      {/* Auto-Slide Progress Bar */}
      {autoTour && !activePin && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30 overflow-hidden">
          <motion.div
            key={selectedScene.id}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="h-full bg-brand"
          />
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 p-5 sm:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <Sparkles size={13} /> Interactive 360° Visualizer
            </span>
            <span className="hidden rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent sm:inline-block">
              {selectedScene.tag}
            </span>
          </div>
          <h3 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{selectedScene.name}</h3>
        </div>

        {/* Ambient Lighting & Auto-Tour Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Tour Toggle */}
          <button
            onClick={() => setAutoTour((a) => !a)}
            className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-bg/70 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-bg transition"
            aria-label={autoTour ? "Pause Auto-Tour" : "Start Auto-Tour"}
          >
            {autoTour ? <Pause size={13} className="text-emerald-500" /> : <Play size={13} className="text-amber-500" />}
            <span className="hidden sm:inline">{autoTour ? "Auto Tour ON" : "Tour Paused"}</span>
          </button>

          <div className="flex items-center rounded-full border border-ink/15 bg-bg/70 p-1">
            <button
              onClick={() => setNightMode(false)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                !nightMode ? "bg-amber-400/20 text-amber-500 shadow-sm" : "text-mute hover:text-ink"
              )}
              aria-pressed={!nightMode}
            >
              <Sun size={14} /> Day Natural
            </button>
            <button
              onClick={() => setNightMode(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                nightMode ? "bg-indigo-600 text-white shadow-sm" : "text-mute hover:text-ink"
              )}
              aria-pressed={nightMode}
            >
              <Moon size={14} /> Evening Cozy
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/90 sm:aspect-[16/9]">
        {/* Room Photo with ambient filter */}
        <motion.img
          key={selectedScene.id}
          src={selectedScene.image}
          alt={selectedScene.name}
          initial={{ opacity: 0.8, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className={cn(
            "h-full w-full object-cover transition-all duration-700",
            nightMode ? "brightness-[0.78] contrast-[1.08] saturate-[1.25]" : "brightness-100 contrast-100"
          )}
        />

        {/* Night Ambient Warm Overlay */}
        {nightMode && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-amber-950/40 via-transparent to-indigo-950/30 mix-blend-color-burn"
          />
        )}

        {/* Instruction Badge */}
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          <Info size={13} className="text-accent" /> Tap glowing pins to inspect amenities
        </div>

        {/* Dimensions Badge */}
        <div className="pointer-events-none absolute right-4 top-4 z-10 hidden items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md sm:flex">
          <Maximize2 size={13} className="text-brand" /> {selectedScene.dimensions}
        </div>

        {/* Interactive Hotspots */}
        {selectedScene.hotspots.map((pin) => {
          const isActive = activePin?.id === pin.id;
          return (
            <div
              key={pin.id}
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <button
                onClick={() => setActivePin(isActive ? null : pin)}
                aria-label={`Inspect ${pin.title}`}
                className={cn(
                  "group relative flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90",
                  isActive ? "scale-110" : "hover:scale-110"
                )}
              >
                {/* Pulsing ring */}
                <span className="absolute h-full w-full animate-ping rounded-full bg-accent/60 opacity-75" />
                {/* Core pin */}
                <span className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-xl font-bold text-xs transition",
                  isActive ? "bg-accent text-slate-950" : "bg-brand text-white group-hover:bg-accent group-hover:text-slate-950"
                )}>
                  +
                </span>
              </button>

              {/* Hotspot Popover Tooltip */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 top-11 z-30 w-64 -translate-x-1/2 rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-left text-white shadow-2xl backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm text-accent">{pin.title}</h4>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
                        {pin.spec}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{pin.detail}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 size={13} /> Luxora Standard Verified
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Feature Pills Overlay at Bottom */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {selectedScene.features.map((feat) => (
              <span key={feat} className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-md">
                ✓ {feat}
              </span>
            ))}
          </div>
          <div className="hidden items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md md:flex">
            <ShieldCheck size={14} /> 100% Genuine Actual Room Photos
          </div>
        </div>
      </div>

      {/* Bottom Scene Thumbnail Switcher */}
      <div className="border-t border-ink/10 bg-bg/50 p-4 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-mute mb-2.5">
          Select Room or Common Space to Inspect:
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {SCENES.map((scene) => {
            const isSelected = selectedScene.id === scene.id;
            return (
              <button
                key={scene.id}
                onClick={() => {
                  setSelectedScene(scene);
                  setActivePin(null);
                }}
                className={cn(
                  "group relative flex flex-col items-start overflow-hidden rounded-xl border p-2 text-left transition",
                  isSelected
                    ? "border-brand bg-brand/10 shadow-sm"
                    : "border-ink/10 bg-surface hover:border-ink/25"
                )}
              >
                <div className="aspect-[16/10] w-full overflow-hidden rounded-lg">
                  <img
                    src={scene.image}
                    alt={scene.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <span className={cn(
                  "mt-2 block font-semibold text-xs truncate w-full",
                  isSelected ? "text-brand" : "text-ink"
                )}>
                  {scene.name}
                </span>
                <span className="text-[10px] text-mute truncate w-full">{scene.tag}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
