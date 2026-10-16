"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X, SearchX } from "lucide-react";
import type { Area, Property, RoomType } from "@/lib/types";
import { activeChips, applyFilters, defaultFilters, matchingRooms, removeChip, toQuery, type Filters } from "@/lib/filter";
import { CATEGORY_LABEL, FACILITY_CATALOG, ROOM_LABEL } from "@/lib/site";
import { track } from "@/lib/analytics";
import PGCard from "./PGCard";

function toggle<T>(arr: T[], v: T) { return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]; }

function Panel({ f, set, areas, lock, hasMetro }: { f: Filters; set: (f: Filters) => void; areas: Area[]; lock?: string; hasMetro: boolean }) {
  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <fieldset className="border-b border-ink/10 pb-5"><legend className="mb-3 text-sm font-semibold">{title}</legend>{children}</fieldset>
  );
  return (
    <div className="grid gap-5">
      {!lock && (
        <Group title="Accommodation">
          <div className="grid grid-cols-3 gap-2" role="group">
            {(["all", "boys", "girls"] as const).map((g) => (
              <button key={g} className="chip justify-center capitalize" aria-pressed={f.gender === g} onClick={() => set({ ...f, gender: g })}>{g}</button>
            ))}
          </div>
        </Group>
      )}
      <Group title="Area">
        <div className="flex flex-wrap gap-2">
          {areas.map((a) => <button key={a.slug} className="chip" aria-pressed={f.areas.includes(a.slug)} onClick={() => set({ ...f, areas: toggle(f.areas, a.slug) })}>{a.name}</button>)}
        </div>
      </Group>
      <Group title="Monthly budget (per bed / room as listed)">
        <div className="grid grid-cols-2 gap-3">
          <label><span className="label">Min ₹</span><input className="input" inputMode="numeric" type="number" min={0} step={500} value={f.min ?? ""} onChange={(e) => set({ ...f, min: Number(e.target.value) || undefined })} /></label>
          <label><span className="label">Max ₹</span><input className="input" inputMode="numeric" type="number" min={0} step={500} value={f.max ?? ""} onChange={(e) => set({ ...f, max: Number(e.target.value) || undefined })} /></label>
        </div>
      </Group>
      <Group title="Sharing">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROOM_LABEL) as RoomType[]).map((t) => <button key={t} className="chip" aria-pressed={f.sharing.includes(t)} onClick={() => set({ ...f, sharing: toggle(f.sharing, t) })}>{ROOM_LABEL[t]}</button>)}
        </div>
      </Group>
      <Group title="Air conditioning">
        <div className="grid grid-cols-3 gap-2">
          {([["any", "Any"], ["ac", "AC"], ["non-ac", "Non-AC"]] as const).map(([v, l]) => <button key={v} className="chip justify-center" aria-pressed={f.ac === v} onClick={() => set({ ...f, ac: v })}>{l}</button>)}
        </div>
      </Group>
      <Group title="Facilities">
        <div className="flex flex-wrap gap-2">
          {FACILITY_CATALOG.map((x) => <button key={x.key} className="chip" aria-pressed={f.facilities.includes(x.key)} onClick={() => set({ ...f, facilities: toggle(f.facilities, x.key) })}>{x.name}</button>)}
        </div>
      </Group>
      {hasMetro && (
        <Group title="Metro proximity">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((km) => <button key={km} className="chip" aria-pressed={f.metroMax === km} onClick={() => set({ ...f, metroMax: f.metroMax === km ? undefined : km })}>Within {km} km</button>)}
          </div>
          <p className="mt-2 text-xs text-mute">Only properties with a recorded distance are matched.</p>
        </Group>
      )}
      <Group title="Food nearby">
        <div className="flex flex-wrap gap-2">
          {(["breakfast", "tiffin", "restaurant", "grocery"] as const).map((c) => <button key={c} className="chip" aria-pressed={f.food.includes(c)} onClick={() => set({ ...f, food: toggle(f.food, c) })}>{CATEGORY_LABEL[c]}</button>)}
        </div>
      </Group>
      <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--brand))]" checked={f.availableNow} onChange={(e) => set({ ...f, availableNow: e.target.checked })} /> Available now</label>
    </div>
  );
}

export default function PGFinder({ properties, areas, initial, lockGender }: { properties: Property[]; areas: Area[]; initial: Filters; lockGender?: "boys" | "girls" }) {
  const [f, setF] = useState<Filters>(initial);
  const [sheet, setSheet] = useState(false);
  const pathname = usePathname();
  const first = useRef(true);
  const areaNames = useMemo(() => Object.fromEntries(areas.map((a) => [a.slug, a.name])), [areas]);
  const results = useMemo(() => applyFilters(properties, f), [properties, f]);
  const chips = activeChips(f, areaNames, lockGender);
  const hasMetro = properties.some((p) => p.metro);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.history.replaceState(null, "", pathname + toQuery(f, !!lockGender));
    const t = setTimeout(() => track("search"), 800);
    return () => clearTimeout(t);
  }, [f]);
  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [sheet]);

  const reset = () => setF({ ...defaultFilters, gender: lockGender ?? "all" });

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="card sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">Filters</h2>{chips.length > 0 && <button className="text-sm text-brand underline" onClick={reset}>Clear all</button>}</div>
          <Panel f={f} set={setF} areas={areas} lock={lockGender} hasMetro={hasMetro} />
        </div>
      </aside>

      <section aria-label="Results">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button className="btn btn-ghost lg:hidden" onClick={() => setSheet(true)}><SlidersHorizontal size={16} /> Filters{chips.length ? ` (${chips.length})` : ""}</button>
          <p className="text-sm text-mute" role="status" aria-live="polite"><strong className="text-ink">{results.length}</strong> {results.length === 1 ? "PG" : "PGs"} found</p>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-mute">Sort</span>
            <select className="input !min-h-[40px] !w-auto" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value as Filters["sort"] })}>
              <option value="recommended">Recommended</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="updated">Recently updated</option>
            </select>
          </label>
        </div>

        {chips.length > 0 && (
          <ul className="mb-5 flex flex-wrap gap-2" aria-label="Active filters">
            {chips.map((c) => (
              <li key={c.id} className="chip py-1 capitalize" data-on="true">{c.label}
                <button aria-label={`Remove filter ${c.label}`} onClick={() => setF(removeChip(f, c.id))}><X size={14} /></button></li>
            ))}
            <li><button className="px-2 py-1 text-sm text-brand underline" onClick={reset}>Clear all</button></li>
          </ul>
        )}

        {results.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((p) => <PGCard key={p.slug} p={p} areaName={areaNames[p.area] || p.area} rooms={matchingRooms(p, f)} />)}
          </div>
        ) : (
          <div className="card grid place-items-center gap-3 px-6 py-16 text-center">
            <SearchX size={36} className="text-accent" aria-hidden="true" />
            <h3 className="text-xl font-semibold">No PGs match these filters</h3>
            <p className="max-w-md text-sm text-mute">Try widening your budget, removing the AC or facility filters, or selecting more areas.</p>
            <button className="btn btn-primary" onClick={reset}>Reset filters</button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {sheet && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.div className="absolute inset-x-0 bottom-0 flex max-h-[88svh] flex-col rounded-t-3xl bg-surface" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}>
              <div className="flex items-center justify-between border-b border-ink/10 p-4"><h2 className="text-lg font-semibold">Filters</h2><button className="grid h-11 w-11 place-items-center" aria-label="Close filters" onClick={() => setSheet(false)}><X /></button></div>
              <div className="overflow-y-auto p-5"><Panel f={f} set={setF} areas={areas} lock={lockGender} hasMetro={hasMetro} /></div>
              <div className="flex gap-3 border-t border-ink/10 p-4">
                <button className="btn btn-ghost flex-1" onClick={reset}>Clear all</button>
                <button className="btn btn-primary flex-[2]" onClick={() => setSheet(false)}>Show {results.length} {results.length === 1 ? "PG" : "PGs"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
