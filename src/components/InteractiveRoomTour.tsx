"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  X,
  Camera,
  CheckCircle2,
  Play,
  Pause,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Room } from "@/lib/types";
import { ROOM_LABEL } from "@/lib/site";
import { inr } from "@/lib/utils";

interface Hotspot {
  id: string;
  x: number;
  y: number;
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
  features: string[];
  hotspots: Hotspot[];
  isReal?: boolean;
  rent?: number | null;
  rentUnit?: string;
  tour360Url?: string;
  tour360Urls?: string[];
  allImages: string[];
}

interface Props {
  rooms?: Room[];
}

export default function InteractiveRoomTour({ rooms }: Props) {
  const allScenes = useMemo<RoomScene[]>(() => {
    const realScenes: RoomScene[] = (rooms || [])
      .filter((r) => (r.images && r.images.length > 0) || r.tour360Url || (r.tour360Urls && r.tour360Urls.length > 0))
      .map((r) => {
        const tour360List = (r.tour360Urls && r.tour360Urls.length > 0)
          ? r.tour360Urls
          : (r.tour360Url ? [r.tour360Url] : []);

        const validImages = (r.images && r.images.length > 0)
          ? r.images
          : (tour360List.length > 0 ? [tour360List[0]] : ["/favicon.svg"]);

        const hotspots: Hotspot[] = [
          {
            id: "mattress",
            x: 52,
            y: 65,
            title: "Orthopedic Spine Mattress",
            detail: "6-inch high-density orthopedic memory foam with clean sanitized linens",
            spec: "Zero Motion Transfer",
          },
          {
            id: "study",
            x: 24,
            y: 52,
            title: "Dedicated Study Workspace",
            detail: "Ergonomic chair, warm LED desk lamp, and high-speed LAN & power",
            spec: "Power Sockets",
          },
          {
            id: "climate",
            x: 82,
            y: 24,
            title: r.ac ? "Dual-Inverter AC" : "Silent Aerodynamic Fan",
            detail: r.ac ? "Whisper-quiet cooling with 4-way airflow" : "High RPM energy efficient silent fan",
            spec: r.ac ? "1.5 Ton Copper" : "Silent Mode",
          },
        ];

        return {
          id: `room-${r.id}`,
          name: ROOM_LABEL[r.type] || r.type,
          image: validImages[0],
          tag: r.ac ? "AC Equipped" : "Non-AC",
          description: r.description || `${ROOM_LABEL[r.type]} with ${(r.included || []).join(", ") || "essential amenities"}.`,
          features: (r.included && r.included.length > 0 ? r.included : ["High-Speed Wi-Fi", "3 Chef Meals", "Daily Housekeeping", r.ac ? "Air Conditioning" : "Silent Cooling"]).slice(0, 4),
          hotspots,
          isReal: true,
          rent: r.rent,
          rentUnit: r.rentUnit,
          tour360Url: tour360List[0] || "",
          tour360Urls: tour360List,
          allImages: validImages,
        };
      });

    return realScenes;
  }, [rooms]);

  const [selectedScene, setSelectedScene] = useState<RoomScene | null>(allScenes[0] || null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [nightMode, setNightMode] = useState(false);
  const [activePin, setActivePin] = useState<Hotspot | null>(null);
  const [showHotspots, setShowHotspots] = useState(true);
  const [autoTour, setAutoTour] = useState(true);

  // 360 mode state
  const [is360Active, setIs360Active] = useState(false);
  const [current360Idx, setCurrent360Idx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [panX, setPanX] = useState(0);

  useEffect(() => {
    if (allScenes.length > 0 && (!selectedScene || !allScenes.find(s => s.id === selectedScene.id))) {
      setSelectedScene(allScenes[0]);
    }
  }, [allScenes, selectedScene]);

  // Auto-tour rotation
  useEffect(() => {
    if (!autoTour || activePin || is360Active || allScenes.length <= 1) return;
    const interval = setInterval(() => {
      setSelectedScene((prev) => {
        if (!prev) return allScenes[0];
        const curIdx = allScenes.findIndex((s) => s.id === prev.id);
        return allScenes[(curIdx + 1) % allScenes.length];
      });
      setDirection(1);
      setCurrentImgIdx(0);
      setCurrent360Idx(0);
    }, 5500);
    return () => clearInterval(interval);
  }, [autoTour, activePin, is360Active, allScenes]);

  useEffect(() => {
    setCurrentImgIdx(0);
    setCurrent360Idx(0);
    setActivePin(null);
    setIs360Active(false);
  }, [selectedScene?.id]);

  // 360 Auto-rotation
  useEffect(() => {
    if (!is360Active || isDragging) return;
    const interval = setInterval(() => {
      setPanX((p) => (p - 0.22) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, [is360Active, isDragging]);

  if (!selectedScene || allScenes.length === 0) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-surface/50 p-8 text-center text-mute space-y-2">
        <Compass size={32} className="mx-auto text-brand/60 animate-spin-slow" />
        <h3 className="text-base font-bold text-ink">Room Tour & 360 Exploration</h3>
        <p className="text-xs max-w-sm mx-auto">
          Add rooms with photos or 360 tours in the Admin Panel to explore rooms in high definition.
        </p>
      </div>
    );
  }

  const currentImage = selectedScene.allImages[currentImgIdx] || selectedScene.image;

  const handlePrevImage = () => {
    setDirection(-1);
    if (currentImgIdx > 0) {
      setCurrentImgIdx((i) => i - 1);
    } else if (selectedScene.allImages.length > 1) {
      setCurrentImgIdx(selectedScene.allImages.length - 1);
    }
  };

  const handleNextImage = () => {
    setDirection(1);
    if (currentImgIdx < selectedScene.allImages.length - 1) {
      setCurrentImgIdx((i) => i + 1);
    } else if (selectedScene.allImages.length > 1) {
      setCurrentImgIdx(0);
    }
  };

  // Cinematic 3D depth & blur slide variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "24%" : "-24%",
      opacity: 0,
      scale: 1.06,
      filter: "blur(12px) brightness(1.15)",
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px) brightness(1)",
      transition: {
        x: { type: "spring", stiffness: 280, damping: 28 },
        opacity: { duration: 0.38 },
        scale: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
        filter: { duration: 0.35 },
      },
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? "24%" : "-24%",
      opacity: 0,
      scale: 0.94,
      filter: "blur(10px)",
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    }),
  };

  const active360Url =
    (selectedScene.tour360Urls && selectedScene.tour360Urls[current360Idx]) ||
    selectedScene.tour360Url;

  return (
    <section
      className="card-3d relative overflow-hidden rounded-3xl border border-ink/10 bg-surface/90 backdrop-blur-xl shadow-[0_22px_55px_-12px_rgba(0,0,0,0.18),_inset_0_1px_1.5px_rgba(255,255,255,0.22)] transition-all"
      aria-label="Interactive Virtual Room Tour"
    >
      {/* Top Auto-Tour Progress Line */}
      {autoTour && !activePin && !is360Active && allScenes.length > 1 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/15 z-30 overflow-hidden">
          <motion.div
            key={selectedScene.id}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5.5, ease: "linear" }}
            className="h-full bg-gradient-to-r from-brand via-purple-500 to-amber-500"
          />
        </div>
      )}

      {/* ========================================================== */}
      {/* 1. TOP HEADER BAR: TITLE, PRICE & CONTROLS */}
      {/* ========================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3.5 sm:px-7 sm:py-4 bg-surface/95">
        <div>
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold text-brand">
              <Sparkles size={11} /> Interactive Visualizer
            </span>
            {selectedScene.isReal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Camera size={11} /> Verified Room
              </span>
            )}
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
              {selectedScene.tag}
            </span>
          </div>

          {/* Title & Price in one compact row */}
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h3 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
              {selectedScene.name}
            </h3>
            {selectedScene.rent != null && (
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-black text-brand tracking-tight">
                  {inr(selectedScene.rent)}
                </span>
                <span className="text-xs text-mute font-medium">
                  /{selectedScene.rentUnit === "per-bed" ? "bed" : "room"} per month
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 360 Panorama Button */}
          {selectedScene.tour360Url && (
            <button
              type="button"
              onClick={() => setIs360Active(!is360Active)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition shadow-sm border",
                is360Active
                  ? "bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/30"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
              )}
            >
              <Compass size={14} className={is360Active ? "animate-spin-slow" : ""} />
              <span>{is360Active ? "Exit 360 View" : "View 360° Panorama"}</span>
            </button>
          )}

          {/* Auto Tour Button */}
          {allScenes.length > 1 && !is360Active && (
            <button
              type="button"
              onClick={() => setAutoTour((a) => !a)}
              className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-bg/75 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-bg transition shadow-xs"
            >
              {autoTour ? <Pause size={12} className="text-emerald-500" /> : <Play size={12} className="text-amber-500" />}
              <span className="hidden sm:inline">{autoTour ? "Auto Tour ON" : "Tour Paused"}</span>
            </button>
          )}

          {/* Day / Evening Switch */}
          {!is360Active && (
            <div className="flex items-center rounded-full border border-ink/15 bg-bg/75 p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setNightMode(false)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition",
                  !nightMode
                    ? "bg-amber-400/20 text-amber-500 shadow-xs font-bold"
                    : "text-mute hover:text-ink"
                )}
              >
                <Sun size={13} /> Day
              </button>
              <button
                type="button"
                onClick={() => setNightMode(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition",
                  nightMode
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "text-mute hover:text-ink"
                )}
              >
                <Moon size={13} /> Evening
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 2. COMPACT CINEMATIC VIEWER (Controlled Height, not gigantic) */}
      {/* ========================================================== */}
      <div className="relative h-[340px] sm:h-[420px] lg:h-[450px] w-full overflow-hidden bg-black/95 select-none">
        {is360Active && active360Url ? (
          /* 360 PANORAMA MODE */
          <div
            className="relative h-full w-full overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              setIsDragging(true);
              setDragStartX(e.clientX - panX * 10);
            }}
            onMouseMove={(e) => {
              if (!isDragging) return;
              setPanX((e.clientX - dragStartX) / 10);
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchStart={(e) => {
              setIsDragging(true);
              setDragStartX(e.touches[0].clientX - panX * 10);
            }}
            onTouchMove={(e) => {
              if (!isDragging) return;
              setPanX((e.touches[0].clientX - dragStartX) / 10);
            }}
            onTouchEnd={() => setIsDragging(false)}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform ease-out"
              style={{
                backgroundImage: `url(${active360Url})`,
                backgroundPosition: `${panX}% 50%`,
                backgroundRepeat: "repeat-x",
                transform: "scale(1.06)",
              }}
            />
            <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
              <Compass size={14} className="text-amber-400 animate-spin-slow" />
              <span>Drag / Swipe anywhere to look around 360°</span>
            </div>

            {/* Multiple 360 Scenes Switcher Bar */}
            {selectedScene.tour360Urls && selectedScene.tour360Urls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/80 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-xl">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider mr-1 hidden sm:inline">
                  360° Scenes:
                </span>
                {selectedScene.tour360Urls.map((_, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrent360Idx(sIdx);
                      setPanX(0);
                    }}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-bold transition",
                      current360Idx === sIdx
                        ? "bg-amber-500 text-white shadow scale-105"
                        : "bg-white/20 text-white hover:bg-white/30"
                    )}
                  >
                    Scene {sIdx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* UNIQUE CINEMATIC SLIDE VIEWER */
          <>
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={`${selectedScene.id}-${currentImgIdx}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 h-full w-full"
              >
                <img
                  src={currentImage}
                  alt={selectedScene.name}
                  className={cn(
                    "h-full w-full object-cover transition-all duration-700",
                    nightMode
                      ? "brightness-[0.78] contrast-[1.10] saturate-[1.25]"
                      : "brightness-100 contrast-100"
                  )}
                />

                {/* Night mode soft warm lighting overlay */}
                {nightMode && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-amber-950/40 via-transparent to-indigo-950/30 mix-blend-color-burn"
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Subtle Gradient Overlays */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

            {/* Left and Right Nav Arrows */}
            {selectedScene.allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-lg"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-lg"
                  aria-label="Next Slide"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Top-Left Camera Badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className="flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white/95 backdrop-blur-md border border-white/15">
                <Camera size={12} className="text-brand" /> {currentImgIdx + 1} / {selectedScene.allImages.length}
              </span>
            </div>

            {/* Top-Right Pins Toggle */}
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={() => setShowHotspots(!showHotspots)}
                className="flex items-center gap-1 rounded-full bg-black/65 hover:bg-black/85 px-2.5 py-1 text-[11px] font-bold text-white/95 backdrop-blur-md border border-white/15 transition"
              >
                <MapPin size={12} className={showHotspots ? "text-brand" : "text-white/60"} />
                <span>{showHotspots ? "Pins ON" : "Pins OFF"}</span>
              </button>
            </div>

            {/* INTERACTIVE HOTSPOTS RADAR PINS */}
            {showHotspots && selectedScene.hotspots.map((pin) => {
              const isActive = activePin?.id === pin.id;
              return (
                <div
                  key={pin.id}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePin(isActive ? null : pin);
                    }}
                    className="relative group flex items-center justify-center focus:outline-none"
                    aria-label={`Inspect ${pin.title}`}
                  >
                    <span className="absolute h-6 w-6 rounded-full bg-brand/30 animate-ping pointer-events-none" />
                    <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white shadow-lg border-2 border-white transition-transform group-hover:scale-125">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                  </button>

                  {/* Hotspot Popover Tooltip */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 6 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 sm:w-64 rounded-xl border border-white/20 bg-black/85 p-3 text-left text-white shadow-2xl backdrop-blur-xl z-30 pointer-events-auto"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="text-xs font-bold text-amber-300">{pin.title}</h4>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePin(null);
                            }}
                            className="text-white/60 hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-[10.5px] leading-relaxed text-white/80 mb-1.5">{pin.detail}</p>
                        <span className="inline-block rounded bg-brand/30 px-1.5 py-0.5 text-[9.5px] font-semibold text-brand">
                          {pin.spec}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Bottom Photo Indicator Dots */}
            {selectedScene.allImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/55 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                {selectedScene.allImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setDirection(i > currentImgIdx ? 1 : -1);
                      setCurrentImgIdx(i);
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === currentImgIdx
                        ? "w-5 bg-brand shadow-xs"
                        : "w-1.5 bg-white/40 hover:bg-white/80"
                    )}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================== */}
      {/* 3. BOTTOM ROOM SELECTOR CARDS GALLERY ("Select Room Type") */}
      {/* ========================================================== */}
      {allScenes.length > 1 && (
        <div className="border-t border-ink/10 bg-surface/95 p-3.5 sm:px-6 sm:py-4">
          <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-mute mb-2">
            Select Room Type to Inspect:
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 md:grid-cols-6 sm:overflow-visible">
            {allScenes.map((scene) => {
              const isSelected = selectedScene.id === scene.id;
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => {
                    setSelectedScene(scene);
                    setActivePin(null);
                    setIs360Active(false);
                  }}
                  className={cn(
                    "group relative flex flex-col items-start overflow-hidden rounded-xl border p-2 text-left transition-all shrink-0 w-32 sm:w-auto",
                    isSelected
                      ? "border-brand bg-brand/10 shadow-sm ring-1 ring-brand/30 scale-[1.02]"
                      : "border-ink/10 bg-surface hover:border-ink/25 hover:bg-ink/5"
                  )}
                >
                  {scene.tour360Url && (
                    <span className="absolute top-2.5 right-2.5 z-10 rounded bg-amber-500 px-1 py-0.5 text-[8px] font-bold text-white shadow-xs">
                      360°
                    </span>
                  )}
                  <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-black/10">
                    <img
                      loading="lazy"
                      decoding="async"
                      src={scene.image || "/favicon.svg"}
                      alt={scene.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <span
                    className={cn(
                      "mt-1.5 block font-bold text-xs truncate w-full",
                      isSelected ? "text-brand" : "text-ink"
                    )}
                  >
                    {scene.name}
                  </span>
                  <div className="flex items-center justify-between w-full mt-0.5">
                    <span className="text-[9.5px] text-mute truncate">{scene.tag}</span>
                    {scene.rent != null && (
                      <span className="text-[9.5px] font-bold text-brand">{inr(scene.rent)}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
