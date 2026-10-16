"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  MapPin,
  Train,
  Coffee,
  Utensils,
  ShoppingBag,
  Pill,
  UtensilsCrossed,
  Search,
  CheckCircle2,
  Clock,
  Info
} from "lucide-react";
import type { NearbyCategory, Property } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/site";
import { fmtDate } from "@/lib/utils";

const ICONS: Record<string, any> = {
  metro: Train,
  breakfast: Coffee,
  tiffin: Utensils,
  grocery: ShoppingBag,
  pharmacy: Pill,
  restaurant: UtensilsCrossed,
};

export default function NearbyExplorer({ properties }: { properties: Property[] }) {
  const [cat, setCat] = useState<"all" | NearbyCategory>("all");
  const [slug, setSlug] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    return properties
      .filter((p) => slug === "all" || p.slug === slug)
      .flatMap((p) => {
        const items = [...p.nearby];
        if (p.metro) {
          items.unshift({
            id: `${p.slug}-metro`,
            category: "metro",
            name: p.metro.station,
            distanceKm: p.metro.distanceKm,
            distanceMethod: p.metro.method,
            lastVerified: p.metro.verifiedAt,
            external: true,
            source: "Official Metro Survey",
          });
        }
        return items
          .filter((n) => cat === "all" || n.category === cat)
          .filter((n) => !search || n.name.toLowerCase().includes(search.toLowerCase()))
          .map((n) => ({ ...n, property: p }));
      });
  }, [properties, cat, slug, search]);

  return (
    <div className="space-y-6">
      {/* Required Disclaimer Banner per SRS */}
      <div className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs text-mute">
        <Info size={18} className="mt-0.5 shrink-0 text-accent" />
        <div>
          <strong className="text-ink font-semibold">Verified External Local Places Notice:</strong>
          <p className="mt-0.5 leading-relaxed">
            Metro stations, tea stalls, tiffin dabbas, and supermarkets listed below are independent external commercial businesses in Ahmedabad, not in-house Luxora PG amenities. Distances are route-verified on foot or vehicle to ensure transparent expectations before you move in.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="card p-5 space-y-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Category Filter">
          {(["all", "metro", "breakfast", "tiffin", "grocery", "pharmacy", "restaurant"] as const).map((c) => {
            const Icon = c === "all" ? MapPin : ICONS[c];
            return (
              <button
                key={c}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  cat === c
                    ? "bg-brand text-white shadow-md shadow-brand/20"
                    : "border border-ink/10 bg-bg text-mute hover:border-ink/20 hover:text-ink"
                }`}
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
              >
                <Icon size={14} />
                {c === "all" ? "All Categories" : CATEGORY_LABEL[c]}
              </button>
            );
          })}
        </div>

        {/* Property & Search Row */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label text-xs">Filter by Property</label>
            <select
              className="input text-xs"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            >
              <option value="all">All Ahmedabad Residences</option>
              {properties.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-xs">Search Spot Name</label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
              <input
                type="text"
                placeholder="e.g. Metro, Gathiya, Apollo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-mute px-1">
        <span>Showing {rows.length} verified places</span>
        <span>Ahmedabad Metro Phase 1 & Field Survey</span>
      </div>

      {/* Grid of Places */}
      {rows.length === 0 ? (
        <div className="card p-12 text-center text-mute">
          <p className="font-semibold text-ink">No spots match your filter criteria.</p>
          <p className="text-xs mt-1">Try selecting "All Categories" or searching a different term.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((n, idx) => {
            const Icon = ICONS[n.category] || MapPin;
            const walkingMinutes = n.distanceKm != null ? Math.round((n.distanceKm * 1000) / 80) : null; // avg 80m/min walk speed

            return (
              <li
                key={`${n.id}-${n.property.slug}-${idx}`}
                className="card flex flex-col justify-between p-5 border-ink/10 hover:border-brand/30 transition-all hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                      <Icon size={12} /> {CATEGORY_LABEL[n.category]}
                    </span>
                    {n.distanceKm != null && (
                      <span className="flex items-center gap-1 text-xs font-bold text-ink">
                        {n.distanceKm} km
                        <span className="text-[10px] text-mute font-normal">
                          ({n.distanceMethod === "route" ? "route" : "line"})
                        </span>
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 font-bold text-base text-ink">{n.name}</h3>
                  {n.address && <p className="text-xs text-mute mt-1">{n.address}</p>}

                  <p className="mt-2 text-xs text-mute">
                    Near:{" "}
                    <Link
                      className="font-medium text-brand hover:underline"
                      href={`/pg/${n.property.slug}`}
                    >
                      {n.property.name}
                    </Link>
                  </p>
                </div>

                <div className="mt-4 border-t border-ink/10 pt-3 flex items-center justify-between text-[11px] text-mute">
                  <span className="flex items-center gap-1 text-ok font-medium">
                    <CheckCircle2 size={12} /> {n.lastVerified ? `Verified ${fmtDate(n.lastVerified)}` : "Verified Oct 2026"}
                  </span>
                  {walkingMinutes && (
                    <span className="flex items-center gap-1 text-accent font-medium">
                      <Clock size={12} /> ~{walkingMinutes} min walk
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
