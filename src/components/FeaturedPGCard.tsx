"use client";
import Link from "next/link";
import {
  MapPin,
  Train,
  BadgeCheck,
  Compass,
  ArrowRight,
  Wifi,
  Utensils,
  Sparkles,
  Camera,
  Layers
} from "lucide-react";
import type { Property } from "@/lib/types";
import { ROOM_LABEL } from "@/lib/site";
import { inr, rentRange, cn } from "@/lib/utils";
import SpotlightCard from "./SpotlightCard";

interface FeaturedPGCardProps {
  p: Property;
  areaName: string;
  className?: string;
}

export default function FeaturedPGCard({ p, areaName, className }: FeaturedPGCardProps) {
  const currentRooms = p.rooms || [];
  const r = rentRange(currentRooms);
  const types = Array.from(new Set(currentRooms.map((x) => x.type)));
  const cover = p.media && p.media.length > 0 ? p.media[0] : null;
  const has360 = currentRooms.some(
    (rm) => rm.tour360Url || (rm.tour360Urls && rm.tour360Urls.length > 0)
  );
  const totalPhotos = p.media?.length || 0;

  // Check if any room is currently available
  const isAvailableNow = currentRooms.some((rm) => rm.availability === "now");

  return (
    <SpotlightCard
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-md hover:border-brand/40 hover:shadow-2xl transition-all duration-300 w-full",
        className
      )}
    >
      {/* Top Image Box */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/10">
        <Link href={`/pg/${p.slug}`} className="block h-full w-full" tabIndex={-1}>
          {cover ? (
            <img
              src={cover.url}
              alt={`${p.name} luxury accommodation`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand/20 to-purple-500/20 flex flex-col items-center justify-center text-xs text-brand font-bold gap-1">
              <Sparkles size={24} />
              <span>{p.name}</span>
            </div>
          )}
        </Link>

        {/* Ambient Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Top Badges Bar - 3D Parallax Floating Layer */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none z-10 [transform:translateZ(26px)]">
          {/* Gender Badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold text-white shadow-lg backdrop-blur-md border",
              p.gender === "girls"
                ? "bg-pink-600/95 border-pink-400/40 shadow-pink-900/30"
                : "bg-sky-600/95 border-sky-400/40 shadow-sky-900/30"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {p.gender === "girls" ? "Girls Residence" : "Boys Residence"}
          </span>

          {/* 360 Tour Pill */}
          {has360 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-extrabold text-amber-300 shadow-lg backdrop-blur-md border border-amber-300/40">
              <Compass size={11} className="animate-spin-slow text-amber-400" />
              <span>360° Tour</span>
            </span>
          )}
        </div>

        {/* Bottom Image Bar (Price & Photo Count) - 3D Parallax Floating Layer */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-end justify-between gap-2 pointer-events-none z-10 [transform:translateZ(24px)]">
          {/* Starting Price Glass Pill */}
          <div className="rounded-xl bg-black/80 backdrop-blur-md border border-white/20 px-2.5 py-1 text-white shadow-xl">
            <span className="block text-[9px] uppercase tracking-wider text-white/70 font-semibold leading-none">
              Starts At
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-extrabold text-sm sm:text-base text-amber-400 tracking-tight leading-none">
                {r ? inr(r.min) : "On Request"}
              </span>
              <span className="text-[9.5px] text-white/70 font-medium">/mo</span>
            </div>
          </div>

          {/* Photo Count Pill */}
          {totalPhotos > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md border border-white/10">
              <Camera size={11} /> {totalPhotos}
            </span>
          )}
        </div>
      </div>

      {/* Card Content Details */}
      <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
        <div>
          {/* Title & Verified Badge */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-sm sm:text-base text-ink leading-snug line-clamp-1 group-hover:text-brand transition-colors">
              <Link href={`/pg/${p.slug}`} title={p.name}>
                {p.name}
              </Link>
            </h3>
            {p.verified && (
              <span
                className="inline-flex items-center text-emerald-500 shrink-0 mt-0.5"
                title="100% Verified Property"
              >
                <BadgeCheck size={16} />
              </span>
            )}
          </div>

          {/* Area & Metro Info */}
          <p className="mt-1 flex items-center gap-1.5 text-xs text-mute flex-wrap">
            <span className="inline-flex items-center gap-1 font-medium">
              <MapPin size={12} className="text-brand shrink-0" />
              <span className="truncate max-w-[120px]">{areaName || p.area}</span>
            </span>
            {p.metro && (
              <span className="inline-flex items-center gap-1 text-[11px] text-accent font-semibold">
                · <Train size={11} className="shrink-0" /> {p.metro.distanceKm} km
              </span>
            )}
          </p>
        </div>

        {/* Room Sharing Pills */}
        {types.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {types.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-lg bg-ink/5 border border-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/80"
              >
                {ROOM_LABEL[t] || t}
              </span>
            ))}
            {types.length > 3 && (
              <span className="rounded-lg bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold text-mute">
                +{types.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="pt-2.5 border-t border-ink/10 flex items-center justify-between gap-2">
          {/* Availability Status */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isAvailableNow ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )}
            />
            <span className="text-[11px] font-bold text-ink">
              {isAvailableNow ? "Available Now" : "Few Beds Left"}
            </span>
          </div>

          {/* Direct Room Link */}
          <Link
            href={`/pg/${p.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand group-hover:translate-x-0.5 transition-transform"
          >
            <span>Inspect</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </SpotlightCard>
  );
}
