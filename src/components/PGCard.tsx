"use client";
import Link from "next/link";
import { MapPin, Train, Plus, Check, BadgeCheck } from "lucide-react";
import type { Property } from "@/lib/types";
import { ROOM_LABEL } from "@/lib/site";
import { inr, rentRange } from "@/lib/utils";
import { useCompare } from "./Compare";
import FacilityIcon from "./FacilityIcon";
import SpotlightCard from "./SpotlightCard";
import { cn } from "@/lib/utils";

export default function PGCard({ p, areaName, rooms }: { p: Property; areaName: string; rooms?: Property["rooms"] }) {
  const { has, toggle, ids } = useCompare();
  const r = rentRange(rooms ?? p.rooms);
  const types = Array.from(new Set((rooms ?? p.rooms).map((x) => x.type)));
  const on = has(p.slug);
  const cover = p.media[0];
  const incl = p.facilities.filter((f) => f.status === "included").slice(0, 5);

  return (
    <SpotlightCard className="group flex h-full flex-col overflow-hidden">
      <Link href={`/pg/${p.slug}`} className="relative block aspect-[16/10] overflow-hidden" tabIndex={-1} aria-hidden="true">
        {cover ? (
          <img src={cover.url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : <div className="h-full w-full bg-brand/20" />}
        <span className={cn("absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white backdrop-blur", p.gender === "girls" ? "bg-pink-600/80" : "bg-sky-600/80")}>
          {p.gender === "girls" ? "Girls PG" : "Boys PG"}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-lg font-semibold leading-snug"><Link href={`/pg/${p.slug}`} className="hover:text-brand">{p.name}</Link></h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-mute"><MapPin size={14} aria-hidden="true" />{areaName}</p>
        </div>
        <p className="text-sm">
          {r ? <><span className="text-xl font-bold">{inr(r.min)}</span><span className="text-mute"> / month{r.max !== r.min ? ` onwards` : ""} · per bed</span></> : <span className="text-mute">Rent to be confirmed</span>}
        </p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Room types">
          {types.map((t) => <li key={t} className="rounded-full bg-ink/5 px-2.5 py-1 text-xs text-mute">{ROOM_LABEL[t]}</li>)}
        </ul>
        {incl.length > 0 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-mute" aria-label="Included facilities">
            {incl.map((f) => <li key={f.key} className="inline-flex items-center gap-1"><FacilityIcon k={f.key} size={13} className="text-accent" />{f.name}</li>)}
          </ul>
        )}
        {p.metro && (
          <p className="flex items-center gap-1.5 text-xs text-mute"><Train size={14} aria-hidden="true" />{p.metro.station}: {p.metro.distanceKm} km ({p.metro.method === "route" ? "route" : "straight-line"})</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className={cn("inline-flex items-center gap-1 text-xs", p.verified ? "text-ok" : "text-warn")}>
            {p.verified ? <><BadgeCheck size={14} /> Owner verified</> : "Details pending verification"}
          </span>
          <button onClick={() => toggle(p.slug, p.name)} aria-pressed={on} disabled={!on && ids.length >= 3} className="chip py-1 text-xs disabled:opacity-40" data-on={on}>
            {on ? <Check size={14} /> : <Plus size={14} />} Compare
          </button>
        </div>
      </div>
    </SpotlightCard>
  );
}
