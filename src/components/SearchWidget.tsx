"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, IndianRupee, Users, Sparkles, Check } from "lucide-react";
import type { Area } from "@/lib/types";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
export default function SearchWidget({ areas }: { areas: Pick<Area, "slug" | "name">[] }) {
  const router = useRouter();
  const [gender, setGender] = useState<"all" | "boys" | "girls">("all");
  const [sel, setSel] = useState<string[]>([]);
  const [max, setMax] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    const p = new URLSearchParams();
    if (gender !== "all") p.set("gender", gender);
    if (sel.length) p.set("area", sel.join(","));
    if (max) p.set("max", max);
    track("search");
    router.push(`/pgs${p.toString() ? `?${p}` : ""}`);
    // Auto reset searching after 3s in case page transition finishes
    setTimeout(() => setIsSearching(false), 3000);
  };

  const toggleArea = (slug: string) => {
    setSel((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  };

  return (
    <form
      onSubmit={go}
      className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_22px_55px_-12px_rgba(0,0,0,0.38),_inset_0_1.5px_1.5px_0_rgba(255,255,255,0.35)] border border-white/25 bg-black/50 dark:bg-black/65 backdrop-blur-2xl grid gap-4 md:grid-cols-[auto_1fr_auto_auto] md:items-end w-full relative overflow-hidden transition-all duration-300 hover:shadow-[0_28px_65px_-10px_rgba(0,0,0,0.48),_inset_0_1.5px_2px_0_rgba(255,255,255,0.45)]"
      aria-label="Find a PG"
    >
      {/* Subtle interior glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-brand/15 blur-[60px] pointer-events-none" />

      {/* 1. Category Switcher */}
      <fieldset className="min-w-0">
        <legend className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-mute">
          <Users size={12} className="text-brand" /> Looking for
        </legend>
        <div className="inline-flex rounded-xl bg-ink/5 p-1 border border-ink/5">
          {(["all", "boys", "girls"] as const).map((g) => {
            const active = gender === g;
            return (
              <button
                type="button"
                key={g}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                  active
                    ? "bg-surface text-brand shadow-sm font-bold ring-1 ring-black/5 dark:ring-white/10"
                    : "text-mute hover:text-ink"
                )}
                aria-pressed={active}
                onClick={() => setGender(g)}
              >
                {g === "all" ? "All PGs" : g === "boys" ? "Boys PG" : "Girls PG"}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 2. Locality Multi-select Pills */}
      <fieldset className="min-w-0">
        <legend className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-mute">
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="text-accent" /> Localities
          </span>
          {sel.length > 0 && (
            <span className="rounded-full bg-brand/10 text-brand px-2 py-0.2 text-[10px] font-bold">
              {sel.length} selected
            </span>
          )}
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {areas.map((a) => {
            const active = sel.includes(a.slug);
            return (
              <button
                type="button"
                key={a.slug}
                className={cn(
                  "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium border transition-all",
                  active
                    ? "border-brand bg-brand text-white shadow-sm font-semibold"
                    : "border-ink/10 bg-surface/60 text-ink hover:border-brand/40 hover:bg-surface"
                )}
                aria-pressed={active}
                onClick={() => toggleArea(a.slug)}
              >
                {active && <Check size={11} className="stroke-[3]" />}
                {a.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 3. Budget Filter */}
      <div className="min-w-[130px]">
        <label htmlFor="hero-max" className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-mute">
          <IndianRupee size={12} className="text-ok" /> Max Budget
        </label>
        <select
          id="hero-max"
          className="input !min-h-[38px] text-xs py-1.5 px-3 rounded-xl border-ink/15 bg-surface/80"
          value={max}
          onChange={(e) => setMax(e.target.value)}
        >
          <option value="">Any budget</option>
          <option value="5000">Up to ₹5,000 / mo</option>
          <option value="7000">Up to ₹7,000 / mo</option>
          <option value="9000">Up to ₹9,000 / mo</option>
          <option value="12000">Up to ₹12,000 / mo</option>
        </select>
      </div>

      {/* 4. Action Button */}
      <button
        type="submit"
        disabled={isSearching}
        className="btn btn-primary !min-h-[40px] text-xs py-2 px-5 shrink-0 shadow-lg shadow-brand/25 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap disabled:opacity-80"
      >
        {isSearching ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Searching PGs...</span>
          </>
        ) : (
          <>
            <Search size={14} className="shrink-0" />
            <span>Search PGs</span>
          </>
        )}
      </button>
    </form>
  );
}
