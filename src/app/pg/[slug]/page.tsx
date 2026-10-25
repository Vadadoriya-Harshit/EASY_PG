import type { Metadata } from "next";
import { safeJsonLd } from "@/lib/http";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock, MapPin, Train, ExternalLink, ShieldAlert, Sparkles } from "lucide-react";
import { getArea, getProperty, listProperties, isDemoStore } from "@/lib/repo";
import { SITE, ROOM_LABEL, CATEGORY_LABEL } from "@/lib/site";
import { fmtDate, inr, rentRange, waMessage } from "@/lib/utils";
import GallerySlider from "@/components/GallerySlider";
import FacilityIcon from "@/components/FacilityIcon";
import InquiryForm from "@/components/InquiryForm";
import ContactActions from "@/components/ContactActions";
import DemoNotice from "@/components/DemoNotice";
import RoomTypesShowcase from "@/components/RoomTypesShowcase";
import InteractiveRoomTour from "@/components/InteractiveRoomTour";
import CostCalculator from "@/components/CostCalculator";
import MobileCardSlider from "@/components/MobileCardSlider";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await listProperties()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProperty(slug);
  if (!p) return {};
  const a = await getArea(p.area);
  const r = rentRange(p.rooms);
  const desc = `${p.gender === "girls" ? "Girls" : "Boys"} PG in ${a?.name ?? p.area}${r ? ` from ${inr(r.min)}/month` : ""}. Rooms, facilities, rules and nearby essentials.`;
  return {
    title: `${p.name}: ${p.gender === "girls" ? "Girls" : "Boys"} PG in ${a?.name ?? "Ahmedabad"}`,
    description: desc,
    alternates: { canonical: `/pg/${p.slug}` },
    openGraph: {
      title: p.name,
      description: desc,
      images: p.media[0] && !p.media[0].url.endsWith(".svg") ? [p.media[0].url] : undefined,
    },
  };
}

const FAC_LABEL = { included: "Included", paid: "Paid extra", "not-available": "Not available" } as const;

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProperty(slug);
  if (!p) notFound();
  const area = await getArea(p.area);
  const r = rentRange(p.rooms);
  const types = Array.from(new Set(p.rooms.map((x) => x.type)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: p.name,
    description: p.description,
    url: `${SITE.url}/pg/${p.slug}`,
    ...(p.verified && p.address && !p.address.includes("to be confirmed")
      ? { address: { "@type": "PostalAddress", streetAddress: p.address, addressLocality: area?.city, addressCountry: "IN" } }
      : {}),
    ...(p.phone || SITE.phone ? { telephone: p.phone || SITE.phone } : {}),
    ...(r ? { priceRange: `${inr(r.min)} - ${inr(r.max)} per month` } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <div className="container-x pb-28 pt-8 lg:pb-16">
        <Breadcrumbs
          className="mb-5"
          items={[
            { name: "Home", href: "/" },
            { name: "PG in Ahmedabad", href: "/pg-in-ahmedabad" },
            { name: area?.name ?? p.area, href: `/areas/${p.area}` },
            { name: p.name, href: `/pg/${p.slug}` },
          ]}
        />

        <DemoNotice show={isDemoStore() || !p.verified} />

        {/* TOP HERO & INQUIRY OVERVIEW SPLIT */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 xl:col-span-8 min-w-0">
            {/* High-res Image Slider with Fullscreen Lightbox */}
            <GallerySlider media={p.media} autoplay />

            {/* Title & Quick Info */}
            <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${p.gender === "girls" ? "bg-pink-600" : "bg-sky-600"}`}>
                    {p.gender === "girls" ? "Girls PG Accommodation" : "Boys PG Accommodation"}
                  </span>
                  <span className="rounded-full bg-brand/10 border border-brand/20 px-3 py-1 text-xs font-semibold text-brand">
                    {area?.name}, Ahmedabad
                  </span>
                  {p.verified && (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <BadgeCheck size={14} /> Verified Property
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-black sm:text-5xl text-ink tracking-tight">{p.name}</h1>
                <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-mute">
                  <span className="inline-flex items-center gap-1.5"><MapPin size={16} className="text-brand" />{area?.name}{area ? `, ${area.city}` : ""}</span>
                  {p.metro && (
                    <span className="inline-flex items-center gap-1.5 text-accent font-semibold">
                      <Train size={16} /> {p.metro.station} ({p.metro.distanceKm} km route)
                    </span>
                  )}
                </p>
              </div>

              {r && (
                <div className="rounded-2xl border border-ink/10 bg-surface/80 p-4 text-right shadow-sm backdrop-blur-sm">
                  <span className="block text-xs uppercase tracking-wider text-mute font-semibold">Starting From</span>
                  <span className="font-display text-3xl sm:text-4xl font-black text-brand">{inr(r.min)}</span>
                  <span className="block text-xs text-mute font-medium">per month / per bed</span>
                </div>
              )}
            </div>

            <p className="mt-6 text-base leading-relaxed text-mute">{p.description}</p>

            {/* Trust Panel */}
            <section aria-labelledby="trust" className="card mt-8 grid gap-4 p-6 sm:grid-cols-2">
              <h2 id="trust" className="sr-only">Trust details</h2>
              <div className="flex items-start gap-3 text-sm">
                {p.verified ? <BadgeCheck className="mt-0.5 shrink-0 text-ok" size={20} /> : <ShieldAlert className="mt-0.5 shrink-0 text-warn" size={20} />}
                <div>
                  <strong>{p.verified ? "100% Owner-Verified Listing" : "Verification Pending"}</strong>
                  <p className="text-xs text-mute mt-0.5">
                    {p.verified ? "Rent, house rules, and verified addresses confirmed directly with Luxora PG management." : "Some details are placeholders until owner review."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Clock className="mt-0.5 shrink-0 text-accent" size={20} />
                <div>
                  <strong>Last Verified & Updated</strong>
                  <p className="text-xs text-mute mt-0.5">{fmtDate(p.updatedAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm sm:col-span-2">
                <MapPin className="mt-0.5 shrink-0 text-accent" size={20} />
                <div>
                  <strong>Official Property Address</strong>
                  <p className="text-xs text-mute mt-0.5">
                    {p.address}
                    {p.mapUrl && (
                      <> · <a className="inline-flex items-center gap-1 text-brand underline font-medium" href={p.mapUrl} target="_blank" rel="noopener noreferrer">View on Google Maps <ExternalLink size={12} /></a></>
                    )}
                  </p>
                </div>
              </div>

              {p.metro && (
                <div className="flex items-start gap-3 text-sm sm:col-span-2">
                  <Train className="mt-0.5 shrink-0 text-brand" size={20} />
                  <div>
                    <strong>Nearest Metro Transit: {p.metro.station}</strong>
                    <p className="text-xs text-mute mt-0.5">
                      {p.metro.distanceKm} km ({p.metro.method === "route" ? "Actual road route distance" : "Straight-line distance"}){p.metro.verifiedAt ? ` · Field-checked on ${fmtDate(p.metro.verifiedAt)}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Sticky Inquiry & Visit Booking Sidebar */}
          <aside id="inquiry-sidebar" className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 lg:self-start scroll-mt-24" aria-label="Contact Coordinator">
            <div className="card card-3d p-5 sm:p-6 shadow-2xl border-brand/20 bg-surface/90 backdrop-blur-md">
              <div className="mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Direct PG Coordinator</span>
                <h3 className="text-lg font-bold text-ink">Schedule a Visit or Inquire</h3>
                <p className="text-xs text-mute mt-0.5">Zero brokerage. Direct booking with property management.</p>
              </div>
              <ContactActions message={waMessage(p)} phone={p.phone} />
              <div className="mt-5 border-t border-ink/10 pt-5">
                <InquiryForm
                  propertySlug={p.slug}
                  propertyName={p.name}
                  roomTypes={types}
                  compact={true}
                />
              </div>
            </div>
          </aside>
        </div>

        {/* FULL WIDTH SECTIONS (Spans 100% of container without awkward gutters or empty sidebars!) */}
        <div className="mt-16 space-y-16">
          {/* Interactive Room Visualizer */}
          <section aria-labelledby="tour-heading">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">360° Inspection</span>
              <h2 id="tour-heading" className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1">
                Interactive Room & Amenity Visualizer
              </h2>
              <p className="text-xs sm:text-sm text-mute mt-1">
                Toggle day/night ambient lighting and inspect study pods, bed mattress, and washrooms in 360° high definition.
              </p>
            </div>
            <InteractiveRoomTour rooms={p.rooms} />
          </section>

          {/* Available Room Types & Transparent Pricing Showcase (Full Width - Zero Horizontal Scroll!) */}
          <section>
            <RoomTypesShowcase
              rooms={p.rooms}
              propertyName={p.name}
              propertySlug={p.slug}
            />
          </section>

          {/* Custom Cost Estimator for this Property */}
          <section>
            <CostCalculator propertyName={p.name} />
          </section>

          {/* Included vs Paid Facilities (Full Width Grid - Zero Ellipsis/Truncations!) */}
          <section aria-labelledby="fac">
            <div className="mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Amenities & Living Standards</span>
              <h2 id="fac" className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1">
                Property Facilities & Services
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-mute">
                Clearly distinguishing all included daily amenities from optional paid services.
              </p>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
              {p.facilities.map((f) => (
                <li key={f.key} className="card flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl hover:border-brand/40 transition-all hover:shadow-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 border border-brand/20 shrink-0">
                      <FacilityIcon k={f.key} size={18} className={f.status === "not-available" ? "text-mute opacity-50 shrink-0" : "text-brand shrink-0"} />
                    </span>
                    <span className={`font-semibold text-xs sm:text-sm leading-snug ${f.status === "not-available" ? "text-mute line-through opacity-70" : "text-ink"}`}>
                      {f.name}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-bold ${
                      f.status === "included"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : f.status === "paid"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-ink/5 text-mute"
                    }`}
                  >
                    {FAC_LABEL[f.status]}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* House Rules & Safety Policies */}
          <section aria-labelledby="rules">
            <div className="mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Community Guidelines</span>
              <h2 id="rules" className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1">
                House Rules & Safety Policies
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-mute">
                Designed to protect student focus, cleanliness, and peace of mind.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {p.rules.map((x, i) => (
                <div key={i} className="card p-4 rounded-2xl flex items-start gap-3 hover:border-brand/30 transition-colors">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-ink leading-relaxed">{x}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Nearby Essentials */}
          {p.nearby.length > 0 && (
            <section aria-labelledby="near">
              <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
                <div>
                  <h2 id="near" className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Metro, Food & Daily Essentials</h2>
                  <p className="mt-1 text-xs sm:text-sm text-mute">
                    External local businesses and transit stations near this residence.
                  </p>
                </div>
                <Link href="/nearby" className="text-xs font-semibold text-brand hover:underline">
                  View Complete Ahmedabad Directory →
                </Link>
              </div>

              <MobileCardSlider
                itemCount={p.nearby.length}
                desktopGridClass="sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {p.nearby.map((n) => (
                  <div key={n.id} className="card p-4 flex flex-col justify-between w-[75vw] max-w-[270px] shrink-0 snap-start sm:w-auto sm:max-w-none rounded-2xl hover:border-brand/30 transition-colors">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-accent uppercase tracking-wider">
                          {CATEGORY_LABEL[n.category]}
                        </span>
                        {n.distanceKm != null && (
                          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink">
                            {n.distanceKm} km ({n.distanceMethod || "route"})
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm sm:text-base mt-1 text-ink">{n.name}</h4>
                      {n.address && <p className="text-[11px] sm:text-xs text-mute mt-0.5 line-clamp-1">{n.address}</p>}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] sm:text-[11px] text-mute border-t border-ink/10 pt-2">
                      <span>{n.source || "Field Survey"}</span>
                      <span>{n.lastVerified ? `Checked ${fmtDate(n.lastVerified)}` : "Verified Oct 2026"}</span>
                    </div>
                  </div>
                ))}
              </MobileCardSlider>
            </section>
          )}
        </div>
      </div>
      <ContactActions sticky message={waMessage(p)} phone={p.phone} />
    </>
  );
}
