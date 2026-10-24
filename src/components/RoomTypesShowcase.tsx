"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Camera,
  Compass,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Maximize2,
  ShieldCheck,
  Zap,
  BedDouble,
  Wind,
  Layers,
  ArrowRight,
  ExternalLink,
  Eye,
  RotateCw,
  ImageIcon
} from "lucide-react";
import type { Room } from "@/lib/types";
import { ROOM_LABEL } from "@/lib/site";
import { inr, fmtDate, cn } from "@/lib/utils";

interface Props {
  rooms: Room[];
  propertyName: string;
  propertySlug: string;
}

export default function RoomTypesShowcase({ rooms, propertyName, propertySlug }: Props) {
  const [activeModalRoom, setActiveModalRoom] = useState<Room | null>(null);
  const [modalTab, setModalTab] = useState<"photos" | "360">("360");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [current360Index, setCurrent360Index] = useState(0);

  // 360 viewer state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [panX, setPanX] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  const openRoomModal = (room: Room, defaultTab: "photos" | "360" = "360") => {
    setActiveModalRoom(room);
    setModalTab(defaultTab);
    setCurrentImageIndex(0);
    setCurrent360Index(0);
    setPanX(0);
    setAutoRotate(true);
  };

  const closeModal = () => {
    setActiveModalRoom(null);
  };

  // Auto rotation effect for 360 panorama
  useEffect(() => {
    if (!autoRotate || isDragging || modalTab !== "360") return;
    const interval = setInterval(() => {
      setPanX((prev) => (prev - 0.25) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging, modalTab]);

  // Touch and drag handlers for 360 panorama
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX - panX * 10);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = (e.clientX - dragStartX) / 10;
    setPanX(delta);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX - panX * 10);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = (e.touches[0].clientX - dragStartX) / 10;
    setPanX(delta);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSelectRoomForInquiry = (room: Room) => {
    closeModal();
    const formElem = document.getElementById("inquiry-sidebar");
    if (formElem) {
      formElem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!rooms || rooms.length === 0) {
    return (
      <section aria-labelledby="cost" className="mt-12 card p-8 text-center text-mute">
        <BedDouble size={36} className="mx-auto text-brand mb-2" />
        <h3 className="text-lg font-bold text-ink">Room Details</h3>
        <p className="text-xs">No specific room configurations listed yet.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="cost" className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand uppercase tracking-wider">
              <Sparkles size={12} /> Transparent Pricing
            </span>
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
              Room-wise Photos & 360° Tours
            </span>
          </div>
          <h2 id="cost" className="text-2xl font-black text-ink sm:text-3xl mt-1">
            Available Room Types & Transparent Pricing
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-mute">
            Select any room to inspect room photos, amenities, and 360° virtual tour.
          </p>
        </div>
      </div>

      {/* =========================================================================
          1. DESKTOP VIEW: Sleek Royal Table with Room Photo Thumbnail & 360 Trigger
          ========================================================================= */}
      <div className="hidden lg:block overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 border-b border-ink/10 text-mute uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-4 px-5">Room Type & Photos</th>
                <th className="py-4 px-4">Climate Control</th>
                <th className="py-4 px-4">Monthly Rent</th>
                <th className="py-4 px-4">Security Deposit</th>
                <th className="py-4 px-5">Included Living Inclusions</th>
                <th className="py-4 px-4">Availability</th>
                <th className="py-4 px-5 text-right">Interactive Tour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {rooms.map((room) => {
                const photos = room.images || [];
                const cover = photos[0];
                const has360 = !!room.tour360Url || (room.tour360Urls && room.tour360Urls.length > 0);

                return (
                  <tr key={room.id} className="hover:bg-ink/5 transition-colors group">
                    {/* Room Thumbnail & Title */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        {cover ? (
                          <button
                            type="button"
                            onClick={() => openRoomModal(room, "photos")}
                            className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-ink/15 bg-black/10 group-hover:ring-2 group-hover:ring-brand transition-all cursor-pointer shadow-sm"
                            title="Click to view room photos"
                          >
                            <img
                              src={cover}
                              alt={ROOM_LABEL[room.type] || room.type}
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <span className="absolute bottom-1 right-1 rounded-md bg-black/75 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold text-white">
                              {photos.length} 📸
                            </span>
                          </button>
                        ) : (
                          <div className="h-14 w-20 shrink-0 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                            <BedDouble size={22} />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-base text-ink block group-hover:text-brand transition-colors">
                            {ROOM_LABEL[room.type] || room.type}
                          </span>
                          {room.description && (
                            <span className="text-xs text-mute line-clamp-1 max-w-[240px]">
                              {room.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* AC */}
                    <td className="py-4 px-4">
                      {room.ac ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-400">
                          <Wind size={13} /> 5-Star AC
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-mute">
                          Non-AC Room
                        </span>
                      )}
                    </td>

                    {/* Rent */}
                    <td className="py-4 px-4">
                      {room.rent != null ? (
                        <div>
                          <span className="font-extrabold text-base text-brand">
                            {inr(room.rent)}
                          </span>
                          <span className="block text-[11px] text-mute font-medium">
                            {room.rentUnit === "per-bed" ? "per bed / mo" : "per room / mo"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-warn font-semibold">Pricing on call</span>
                      )}
                    </td>

                    {/* Deposit */}
                    <td className="py-4 px-4">
                      {room.deposit != null ? (
                        <div>
                          <span className="font-bold text-ink">{inr(room.deposit)}</span>
                          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% Refundable</span>
                        </div>
                      ) : (
                        <span className="text-xs text-mute">—</span>
                      )}
                    </td>

                    {/* Included Inclusions */}
                    <td className="py-4 px-5 text-xs text-mute max-w-[280px]">
                      {room.included && room.included.length > 0 ? (
                        <span className="line-clamp-2 leading-relaxed">{room.included.join(", ")}</span>
                      ) : (
                        <span className="leading-relaxed">Wi-Fi, 3 Daily Meals & Daily Housekeeping</span>
                      )}
                    </td>

                    {/* Availability */}
                    <td className="py-3.5 px-4">
                      {room.availability === "now" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Available Now
                        </span>
                      ) : room.availability === "from-date" && room.availableFrom ? (
                        <span className="inline-flex rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-bold text-brand">
                          From {fmtDate(room.availableFrom)}
                        </span>
                      ) : (
                        <span className="text-xs text-mute font-medium">Inquire Vacancy</span>
                      )}
                    </td>

                    {/* Interactive 360 Tour Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openRoomModal(room, has360 ? "360" : "photos")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-brand/30 bg-brand/10 hover:bg-brand hover:text-white px-3.5 py-2 text-xs font-bold text-brand shadow-sm transition-all active:scale-95"
                      >
                        {has360 ? (
                          <>
                            <Compass size={14} className="animate-spin-slow" />
                            <span>360° & Photos</span>
                          </>
                        ) : (
                          <>
                            <Camera size={14} />
                            <span>Photos ({photos.length})</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          2. MOBILE & TABLET VIEW: Responsive Card Stack (Zero Text Clipping!)
          ========================================================================= */}
      <div className="grid gap-4 lg:hidden sm:grid-cols-2">
        {rooms.map((room) => {
          const photos = room.images || [];
          const cover = photos[0];
          const has360 = !!room.tour360Url || (room.tour360Urls && room.tour360Urls.length > 0);

          return (
            <div
              key={room.id}
              className="card overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-lg flex flex-col justify-between w-full"
            >
              {/* Room Header Image */}
              <div
                className="relative aspect-[16/9] w-full overflow-hidden bg-black/20 cursor-pointer group"
                onClick={() => openRoomModal(room, has360 ? "360" : "photos")}
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={ROOM_LABEL[room.type] || room.type}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full bg-brand/10 flex flex-col items-center justify-center text-brand gap-1">
                    <BedDouble size={32} />
                    <span className="text-xs font-semibold">{ROOM_LABEL[room.type] || room.type}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                {/* Top badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/20">
                    {ROOM_LABEL[room.type] || room.type}
                  </span>
                  {room.ac && (
                    <span className="rounded-full bg-sky-500/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                      <Wind size={10} /> AC
                    </span>
                  )}
                </div>

                {has360 && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-300/30 flex items-center gap-1">
                      <Compass size={11} className="animate-spin-slow" /> 360° Tour
                    </span>
                  </div>
                )}

                {/* Bottom Photo Count */}
                {photos.length > 0 && (
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Camera size={11} /> {photos.length} Photos
                  </div>
                )}

                {/* Availability bottom left */}
                <div className="absolute bottom-2.5 left-2.5">
                  {room.availability === "now" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white">
                      ● Available Now
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-brand/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white">
                      Inquire Dates
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xl font-black text-brand">
                        {room.rent != null ? inr(room.rent) : "On Call"}
                      </span>
                      <span className="text-[11px] text-mute ml-1">
                        /{room.rentUnit === "per-bed" ? "bed" : "room"} / mo
                      </span>
                    </div>
                    {room.deposit != null && (
                      <div className="text-right">
                        <span className="text-xs font-semibold text-ink">Deposit: {inr(room.deposit)}</span>
                        <span className="block text-[9px] text-emerald-600 font-bold">100% Refundable</span>
                      </div>
                    )}
                  </div>

                  {room.description && (
                    <p className="text-xs text-mute mt-2 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>
                  )}

                  {/* Included chips */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(room.included && room.included.length > 0
                      ? room.included
                      : ["Wi-Fi", "3 Meals", "Daily Housekeeping"]
                    ).map((inc, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-ink/5 border border-ink/10 px-2 py-0.5 text-[10px] font-medium text-mute"
                      >
                        ✓ {inc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2 border-t border-ink/10 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openRoomModal(room, has360 ? "360" : "photos")}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-brand/30 bg-brand/10 py-2.5 text-xs font-bold text-brand hover:bg-brand hover:text-white transition"
                  >
                    <Compass size={13} />
                    <span>{has360 ? "360° Tour" : "Room View"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openRoomModal(room, "photos")}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-ink/5 py-2.5 text-xs font-bold text-ink hover:bg-ink/10 transition"
                  >
                    <Camera size={13} />
                    <span>Photos ({photos.length})</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          3. FULL-SCREEN INTERACTIVE ROOM 360° TOUR & PHOTO MODAL
          ========================================================================= */}
      <AnimatePresence>
        {activeModalRoom && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative flex flex-col h-[90vh] max-h-[850px] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/20 bg-surface shadow-2xl text-ink"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-ink/10 p-4 sm:px-6 bg-surface/95 z-10">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <BedDouble size={20} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-ink">
                        {ROOM_LABEL[activeModalRoom.type] || activeModalRoom.type}
                      </h3>
                      {activeModalRoom.ac && (
                        <span className="rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 text-[10px]">
                          5-Star AC
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-mute truncate max-w-xs sm:max-w-md">
                      {propertyName} · {activeModalRoom.rent != null ? `${inr(activeModalRoom.rent)}/mo` : "Available"}
                    </p>
                  </div>
                </div>

                {/* Tab Switcher & Close */}
                {(() => {
                  const tour360List =
                    activeModalRoom.tour360Urls && activeModalRoom.tour360Urls.length > 0
                      ? activeModalRoom.tour360Urls
                      : activeModalRoom.tour360Url
                      ? [activeModalRoom.tour360Url]
                      : [];
                  const has360InModal = tour360List.length > 0;

                  return (
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-xl bg-ink/5 p-1 border border-ink/5">
                        {has360InModal && (
                          <button
                            type="button"
                            onClick={() => setModalTab("360")}
                            className={cn(
                              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                              modalTab === "360"
                                ? "bg-brand text-white shadow-sm"
                                : "text-mute hover:text-ink"
                            )}
                          >
                            <Compass size={13} />
                            <span className="hidden sm:inline">
                              360° Tour {tour360List.length > 1 ? `(${tour360List.length})` : ""}
                            </span>
                            <span className="sm:hidden">360°</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setModalTab("photos")}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                            modalTab === "photos" || !has360InModal
                              ? "bg-brand text-white shadow-sm"
                              : "text-mute hover:text-ink"
                          )}
                        >
                          <Camera size={13} />
                          <span className="hidden sm:inline">Room Photos</span>
                          <span className="sm:hidden">Photos</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/10 text-ink hover:bg-ink/20 transition"
                        aria-label="Close modal"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Body */}
              <div className="relative flex-1 overflow-hidden bg-black/95">
                {(() => {
                  const tour360List =
                    activeModalRoom.tour360Urls && activeModalRoom.tour360Urls.length > 0
                      ? activeModalRoom.tour360Urls
                      : activeModalRoom.tour360Url
                      ? [activeModalRoom.tour360Url]
                      : [];
                  const active360Url = tour360List[current360Index] || tour360List[0];

                  if (modalTab === "360" && active360Url) {
                    return (
                      /* 360 INTERACTIVE PANORAMA VIEWER */
                      <div
                        className="relative h-full w-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        {/* The 360 equirectangular panorama layer */}
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform ease-out"
                          style={{
                            backgroundImage: `url(${active360Url})`,
                            backgroundPosition: `${panX}% 50%`,
                            backgroundRepeat: "repeat-x",
                            transform: "scale(1.08)",
                          }}
                        />

                        {/* Ambient Vignette Overlay */}
                        <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

                        {/* Interactive 360 Overlay Controls */}
                        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
                          <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
                            <Compass size={14} className="text-amber-400 animate-spin-slow" />
                            <span>Drag / Swipe anywhere to rotate 360°</span>
                          </span>
                        </div>

                        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAutoRotate((a) => !a)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-md transition border",
                              autoRotate
                                ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                                : "bg-black/60 text-white border-white/20"
                            )}
                          >
                            <RotateCw size={13} className={autoRotate ? "animate-spin-slow" : ""} />
                            <span>{autoRotate ? "Auto-Rotate ON" : "Rotate Paused"}</span>
                          </button>
                        </div>

                        {/* Multiple 360 scenes switch bar */}
                        {tour360List.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/75 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-xl">
                            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider mr-1 hidden sm:inline">
                              360° Scenes:
                            </span>
                            {tour360List.map((_, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrent360Index(sIdx);
                                  setPanX(0);
                                }}
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-xs font-bold transition",
                                  current360Index === sIdx
                                    ? "bg-amber-500 text-white shadow-md scale-105"
                                    : "bg-white/20 text-white hover:bg-white/30"
                                )}
                              >
                                View {sIdx + 1}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* External Tour Link (if Matterport or external 360 provided) */}
                        {active360Url.startsWith("http") && (
                          <div className="absolute bottom-4 left-4 z-20">
                            <a
                              href={active360Url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 rounded-full bg-brand/90 px-3.5 py-1.5 text-xs font-bold text-white shadow-xl hover:bg-brand transition"
                            >
                              <ExternalLink size={13} /> Open External 3D Tour
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                  /* ROOM PHOTOS GALLERY SLIDER */
                  <div className="relative h-full w-full flex flex-col justify-between">
                    {(() => {
                      const photos = activeModalRoom.images || [];
                      if (photos.length === 0) {
                        return (
                          <div className="h-full w-full flex flex-col items-center justify-center text-white/70 p-8 text-center space-y-3">
                            <ImageIcon size={48} className="text-brand/50" />
                            <h4 className="text-lg font-bold text-white">No Photos Uploaded Yet</h4>
                            <p className="text-xs text-white/50 max-w-sm">
                              Photos for this room type will appear here once uploaded in the Admin Panel.
                            </p>
                          </div>
                        );
                      }

                      const activeImg = photos[currentImageIndex] || photos[0];

                      return (
                        <>
                          <div className="relative flex-1 overflow-hidden flex items-center justify-center p-4">
                            <motion.img
                              key={activeImg}
                              src={activeImg}
                              alt={`${ROOM_LABEL[activeModalRoom.type] || activeModalRoom.type} Photo ${currentImageIndex + 1}`}
                              initial={{ opacity: 0.8, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                            />

                            {/* Previous / Next Arrow Controls */}
                            {photos.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                                  className="absolute left-6 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition"
                                  aria-label="Previous Photo"
                                >
                                  <ChevronLeft size={22} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % photos.length)}
                                  className="absolute right-6 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition"
                                  aria-label="Next Photo"
                                >
                                  <ChevronRight size={22} />
                                </button>
                              </>
                            )}

                            {/* Photo counter */}
                            <div className="absolute bottom-4 left-6 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                              {currentImageIndex + 1} / {photos.length}
                            </div>
                          </div>

                          {/* Bottom Thumbnail Strip */}
                          {photos.length > 1 && (
                            <div className="border-t border-white/10 bg-black/50 p-3 sm:px-6 flex items-center gap-2 overflow-x-auto">
                              {photos.map((img, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={cn(
                                    "relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition",
                                    currentImageIndex === idx
                                      ? "border-brand ring-2 ring-brand/40 scale-105"
                                      : "border-transparent opacity-60 hover:opacity-100"
                                  )}
                                >
                                  <img
                                    src={img}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                );
              })()}
              </div>

              {/* Modal Bottom Action Bar */}
              <div className="border-t border-ink/10 bg-surface p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-mute font-bold block">
                    Starting Monthly Rent
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-brand">
                      {activeModalRoom.rent != null ? inr(activeModalRoom.rent) : "Pricing on Request"}
                    </span>
                    <span className="text-xs text-mute">
                      /{activeModalRoom.rentUnit === "per-bed" ? "bed" : "room"} (All meals & utilities included)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn btn-ghost text-xs py-2.5 px-4"
                  >
                    Close Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectRoomForInquiry(activeModalRoom)}
                    className="btn btn-primary text-xs py-2.5 px-5 gap-2 font-bold shadow-lg shadow-brand/25"
                  >
                    <span>Inquire / Book This Room</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
