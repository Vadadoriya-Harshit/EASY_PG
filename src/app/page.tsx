import Link from "next/link";
import { ArrowUpRight, GitCompareArrows, MapPinned, Sparkles, CalendarCheck, Wallet, ShieldCheck, CheckCircle2, Train, UtensilsCrossed, Star } from "lucide-react";
import { listAreas, listProperties, isDemoStore } from "@/lib/repo";
import { fetchCmsData } from "@/lib/cms-store";
import Hero from "@/components/Hero";
import SearchWidget from "@/components/SearchWidget";
import PGCard from "@/components/PGCard";
import Reveal from "@/components/Reveal";
import SpotlightCard from "@/components/SpotlightCard";
import CountUp from "@/components/CountUp";
import InquiryForm from "@/components/InquiryForm";
import DemoNotice from "@/components/DemoNotice";
import InteractiveRoomTour from "@/components/InteractiveRoomTour";
import CostCalculator from "@/components/CostCalculator";
import Testimonials from "@/components/Testimonials";
import TrustMarquee from "@/components/TrustMarquee";
import LifestyleTabs from "@/components/LifestyleTabs";
import AreaCardsGrid from "@/components/AreaCardsGrid";

export const revalidate = 60;

export default async function Home() {
  const [props, areas, cms] = await Promise.all([listProperties(), listAreas(), fetchCmsData()]);
  const featured = (props.filter((p) => p.featured).length ? props.filter((p) => p.featured) : props).slice(0, 3);
  const areaName = Object.fromEntries(areas.map((a) => [a.slug, a.name]));
  const counts = areas.map((a) => ({ a, n: props.filter((p) => p.area === a.slug).length }));
  const boys = props.filter((p) => p.gender === "boys").length;
  const girls = props.filter((p) => p.gender === "girls").length;

  return (
    <>
      {/* 1. Cinematic Hero with Automatic Rotating Background & Search Widget */}
      <Hero initialHero={cms.hero}>
        <SearchWidget areas={areas} />
      </Hero>


      {/* 2. Institutional & University Trust Marquee */}
      <TrustMarquee />

      {/* 3. Featured Verified Properties Grid */}
      <section className="section section-ambient" aria-labelledby="featured">
        <div className="container-x">
          <DemoNotice show={isDemoStore()} />
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Handpicked Accommodations</span>
              <h2 id="featured" className="mt-1 max-w-xl text-3xl font-bold sm:text-5xl text-ink">
                Rooms people are asking about this week
              </h2>
            </div>
            <Link href="/pgs" className="btn btn-ghost text-xs">
              See all {props.length} PGs <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.08}>
                <PGCard p={p} areaName={areaName[p.area] || p.area} />
              </Reveal>
            ))}
          </div>

          {featured.length === 0 && (
            <p className="card p-10 text-center text-mute">
              Properties are being added. Send an inquiry and we'll get back to you.
            </p>
          )}
        </div>
      </section>

      {/* 4. Lifestyle & Amenities Interactive Tabs */}
      <LifestyleTabs />

      {/* 5. Interactive 360 Room Inspection Visualizer */}
      <section className="section pt-0 section-ambient-dual" aria-label="Interactive Room Inspection">
        <div className="container-x">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Virtual Exploration</span>
              <h2 className="mt-1 text-3xl font-bold sm:text-4xl text-ink">
                Inspect Rooms & Common Spaces in High Definition
              </h2>
              <p className="mt-1 text-sm text-mute">
                Switch between day & cozy night lighting, click pins to check mattress quality, study desks, and ensuite washrooms.
              </p>
            </div>
            <Link href="/gallery" className="btn btn-ghost text-xs">
              View Complete Photo Gallery <ArrowUpRight size={14} />
            </Link>
          </div>
          <InteractiveRoomTour />
        </div>
      </section>

      {/* 6. Live Cost Estimator Calculator */}
      <section className="section pt-0" aria-label="Transparent Cost Estimator" id="calculator">
        <div className="container-x">
          <CostCalculator />
        </div>
      </section>

      {/* 7. Decision Accelerator Grid (Smart Match, Compare, Full Cost) */}
      <section className="section pt-0 section-ambient-warm" aria-labelledby="tools">
        <div className="container-x">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">Hassle-Free Decision</span>
            <h2 id="tools" className="mt-1 max-w-2xl text-3xl font-bold sm:text-5xl text-ink">
              Decide faster, with fewer phone calls
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-6 md:grid-rows-2">
            <SpotlightCard className="flex flex-col justify-between p-7 md:col-span-3 md:row-span-2 border-brand/20">
              <div>
                <Sparkles className="text-brand h-9 w-9" />
                <h3 className="mt-5 text-2xl font-bold text-ink">Smart PG Matcher</h3>
                <p className="mt-2 max-w-sm text-sm text-mute leading-relaxed">
                  Answer five quick questions about area, budget, sharing and commute. We'll show the best matches and say exactly why each one fits your criteria.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs text-mute">
                  <span className="rounded-full bg-ink/5 px-2.5 py-1">✓ Budget Match</span>
                  <span className="rounded-full bg-ink/5 px-2.5 py-1">✓ Metro Proximity</span>
                  <span className="rounded-full bg-ink/5 px-2.5 py-1">✓ Food Preference</span>
                </div>
              </div>
              <Link href="/match" className="btn btn-primary mt-8 self-start text-xs">
                Find my match <ArrowUpRight size={15} />
              </Link>
            </SpotlightCard>

            <SpotlightCard className="p-6 md:col-span-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <Wallet className="text-accent h-7 w-7" />
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">Zero Hidden Fees</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink">Full cost up front</h3>
                <p className="mt-1 text-xs text-mute leading-relaxed">
                  Monthly rent, deposit, what's included and any extra charges. Sub-meter electricity and room rules are clearly stated before you sign.
                </p>
              </div>
              <Link href="/facilities" className="mt-4 text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">
                View all included amenities <ArrowUpRight size={13} />
              </Link>
            </SpotlightCard>

            <SpotlightCard className="p-6 md:col-span-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <GitCompareArrows className="text-accent h-7 w-7" />
                  <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-semibold text-mute">Side-by-Side</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink">Compare up to 3 stays</h3>
                <p className="mt-1 text-xs text-mute leading-relaxed">
                  Compare rent, deposit, sharing options, attached washroom, gate timings, and walking commute side by side.
                </p>
              </div>
              <Link href="/compare" className="mt-4 text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">
                Open comparison table <ArrowUpRight size={13} />
              </Link>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* 8. Verified Metro & Nashta Commute Banner */}
      <section className="section pt-0" aria-labelledby="metro-nashta">
        <div className="container-x">
          <SpotlightCard className="overflow-hidden p-6 sm:p-10 border-accent/30 bg-gradient-to-br from-surface via-surface to-accent/10 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3.5 py-1 text-xs font-bold text-accent">
                  <Train size={14} /> Metro & Nashta Explorer
                </span>
                <h2 id="metro-nashta" className="mt-3 text-2xl font-bold sm:text-4xl text-ink">
                  Know exactly how far the metro, tea, and tiffin are before moving in
                </h2>
                <p className="mt-2 text-sm text-mute leading-relaxed">
                  Every property includes verified walking route distances to Doordarshan Kendra, Commerce Six Roads, and Thaltej metro stations, plus nearby Kathiyawadi tiffin centres, live gathiya points, and 24/7 pharmacies.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-mute font-medium">
                  <span className="flex items-center gap-1"><Train size={14} className="text-accent" /> Verified road route KM</span>
                  <span className="flex items-center gap-1"><UtensilsCrossed size={14} className="text-brand" /> Third-party tiffin & snacks</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-ok" /> Field-surveyed in Oct 2026</span>
                </div>
              </div>
              <Link href="/nearby" className="btn btn-primary text-xs shadow-lg shadow-accent/25">
                Explore Metro & Food Map <ArrowUpRight size={15} />
              </Link>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* 9. Locality Hubs / Neighbourhood Guide */}
      <section className="section pt-0 section-ambient" aria-labelledby="areas">
        <div className="container-x">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Neighbourhood Guide</span>
              <h2 id="areas" className="mt-1 text-3xl font-bold sm:text-5xl text-ink">
                Pick your neighbourhood in Ahmedabad
              </h2>
            </div>
            <Link href="/areas" className="btn btn-ghost text-xs">
              All areas <ArrowUpRight size={15} />
            </Link>
          </div>

          <AreaCardsGrid
            areas={areas}
            counts={Object.fromEntries(counts.map(({ a, n }) => [a.slug, n]))}
          />
        </div>
      </section>

      {/* 10. Auto-Rotating Resident Reviews Slider */}
      <Testimonials />

      {/* 11. Transparency Metrics Strip */}
      {props.length > 0 && (
        <section className="section pt-0" aria-label="Luxora PG at a glance">
          <div className="container-x">
            <dl className="card grid divide-y divide-ink/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0 shadow-lg">
              {[
                ["Active Residences", props.length],
                ["Key Localities", areas.length],
                ["Boys & Girls PGs", null],
                ["Zero Brokerage Fee", "₹0"],
              ].map(([l, v], i) => (
                <div key={i} className="p-8 text-center">
                  <dd className="font-display text-4xl font-extrabold sm:text-5xl text-brand">
                    {v === null ? (
                      <>
                        <CountUp value={boys} />B / <CountUp value={girls} />G
                      </>
                    ) : typeof v === "number" ? (
                      <CountUp value={v} />
                    ) : (
                      <span>{v}</span>
                    )}
                  </dd>
                  <dt className="mt-2 text-xs font-bold uppercase tracking-wider text-mute">{l}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* 12. Direct Inquiry & Free Guided Walkthrough Form */}
      <section className="section pt-0 section-ambient-dual relative" aria-labelledby="cta">
        <div className="container-x relative">
          <div className="card grid gap-10 p-6 sm:p-12 lg:grid-cols-12 overflow-hidden border-brand/25 shadow-2xl relative bg-gradient-to-br from-surface via-surface to-brand/[0.04]">
            {/* Subtle animated ambient spotlight inside */}
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-[90px] animate-ambient-drift pointer-events-none" />
            <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-accent/15 blur-[90px] animate-ambient-drift-rev pointer-events-none" />

            <div className="flex flex-col justify-center lg:col-span-5 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">Direct Contact Desk</span>
              <h2 id="cta" className="mt-2 text-3xl font-bold sm:text-5xl text-ink">
                Tell us what you need
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-mute">
                Share your number and preferred locality. A dedicated property coordinator will call you back within 30 minutes with available room options and arrange a free guided visit.
              </p>

              <div className="mt-8 space-y-3 text-xs text-mute font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-ok" />
                  <span>No spam calls: your number is shared only with the house manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-brand" />
                  <span>Free visit scheduling with no commitment required</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 relative z-10">
              <InquiryForm areas={areas} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
