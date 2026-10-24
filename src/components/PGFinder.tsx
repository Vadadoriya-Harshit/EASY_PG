"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  SearchX,
  Sparkles,
  RotateCcw,
  MapPin,
  IndianRupee,
  BedDouble,
  Wind,
  CheckCircle2,
  Train,
  Utensils
} from "lucide-react";
import type { Area, Property, RoomType } from "@/lib/types";
import {
  activeChips,
  applyFilters,
  defaultFilters,
  matchingRooms,
  removeChip,
  toQuery,
  type Filters
} from "@/lib/filter";
import { CATEGORY_LABEL, FACILITY_CATALOG, ROOM_LABEL } from "@/lib/site";
import { track } from "@/lib/analytics";
import PGCard from "./PGCard";
import { cn } from "@/lib/utils";

function toggle<T>(arr: T[], v: T) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Panel({
  f,
  set,
  areas,
  lock,
  hasMetro,
}: {
  f: Filters;
  set: (f: Filters) => void;
  areas: Area[];
  lock?: string;
  hasMetro: boolean;
}) {
  const Group = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon?: any;
    children: React.ReactNode;
  }) => (
    <fieldset className="border-b border-ink/8 pb-2.5 last:border-b-0">
      <legend className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-mute">
        {Icon && <Icon size={11} className="text-brand shrink-0" />}
        <span>{title}</span>
      </legend>
      {children}
    </fieldset>
  );

  return (
    <div className="space-y-2.5 text-xs">
      {/* 1. ACCOMMODATION TYPE */}
      {!lock && (
        <Group title="Accommodation" icon={Sparkles}>
          <div className="grid grid-cols-3 gap-1" role="group">
            {(["all", "boys", "girls"] as const).map((g) => {
              const active = f.gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  className={cn(
                    "chip justify-center capitalize py-1 px-1.5 text-[11px] font-semibold transition-all rounded-md",
                    active
                      ? "!bg-brand !text-white !border-brand shadow-xs font-bold"
                      : "hover:border-brand/40 text-mute hover:text-ink"
                  )}
                  aria-pressed={active}
                  onClick={() => set({ ...f, gender: g })}
                >
                  {g === "all" ? "All" : g}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {/* 2. AREA / LOCALITY */}
      <Group title="Locality" icon={MapPin}>
        <div className="flex flex-wrap gap-1">
          {areas.map((a) => {
            const active = f.areas.includes(a.slug);
            return (
              <button
                key={a.slug}
                type="button"
                className={cn(
                  "chip py-0.5 px-2 text-[10.5px] font-medium transition-all rounded-md",
                  active
                    ? "!bg-brand !text-white !border-brand shadow-xs font-bold"
                    : "hover:border-brand/40 text-mute hover:text-ink"
                )}
                aria-pressed={active}
                onClick={() => set({ ...f, areas: toggle(f.areas, a.slug) })}
              >
                {a.name}
              </button>
            );
          })}
        </div>
      </Group>

      {/* 3. MONTHLY BUDGET */}
      <Group title="Budget (₹/mo)" icon={IndianRupee}>
        <div className="grid grid-cols-2 gap-1.5 mb-1">
          <div>
            <span className="text-[9px] font-bold text-mute uppercase block mb-0.5">Min ₹</span>
            <input
              className="input !min-h-[28px] text-[11px] py-0.5 px-2 rounded border-ink/15 focus:border-brand"
              inputMode="numeric"
              placeholder="Min"
              type="number"
              min={0}
              step={500}
              value={f.min ?? ""}
              onChange={(e) => set({ ...f, min: Number(e.target.value) || undefined })}
            />
          </div>
          <div>
            <span className="text-[9px] font-bold text-mute uppercase block mb-0.5">Max ₹</span>
            <input
              className="input !min-h-[28px] text-[11px] py-0.5 px-2 rounded border-ink/15 focus:border-brand"
              inputMode="numeric"
              placeholder="Max"
              type="number"
              min={0}
              step={500}
              value={f.max ?? ""}
              onChange={(e) => set({ ...f, max: Number(e.target.value) || undefined })}
            />
          </div>
        </div>

        {/* Quick Budget Shortcuts */}
        <div className="flex flex-wrap gap-1">
          {[
            { label: "< ₹8k", min: undefined, max: 8000 },
            { label: "₹8k-12k", min: 8000, max: 12000 },
            { label: "₹12k-16k", min: 12000, max: 16000 },
            { label: "Any", min: undefined, max: undefined },
          ].map((b, idx) => {
            const active = f.min === b.min && f.max === b.max;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => set({ ...f, min: b.min, max: b.max })}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[9.5px] font-semibold border transition-all",
                  active
                    ? "bg-brand text-white border-brand shadow-xs"
                    : "bg-ink/5 border-transparent text-mute hover:text-ink hover:bg-ink/10"
                )}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </Group>

      {/* 4. ROOM SHARING TYPE */}
      <Group title="Room Sharing" icon={BedDouble}>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(ROOM_LABEL) as RoomType[]).map((t) => {
            const active = f.sharing.includes(t);
            return (
              <button
                key={t}
                type="button"
                className={cn(
                  "chip py-0.5 px-2 text-[10.5px] font-medium transition-all rounded-md",
                  active
                    ? "!bg-brand !text-white !border-brand shadow-xs font-bold"
                    : "hover:border-brand/40 text-mute hover:text-ink"
                )}
                aria-pressed={active}
                onClick={() => set({ ...f, sharing: toggle(f.sharing, t) })}
              >
                {ROOM_LABEL[t]}
              </button>
            );
          })}
        </div>
      </Group>

      {/* 5. AIR CONDITIONING */}
      <Group title="Air Conditioning" icon={Wind}>
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              ["any", "Any"],
              ["ac", "AC"],
              ["non-ac", "Non-AC"],
            ] as const
          ).map(([v, l]) => {
            const active = f.ac === v;
            return (
              <button
                key={v}
                type="button"
                className={cn(
                  "chip justify-center py-1 px-1 text-[11px] font-semibold rounded-md",
                  active
                    ? "!bg-brand !text-white !border-brand shadow-xs font-bold"
                    : "hover:border-brand/40 text-mute hover:text-ink"
                )}
                aria-pressed={active}
                onClick={() => set({ ...f, ac: v })}
              >
                {l}
              </button>
            );
          })}
        </div>
      </Group>

      {/* 6. ESSENTIAL FACILITIES */}
      <Group title="Facilities">
        <div className="flex flex-wrap gap-1">
          {FACILITY_CATALOG.map((x) => {
            const active = f.facilities.includes(x.key);
            return (
              <button
                key={x.key}
                type="button"
                className={cn(
                  "chip py-0.5 px-1.5 text-[10px] font-medium transition-all rounded-md",
                  active
                    ? "!bg-brand !text-white !border-brand shadow-xs font-bold"
                    : "hover:border-brand/40 text-mute hover:text-ink"
                )}
                aria-pressed={active}
                onClick={() => set({ ...f, facilities: toggle(f.facilities, x.key) })}
              >
                {x.name}
              </button>
            );
          })}
        </div>
      </Group>

      {/* 7. METRO DISTANCE */}
      {hasMetro && (
        <Group title="Metro Distance" icon={Train}>
          <div className="flex flex-wrap gap-1">
            {[1, 2, 3].map((km) => {
              const active = f.metroMax === km;
              return (
                <button
                  key={km}
                  type="button"
                  className={cn(
                    "chip py-0.5 px-2 text-[10.5px] font-medium rounded-md",
                    active
                      ? "!bg-brand !text-white !border-brand shadow-xs font-bold"
                      : "hover:border-brand/40 text-mute hover:text-ink"
                  )}
                  aria-pressed={active}
                  onClick={() => set({ ...f, metroMax: f.metroMax === km ? undefined : km })}
                >
                  &le; {km} km
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {/* 8. FOOD & ESSENTIALS NEARBY */}
      <Group title="Food & Essentials" icon={Utensils}>
        <div className="flex flex-wrap gap-1">
          {(["breakfast", "tiffin", "restaurant", "grocery"] as const).map((c) => {
            const active = f.food.includes(c);
            return (
              <button
                key={c}
                type="button"
                className={cn(
                  "chip py-0.5 px-1.5 text-[10px] font-medium capitalize rounded-md",
                  active
                    ? "!bg-brand !text-white !border-brand shadow-xs font-bold"
                    : "hover:border-brand/40 text-mute hover:text-ink"
                )}
                aria-pressed={active}
                onClick={() => set({ ...f, food: toggle(f.food, c) })}
              >
                {CATEGORY_LABEL[c]}
              </button>
            );
          })}
        </div>
      </Group>

      {/* 9. MOVE-IN READY TOGGLE */}
      <label className="flex items-center gap-2 p-2 rounded-lg bg-ink/5 hover:bg-ink/10 transition-colors cursor-pointer border border-ink/5">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 rounded accent-brand cursor-pointer"
          checked={f.availableNow}
          onChange={(e) => set({ ...f, availableNow: e.target.checked })}
        />
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10.5px] font-semibold text-ink">Ready to Move In</span>
        </div>
      </label>
    </div>
  );
}

export default function PGFinder({
  properties,
  areas,
  initial,
  lockGender,
}: {
  properties: Property[];
  areas: Area[];
  initial: Filters;
  lockGender?: "boys" | "girls";
}) {
  const [f, setF] = useState<Filters>(initial);
  const [sheet, setSheet] = useState(false);
  const pathname = usePathname();
  const first = useRef(true);
  const areaNames = useMemo(() => Object.fromEntries(areas.map((a) => [a.slug, a.name])), [areas]);
  const results = useMemo(() => applyFilters(properties, f), [properties, f]);
  const chips = activeChips(f, areaNames, lockGender);
  const hasMetro = properties.some((p) => p.metro);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.history.replaceState(null, "", pathname + toQuery(f, !!lockGender));
    const t = setTimeout(() => track("search"), 800);
    return () => clearTimeout(t);
  }, [f]);

  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [sheet]);

  const reset = () => setF({ ...defaultFilters, gender: lockGender ?? "all" });

  return (
    <div className="grid gap-6 lg:gap-7 lg:grid-cols-[265px_1fr] items-start w-full">
      {/* DESKTOP SIDEBAR FILTER: Compact luxury card with pinned header and discreet 4px smooth scroll */}
      <aside className="hidden lg:block shrink-0 w-[265px]" aria-label="Filters">
        <div className="card card-3d sticky top-20 p-3.5 rounded-2xl border border-ink/10 bg-surface/95 backdrop-blur-md shadow-xl transition-all w-full max-h-[min(490px,calc(100vh-6rem))] flex flex-col">
          {/* Pinned Luxury Header */}
          <div className="shrink-0 mb-2 flex items-center justify-between pb-2 border-b border-ink/10">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-purple-600 text-white shadow-xs">
                <SlidersHorizontal size={11} />
              </span>
              <div>
                <h2 className="text-xs font-extrabold text-ink tracking-tight uppercase">Filters</h2>
                <span className="text-[9.5px] text-mute font-medium block leading-tight">Tailor your stay</span>
              </div>
            </div>
            {chips.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 rounded-full bg-ink/5 hover:bg-ink/10 px-2 py-0.5 text-[10px] font-bold text-brand transition"
                title="Reset all filters"
              >
                <RotateCcw size={9} /> Reset
              </button>
            )}
          </div>

          {/* Smooth Scrollable Options Body with 4px discreet scrollbar */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <Panel f={f} set={setF} areas={areas} lock={lockGender} hasMetro={hasMetro} />
          </div>
        </div>
      </aside>

      {/* RESULTS LISTING */}
      <section aria-label="Results" className="min-w-0 w-full">
        {/* Top bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            className="btn btn-ghost lg:hidden"
            onClick={() => setSheet(true)}
          >
            <SlidersHorizontal size={16} /> Filters
            {chips.length ? ` (${chips.length})` : ""}
          </button>
          <p className="text-sm text-mute" role="status" aria-live="polite">
            <strong className="text-ink text-base">{results.length}</strong>{" "}
            {results.length === 1 ? "PG residence" : "PG residences"} found
          </p>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-mute font-medium">Sort</span>
            <select
              className="input !min-h-[40px] !w-auto text-xs font-semibold"
              value={f.sort}
              onChange={(e) => setF({ ...f, sort: e.target.value as Filters["sort"] })}
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="updated">Recently updated</option>
            </select>
          </label>
        </div>

        {/* Active Chips Bar */}
        {chips.length > 0 && (
          <ul className="mb-5 flex flex-wrap gap-2 items-center" aria-label="Active filters">
            {chips.map((c) => (
              <li
                key={c.id}
                className="chip py-1 px-3 capitalize bg-brand/10 text-brand border-brand/20 font-bold flex items-center gap-1.5"
                data-on="true"
              >
                <span>{c.label}</span>
                <button
                  aria-label={`Remove filter ${c.label}`}
                  onClick={() => setF(removeChip(f, c.id))}
                  className="hover:text-red-500 transition-colors"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
            <li>
              <button
                className="px-2 py-1 text-xs text-brand font-bold underline"
                onClick={reset}
              >
                Clear all ({chips.length})
              </button>
            </li>
          </ul>
        )}

        {/* Results Grid: 3 columns on xl displays so no horizontal space is wasted */}
        {results.length ? (
          <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 w-full">
            {results.map((p) => (
              <div key={p.slug} className="w-full flex justify-center min-w-0">
                <PGCard
                  p={p}
                  areaName={areaNames[p.area] || p.area}
                  rooms={matchingRooms(p, f)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="card grid place-items-center gap-3 px-6 py-16 text-center rounded-3xl">
            <SearchX size={40} className="text-accent animate-bounce" aria-hidden="true" />
            <h3 className="text-xl font-extrabold text-ink">No PGs match these filters</h3>
            <p className="max-w-md text-sm text-mute">
              Try widening your budget, removing the AC or facility filters, or selecting more areas in Ahmedabad.
            </p>
            <button className="btn btn-primary" onClick={reset}>
              Reset all filters
            </button>
          </div>
        )}
      </section>

      {/* MOBILE SHEET */}
      <AnimatePresence>
        {sheet && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheet(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 flex max-h-[90svh] flex-col rounded-t-3xl bg-surface shadow-2xl border-t border-ink/10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              <div className="flex items-center justify-between border-b border-ink/10 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <SlidersHorizontal size={14} />
                  </span>
                  <h2 className="text-lg font-bold">Filters</h2>
                </div>
                <button
                  className="grid h-10 w-10 place-items-center rounded-full bg-ink/5"
                  aria-label="Close filters"
                  onClick={() => setSheet(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto p-5 scrollbar-thin">
                <Panel f={f} set={setF} areas={areas} lock={lockGender} hasMetro={hasMetro} />
              </div>
              <div className="flex gap-3 border-t border-ink/10 p-4 bg-surface">
                <button className="btn btn-ghost flex-1 text-xs" onClick={reset}>
                  Reset
                </button>
                <button
                  className="btn btn-primary flex-[2] text-xs"
                  onClick={() => setSheet(false)}
                >
                  Show {results.length} {results.length === 1 ? "PG" : "PGs"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
