"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { Area, Property, RoomType } from "@/lib/types";
import { FACILITY_CATALOG, ROOM_LABEL } from "@/lib/site";
import { defaultFilters, matchingRooms, propertyMatches, toQuery, type Filters } from "@/lib/filter";
import { inr, rentRange } from "@/lib/utils";
import { track } from "@/lib/analytics";

const STEPS = ["Who is it for?", "Where?", "Budget & sharing", "Must-haves", "Commute"] as const;

export default function SmartMatch({ properties, areas }: { properties: Property[]; areas: Area[] }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Filters>(defaultFilters);
  const [done, setDone] = useState(false);
  const toggle = <T,>(a: T[], v: T) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);
  const areaName = (s: string) => areas.find((a) => a.slug === s)?.name || s;

  const matches = useMemo(() => {
    if (!done) return [];
    return properties
      .map((p) => {
        const strict = propertyMatches(p, f);
        const reasons: string[] = [];
        if (f.gender !== "all") reasons.push(`${f.gender === "boys" ? "Boys" : "Girls"} PG`);
        if (f.areas.length) reasons.push(`in ${areaName(p.area)}`);
        const rooms = matchingRooms(p, f);
        const r = rentRange(rooms);
        if (r && (f.max || f.min)) reasons.push(`rent from ${inr(r.min)} fits your budget`);
        if (f.sharing.length) reasons.push(`${Array.from(new Set(rooms.map((x) => ROOM_LABEL[x.type]))).join(" / ")} available`);
        f.facilities.forEach((k) => reasons.push(`${FACILITY_CATALOG.find((x) => x.key === k)?.name} included or offered`));
        if (f.metroMax && p.metro) reasons.push(`${p.metro.distanceKm} km to ${p.metro.station} (${p.metro.method})`);
        return { p, strict, reasons, r };
      })
      .filter((x) => x.strict)
      .slice(0, 3);
  }, [done, f]);

  if (done)
    return (
      <div>
        <h2 className="text-2xl font-semibold">{matches.length ? `We found ${matches.length} ${matches.length === 1 ? "match" : "matches"}` : "No exact match yet"}</h2>
        <div className="mt-6 grid gap-4">
          {matches.map(({ p, reasons, r }) => (
            <div key={p.slug} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-lg font-semibold"><Link href={`/pg/${p.slug}`} className="hover:text-brand">{p.name}</Link></h3>
                  <p className="text-sm text-mute">{areaName(p.area)}{r ? ` · from ${inr(r.min)} / month` : ""}</p></div>
                <Link href={`/pg/${p.slug}`} className="btn btn-primary">View details</Link>
              </div>
              <p className="mt-3 text-sm text-mute"><strong className="text-ink">Why it matches:</strong> {reasons.length ? reasons.join(", ") : "it meets your criteria"}.</p>
            </div>
          ))}
          {!matches.length && <p className="text-mute">Try a wider budget or fewer must-haves, or browse everything in the finder.</p>}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/pgs${toQuery(f)}`} className="btn btn-ghost">Open in PG Finder</Link>
          <button className="btn btn-ghost" onClick={() => { setDone(false); setStep(0); }}>Start over</button>
        </div>
      </div>
    );

  return (
    <div>
      <div className="mb-6 flex gap-1.5" aria-hidden="true">{STEPS.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-ink/10"}`} />)}</div>
      <h2 className="text-2xl font-semibold">{STEPS[step]}</h2>
      <p className="mb-6 mt-1 text-sm text-mute">Step {step + 1} of {STEPS.length}. You can skip anything.</p>
      <div className="min-h-[170px]">
        {step === 0 && <div className="flex flex-wrap gap-2">{(["all", "boys", "girls"] as const).map((g) => <button key={g} className="chip capitalize" aria-pressed={f.gender === g} onClick={() => setF({ ...f, gender: g })}>{g === "all" ? "No preference" : g}</button>)}</div>}
        {step === 1 && <div className="flex flex-wrap gap-2">{areas.map((a) => <button key={a.slug} className="chip" aria-pressed={f.areas.includes(a.slug)} onClick={() => setF({ ...f, areas: toggle(f.areas, a.slug) })}>{a.name}</button>)}</div>}
        {step === 2 && (
          <div className="grid gap-5">
            <div className="grid max-w-sm grid-cols-2 gap-3">
              <label><span className="label">Min ₹</span><input type="number" step={500} className="input" value={f.min ?? ""} onChange={(e) => setF({ ...f, min: Number(e.target.value) || undefined })} /></label>
              <label><span className="label">Max ₹</span><input type="number" step={500} className="input" value={f.max ?? ""} onChange={(e) => setF({ ...f, max: Number(e.target.value) || undefined })} /></label>
            </div>
            <div className="flex flex-wrap gap-2">{(Object.keys(ROOM_LABEL) as RoomType[]).map((t) => <button key={t} className="chip" aria-pressed={f.sharing.includes(t)} onClick={() => setF({ ...f, sharing: toggle(f.sharing, t) })}>{ROOM_LABEL[t]}</button>)}</div>
          </div>
        )}
        {step === 3 && <div className="flex flex-wrap gap-2">{FACILITY_CATALOG.map((x) => <button key={x.key} className="chip" aria-pressed={f.facilities.includes(x.key)} onClick={() => setF({ ...f, facilities: toggle(f.facilities, x.key) })}>{x.name}</button>)}
          <button className="chip" aria-pressed={f.ac === "ac"} onClick={() => setF({ ...f, ac: f.ac === "ac" ? "any" : "ac" })}>AC room</button></div>}
        {step === 4 && <div><p className="mb-3 text-sm text-mute">Only properties with a recorded metro distance will match.</p><div className="flex flex-wrap gap-2">{[1, 2, 3].map((k) => <button key={k} className="chip" aria-pressed={f.metroMax === k} onClick={() => setF({ ...f, metroMax: f.metroMax === k ? undefined : k })}>Within {k} km of metro</button>)}</div></div>}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button>
        {step < STEPS.length - 1 ? <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Next</button>
          : <button className="btn btn-primary" onClick={() => { track("smart_match"); setDone(true); }}><Sparkles size={16} /> Show my matches</button>}
      </div>
    </div>
  );
}
