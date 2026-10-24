"use client";
import Link from "next/link";
import { MapPin, Train, Plus, Check, BadgeCheck, Compass, ArrowRight } from "lucide-react";
import type { Property } from "@/lib/types";
import { ROOM_LABEL } from "@/lib/site";
import { inr, rentRange } from "@/lib/utils";
import { useCompare } from "./Compare";
import FacilityIcon from "./FacilityIcon";
import SpotlightCard from "./SpotlightCard";
import { cn } from "@/lib/utils";

interface PGCardProps {
  p: Property;
  areaName: string;
  rooms?: Property["rooms"];
  className?: string;
  isSliderItem?: boolean;
}

export default function PGCard({
  p,
  areaName,
  rooms,
  className,
  isSliderItem = false,
}: PGCardProps) {
  const { has, toggle, ids } = useCompare();
  const currentRooms = rooms ?? p.rooms ?? [];
  const r = rentRange(currentRooms);
  const types = Array.from(new Set(currentRooms.map((x) => x.type)));
  const on = has(p.slug);
  const cover = p.media && p.media.length > 0 ? p.media[0] : null;
  const incl = p.facilities.filter((f) => f.status === "included").slice(0, 4);
  const has360 = currentRooms.some((rm) => rm.tour360Url || (rm.tour360Urls && rm.tour360Urls.length > 0));

  return (
    <SpotlightCard
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-ink/10 bg-surface shadow-md hover:border-brand/40 hover:shadow-xl transition-all duration-300 w-full",
        isSliderItem && "w-[85vw] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none",
        className
      )}
    >
      {/* Cover Image */}
      <Link
        href={`/pg/${p.slug}`}
        className="relative block aspect-[16/10] overflow-hidden bg-black/10 [transform-style:preserve-3d]"
        tabIndex={-1}
        aria-hidden="true"
      >
        {cover ? (
          <img
            src={cover.url}
            alt={`${p.name} PG accommodation`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-brand/10 flex flex-col items-center justify-center text-xs text-brand/70 font-semibold gap-1">
            <span>{p.name}</span>
          </div>
        )}

        {/* Floating 3D Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none z-10 [transform:translateZ(26px)]">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md backdrop-blur-md border border-white/20",
              p.gender === "girls" ? "bg-pink-600/90" : "bg-sky-600/90"
            )}
          >
            {p.gender === "girls" ? "Girls PG" : "Boys PG"}
          </span>

          {has360 && (
            <span className="rounded-full bg-black/80 border border-amber-300/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 shadow-md backdrop-blur-md flex items-center gap-1">
              <Compass size={11} className="animate-spin-slow text-amber-400" /> 360°
            </span>
          )}
        </div>
      </Link>

      {/* Content Details */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold leading-snug">
              <Link href={`/pg/${p.slug}`} className="hover:text-brand transition line-clamp-1">
                {p.name}
              </Link>
            </h3>
            {p.verified && (
              <span className="shrink-0 text-emerald-500" title="Verified Property">
                <BadgeCheck size={16} />
              </span>
            )}
          </div>

          <p className="mt-1 flex items-center gap-1 text-xs text-mute">
            <MapPin size={12} className="text-brand shrink-0" aria-hidden="true" />
            <span className="truncate">{areaName || p.area}</span>
          </p>
        </div>

        {/* Price Tag */}
        <div className="pt-0.5">
          {r ? (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-xl sm:text-2xl font-black text-brand tracking-tight">{inr(r.min)}</span>
              <span className="text-[11px] text-mute font-medium whitespace-nowrap">
                / mo{r.max !== r.min ? ` - ${inr(r.max)}` : ""} · per bed
              </span>
            </div>
          ) : (
            <span className="text-xs text-mute font-medium">Pricing on request</span>
          )}
        </div>

        {/* Room Types Badges */}
        {types.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Room types">
            {types.map((t) => (
              <li
                key={t}
                className="rounded-full bg-ink/5 border border-ink/5 px-2.5 py-0.5 text-[10.5px] font-semibold text-ink/80"
              >
                {ROOM_LABEL[t] || t}
              </li>
            ))}
          </ul>
        )}

        {/* Included Amenities List */}
        {incl.length > 0 && (
          <ul
            className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-mute"
            aria-label="Included facilities"
          >
            {incl.map((f) => (
              <li key={f.key} className="inline-flex items-center gap-1 shrink-0">
                <FacilityIcon k={f.key} size={11} className="text-accent shrink-0" />
                <span>{f.name}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Nearest Metro Station */}
        {p.metro && (
          <p className="flex items-center gap-1.5 text-[11px] text-mute min-w-0 border-t border-ink/5 pt-2">
            <Train size={12} className="text-brand shrink-0" aria-hidden="true" />
            <span className="truncate" title={`${p.metro.station}: ${p.metro.distanceKm} km`}>
              {p.metro.station}: {p.metro.distanceKm} km
            </span>
          </p>
        )}

        {/* Bottom Actions Row */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-ink/10">
          <Link
            href={`/pg/${p.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
          >
            <span>View Rooms</span>
            <ArrowRight size={12} />
          </Link>

          <button
            onClick={() => toggle(p.slug, p.name)}
            aria-pressed={on}
            disabled={!on && ids.length >= 3}
            className="chip py-1 px-3 text-[11px] disabled:opacity-40"
            data-on={on}
          >
            {on ? <Check size={12} /> : <Plus size={12} />} Compare
          </button>
        </div>
      </div>
    </SpotlightCard>
  );
}
