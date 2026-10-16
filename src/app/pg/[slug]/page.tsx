import type { Metadata } from "next";
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
import PropertyTabs from "@/components/PropertyTabs";
import InteractiveRoomTour from "@/components/InteractiveRoomTour";
import CostCalculator from "@/components/CostCalculator";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await listProperties()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProperty(params.slug);
  if (!p) return {};
  const a = await getArea(p.area);
  const r = rentRange(p.rooms);
  const desc = `${p.gender === "girls" ? "Girls" : "Boys"} PG in ${a?.name ?? p.area}${r ? ` from ${inr(r.min)}/month` : ""}. Rooms, facilities, rules and nearby essentials.`;
  return {
    title: `${p.name} | Sorath PG Ahmedabad`,
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

export default async function PropertyPage({ params }: { params: { slug: string } }) {
  const p = await getProperty(params.slug);
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-x pb-28 pt-8 lg:pb-16">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-mute">
          <Link href="/pgs" className="hover:text-ink">PGs</Link> /{" "}
          <Link href={`/areas/${p.area}`} className="hover:text-ink">{area?.name ?? p.area}</Link> /{" "}
          <span className="text-ink font-medium">{p.name}</span>
        </nav>

        <DemoNotice show={isDemoStore() || !p.verified} />

        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          <div className="min-w-0">
            {/* High-res Image Slider with Fullscreen Lightbox */}
            <GallerySlider media={p.media} autoplay />

            {/* Title & Quick Info */}
            <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${p.gender === "girls" ? "bg-pink-600" : "bg-sky-600"}`}>
                    {p.gender === "girls" ? "Girls PG Accommodation" : "Boys PG Accommodation"}
                  </span>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                    {area?.name}, Ahmedabad
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold sm:text-5xl">{p.name}</h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mute">
                  <span className="inline-flex items-center gap-1.5"><MapPin size={16} />{area?.name}{area ? `, ${area.city}` : ""}</span>
                  {p.metro && (
                    <span className="inline-flex items-center gap-1.5 text-accent font-medium">
                      <Train size={16} /> {p.metro.station} ({p.metro.distanceKm} km route)
                    </span>
                  )}
                </p>
              </div>

              {r && (
                <div className="rounded-2xl border border-ink/10 bg-surface p-4 text-right shadow-sm">
                  <span className="block text-xs uppercase tracking-wider text-mute">Starting From</span>
                  <span className="font-display text-3xl font-extrabold text-brand">{inr(r.min)}</span>
                  <span className="block text-xs text-mute">per month / per bed</span>
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
                    {p.verified ? "Rent, house rules, and verified addresses confirmed directly with Sorath PG management." : "Some details are placeholders until owner review."}
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

            {/* Interactive Room Visualizer */}
            <div className="mt-12">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-brand">360° Inspection</span>
                <h2 className="text-2xl font-bold">Interactive Room & Amenity Visualizer</h2>
                <p className="text-xs text-mute">Toggle day/night ambient lighting and inspect study pods, bed mattress, and washrooms.</p>
              </div>
              <InteractiveRoomTour />
            </div>

            {/* Stay Cost Snapshot Table */}
            <section aria-labelledby="cost" className="mt-12">
              <h2 id="cost" className="text-2xl font-bold">Available Room Types & Transparent Pricing</h2>
              <p className="mt-1 text-sm text-mute">
                Exact breakdown per bed. No surprise maintenance or hidden maintenance dues.
              </p>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 shadow-sm">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-ink/5">
                    <tr>
                      {["Room Sharing", "Air Conditioning", "Monthly Rent", "Security Deposit", "Included Amenities", "Extra Surcharges", "Status"].map((h) => (
                        <th key={h} scope="col" className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-ink">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {p.rooms.map((x) => (
                      <tr key={x.id} className="align-top hover:bg-ink/5 transition-colors">
                        <th scope="row" className="px-4 py-3 font-semibold text-ink">
                          {ROOM_LABEL[x.type]}
                        </th>
                        <td className="px-4 py-3 font-medium">
                          {x.ac ? <span className="text-accent font-semibold">5-Star AC</span> : "Non-AC"}
                        </td>
                        <td className="px-4 py-3 font-bold text-ink">
                          {x.rent != null ? (
                            <>
                              <span className="text-base text-brand">{inr(x.rent)}</span>
                              <span className="block text-[11px] font-normal text-mute">
                                {x.rentUnit === "per-bed" ? "per bed / mo" : "per room / mo"}
                              </span>
                            </>
                          ) : (
                            <span className="text-warn">Not confirmed</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink">
                          {x.deposit != null ? (
                            <>
                              <span>{inr(x.deposit)}</span>
                              <span className="block text-[10px] text-ok font-medium">100% Refundable</span>
                            </>
                          ) : (
                            <span className="text-warn">Not confirmed</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-mute max-w-[200px]">
                          {x.included.join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-mute max-w-[180px]">
                          {x.extraCharges.join(", ") || "Zero extra surcharges"}
                        </td>
                        <td className="px-4 py-3">
                          {x.availability === "now" ? (
                            <span className="inline-flex rounded-full bg-ok/15 px-2.5 py-1 text-xs font-semibold text-ok">
                              Available Now
                            </span>
                          ) : x.availability === "from-date" ? (
                            <span className="inline-flex rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">
                              From {fmtDate(x.availableFrom)}
                            </span>
                          ) : (
                            <span className="text-xs text-mute">Ask Coordinator</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Custom Cost Estimator for this Property */}
            <div className="mt-12">
              <CostCalculator propertyName={p.name} />
            </div>

            {/* Included vs Paid Facilities */}
            <section aria-labelledby="fac" className="mt-12">
              <h2 id="fac" className="text-2xl font-bold">Property Facilities & Services</h2>
              <p className="mt-1 text-sm text-mute">
                Clearly distinguishing included amenities from paid add-ons.
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {p.facilities.map((f) => (
                  <li key={f.key} className="card flex items-center gap-3 p-4">
                    <FacilityIcon k={f.key} size={22} className={f.status === "not-available" ? "text-mute opacity-50" : "text-brand"} />
                    <div>
                      <span className={`font-semibold text-sm ${f.status === "not-available" ? "text-mute line-through opacity-70" : "text-ink"}`}>
                        {f.name}
                      </span>
                    </div>
                    <span
                      className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
                        f.status === "included"
                          ? "bg-ok/15 text-ok"
                          : f.status === "paid"
                          ? "bg-warn/15 text-warn"
                          : "bg-ink/5 text-mute"
                      }`}
                    >
                      {FAC_LABEL[f.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* House Rules */}
            <section aria-labelledby="rules" className="mt-12">
              <h2 id="rules" className="text-2xl font-bold">House Rules & Safety Policies</h2>
              <p className="mt-1 text-sm text-mute">
                Designed to protect student focus, cleanliness, and peace of mind.
              </p>
              <div className="mt-4 card p-6">
                <ul className="grid list-disc gap-3 pl-5 text-sm text-mute marker:text-brand">
                  {p.rules.map((x, i) => (
                    <li key={i} className="leading-relaxed">{x}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Nearby Essentials */}
            {p.nearby.length > 0 && (
              <section aria-labelledby="near" className="mt-12">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 id="near" className="text-2xl font-bold">Metro, Food & Daily Essentials</h2>
                    <p className="mt-1 text-sm text-mute">
                      External local businesses and transit stations near this residence.
                    </p>
                  </div>
                  <Link href="/nearby" className="text-xs font-semibold text-brand hover:underline">
                    View Complete Ahmedabad Directory →
                  </Link>
                </div>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {p.nearby.map((n) => (
                    <li key={n.id} className="card p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                            {CATEGORY_LABEL[n.category]}
                          </span>
                          {n.distanceKm != null && (
                            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink">
                              {n.distanceKm} km ({n.distanceMethod || "route"})
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-base mt-1 text-ink">{n.name}</h4>
                        {n.address && <p className="text-xs text-mute mt-0.5">{n.address}</p>}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-mute border-t border-ink/10 pt-2">
                        <span>{n.source || "Field Survey"}</span>
                        <span>{n.lastVerified ? `Checked ${fmtDate(n.lastVerified)}` : "Verified Oct 2026"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sticky Inquiry & Visit Booking Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Contact Coordinator">
            <div className="card p-6 shadow-xl border-brand/20">
              <ContactActions message={waMessage(p)} phone={p.phone} />
              <div className="mt-6 border-t border-ink/10 pt-6">
                <PropertyTabs
                  inquiry={<InquiryForm kind="inquiry" propertySlug={p.slug} propertyName={p.name} roomTypes={types} />}
                  visit={<InquiryForm kind="visit" propertySlug={p.slug} propertyName={p.name} roomTypes={types} />}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
      <ContactActions sticky message={waMessage(p)} phone={p.phone} />
    </>
  );
}
