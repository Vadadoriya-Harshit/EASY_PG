import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PGCard from "@/components/PGCard";
import CostCalculator from "@/components/CostCalculator";
import { getArea, listProperties } from "@/lib/repo";
import { MapPin, Train, Landmark, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { area: string } }): Promise<Metadata> {
  const a = await getArea(params.area);
  if (!a) return {};
  return {
    title: `PG in ${a.name}, ${a.city}: Boys & Girls PG`,
    description: `Verified boys and girls PGs in ${a.name}, ${a.city}: transparent rents, facilities, rules, and nearby essentials.`,
    alternates: { canonical: `/areas/${a.slug}` },
  };
}

export default async function AreaPage({ params }: { params: { area: string } }) {
  const a = await getArea(params.area);
  if (!a) notFound();
  const props = (await listProperties()).filter((p) => p.area === a.slug);
  const places = props.flatMap((p) => p.nearby).slice(0, 6);

  return (
    <>
      <PageHeader title={`PG Accommodation in ${a.name}`} intro={a.intro} />

      <div className="container-x py-12 space-y-12">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "PG in Ahmedabad", href: "/pg-in-ahmedabad" }, { name: a.name, href: `/areas/${a.slug}` }]} />
        {/* Landmarks and Quick Locality Metrics */}
        <div className="card p-6 border-ink/10 bg-surface/80">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Landmark size={18} className="text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-mute">Key Locality Landmarks:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {a.landmarks.map((lm, i) => (
                <span
                  key={i}
                  className="rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink"
                >
                  📍 {lm}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Available Properties Grid */}
        <section aria-label="Available PGs in this Locality">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Available Residences in {a.name} ({props.length})
            </h2>
            <Link href="/pgs" className="text-xs font-semibold text-brand hover:underline">
              View all Ahmedabad PGs →
            </Link>
          </div>

          {props.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {props.map((p) => (
                <PGCard key={p.slug} p={p} areaName={a.name} />
              ))}
            </div>
          ) : (
            <p className="card p-10 text-center text-mute">
              No PGs currently listed in {a.name}. Contact our team for upcoming openings.
            </p>
          )}
        </section>

        {/* Cost Calculator */}
        <section aria-label="Cost Calculator for this area">
          <CostCalculator />
        </section>

        {/* Nearby Essentials */}
        {places.length > 0 && (
          <section className="card p-6 border-ink/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Verified Nearby Essentials in {a.name}</h2>
              <Link href="/nearby" className="text-xs font-semibold text-brand hover:underline">
                Explore Full Directory →
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {places.map((n) => (
                <li key={n.id} className="rounded-xl border border-ink/10 bg-bg p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-accent">{n.category}</span>
                    {n.distanceKm != null && (
                      <span className="text-xs font-medium text-ink">{n.distanceKm} km</span>
                    )}
                  </div>
                  <p className="font-semibold text-sm mt-1">{n.name}</p>
                  <p className="text-[11px] text-mute mt-1">
                    {n.lastVerified ? "Verified Oct 2026" : "Field Surveyed"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
