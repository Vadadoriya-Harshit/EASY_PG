import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Users,
  PhoneCall,
} from "lucide-react";
import SpotlightCard from "@/components/SpotlightCard";
import { fetchCmsData } from "@/lib/cms-store";
import AboutInteractiveHero from "@/components/AboutInteractiveHero";
import AboutTimeline from "@/components/AboutTimeline";
import TrustMarquee from "@/components/TrustMarquee";
import Testimonials from "@/components/Testimonials";
import DynamicIcon from "@/components/DynamicIcon";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About Luxora PG | Our Story, Living Standards & Safety Protocols",
  description: "Discover how Luxora PG is setting the gold standard for student and professional housing in Ahmedabad with transparent pricing, biometric safety, and homestyle food.",
  alternates: { canonical: "/about" },
};

export default async function About() {
  const cms = await fetchCmsData();
  const about = cms.about;
  const contact = cms.contact;

  return (
    <>
      {/* 1. Cinematic Interactive Hero with Automatic Rotating Background & Audio/Tour CTAs */}
      <AboutInteractiveHero />

      {/* 2. Institutional Marquee Ticker */}
      <TrustMarquee />

      <div className="container-x py-16 space-y-20">
        {/* 3. The Origin Story & Mission Section (Dynamic from CMS) */}
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              {about.originBadge || "The Luxora Origin Story"}
            </span>
            <h2 className="text-3xl font-extrabold sm:text-5xl text-ink leading-tight">
              {about.originTitle || "Built out of frustration with broker scams & hidden fees"}
            </h2>
            <p className="text-sm text-mute leading-relaxed">
              {about.originP1 || "Anyone who has searched for a paying-guest room in Ahmedabad knows the frustration: deceptive photos that look nothing like reality, brokers demanding thousands in non-refundable commission, and surprise utility bills at the end of the month."}
            </p>
            <p className="text-sm text-mute leading-relaxed">
              {about.originP2 || "At Luxora PG, we dismantled that broken model. We own and operate dedicated residences across Satellite, Vastrapur, Navrangpura, and Thaltej. We publish high-resolution actual photos, exact room dimensions, real meter rates, and route-checked walking distances to metro stations."}
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/pgs" className="btn btn-primary text-xs gap-2">
                Browse Verified Stays <ArrowRight size={15} />
              </Link>
              <Link href="/contact" className="btn btn-ghost text-xs">
                Schedule a Visit
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-ink/10 shadow-2xl">
              <img loading="lazy" decoding="async"
                src={about.originImage || "/images/hero-building.jpg"}
                alt="Luxora PG Flagship Residence Ahmedabad"
                className="w-full object-cover aspect-[4/3] transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="rounded-full bg-brand/35 px-3 py-1 text-xs font-bold text-brand backdrop-blur-md">
                  Flagship Campus
                </span>
                <h3 className="mt-2 text-2xl font-bold">Luxora Residence, Satellite Ahmedabad</h3>
                <p className="text-xs text-slate-300 mt-1">
                  {about.statBeds || "500+ Beds Managed"} · {about.statRating || "4.8★ Rating"} · 100 Mbps Dual Wi-Fi
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Interactive Growth Timeline */}
        <section aria-labelledby="timeline-title">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Our Journey in Ahmedabad
            </span>
            <h2 id="timeline-title" className="mt-1 text-3xl font-bold sm:text-5xl text-ink">
              From One Building to Gujarat’s Benchmark Network
            </h2>
            <p className="mt-2 text-sm text-mute">
              Click through the years to see how we systematically solved each accommodation challenge for residents.
            </p>
          </div>

          <AboutTimeline />
        </section>

        {/* 5. Core Guarantees of the Luxora Promise (Dynamic from CMS) */}
        <section aria-labelledby="pillars-title">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Our Core Commitments
            </span>
            <h2 id="pillars-title" className="mt-1 text-3xl font-bold sm:text-5xl text-ink">
              The {about.pillars?.length || 6} Guarantees of Every Luxora Stay
            </h2>
            <p className="mt-2 text-sm text-mute">
              These principles guide how our properties are constructed, maintained, and operated every day.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(about.pillars || []).map((p, idx) => (
              <SpotlightCard key={idx} className="p-7 flex flex-col justify-between border-ink/10">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <DynamicIcon name={p.icon} size={24} />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-ink">{p.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-mute">{p.desc}</p>
                </div>
                <div className="mt-6 border-t border-ink/10 pt-3 flex items-center gap-1.5 text-[11px] font-bold text-ok">
                  <CheckCircle2 size={13} /> Luxora Verified Standard
                </div>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* 6. The Safety Shield (Dynamic from CMS) */}
        <section className="card p-8 sm:p-12 border-brand/20 bg-gradient-to-br from-surface via-surface to-brand/5 shadow-2xl">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <ShieldCheck size={16} /> Uncompromising Resident Protection
            </span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl text-ink">
              The Luxora Security Protocol
            </h2>
            <p className="mt-2 text-xs text-mute leading-relaxed">
              Designed in collaboration with security experts and resident student feedback to balance safety with freedom.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(about.securitySteps || []).map((s) => (
              <div key={s.step} className="rounded-2xl border border-ink/10 bg-bg/80 p-5 space-y-3">
                <span className="font-display text-3xl font-extrabold text-brand/40">
                  {s.step}
                </span>
                <h3 className="font-bold text-base text-ink">{s.title}</h3>
                <p className="text-xs text-mute leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Traditional Local PG vs Luxora PG Standard */}
        <section className="card p-8 border-ink/10 shadow-xl overflow-hidden">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Direct Comparison
            </span>
            <h2 className="mt-1 text-2xl font-bold sm:text-4xl text-ink">
              How We Compare to Traditional Local PGs
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm text-left">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-mute">
                  <th className="py-3 px-4">Standard Metric</th>
                  <th className="py-3 px-4 text-warn font-semibold">Traditional Local PG</th>
                  <th className="py-3 px-4 text-brand font-bold">Luxora PG Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 text-xs">
                <tr>
                  <td className="py-4 px-4 font-bold text-ink">Brokerage Charges</td>
                  <td className="py-4 px-4 text-mute">15 to 30 days rent commission</td>
                  <td className="py-4 px-4 font-bold text-ok">Zero Brokerage · Direct Owner Management</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-ink">Security Deposit Refund</td>
                  <td className="py-4 px-4 text-mute">Frequent delays, disputes & deductions</td>
                  <td className="py-4 px-4 font-bold text-ok">100% Refunded in 5 days upon 30-day notice</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-ink">Wi-Fi Quality</td>
                  <td className="py-4 px-4 text-mute">Single consumer router with dead spots</td>
                  <td className="py-4 px-4 font-bold text-ok">Commercial 100 Mbps Dual Line Fiber Mesh</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-ink">Security & Supervision</td>
                  <td className="py-4 px-4 text-mute">Basic padlock, no dedicated resident wardens</td>
                  <td className="py-4 px-4 font-bold text-ok">Biometric Turnstiles + 24/7 CCTV & Resident Wardens</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-ink">Study Culture</td>
                  <td className="py-4 px-4 text-mute">Noisy corridors with zero quiet study spaces</td>
                  <td className="py-4 px-4 font-bold text-ok">Dedicated silent co-working study carrels</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-ink">Electricity Billing</td>
                  <td className="py-4 px-4 text-mute">Arbitrary shared fixed charges</td>
                  <td className="py-4 px-4 font-bold text-ok">Transparent digital sub-meter per room at govt tariff</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 8. Auto-Rotating Resident Testimonials Carousel */}
        <Testimonials />

        {/* 9. Meet The Coordinators CTA Banner */}
        <section className="card p-8 sm:p-12 text-center bg-gradient-to-r from-brand/15 via-accent/15 to-transparent border-brand/20 shadow-xl">
          <Users size={36} className="mx-auto text-brand" />
          <h3 className="mt-3 text-2xl font-bold sm:text-3xl text-ink">
            Experience the Luxora PG Difference in Person
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-mute max-w-xl mx-auto leading-relaxed">
            Schedule a free guided visit at any of our residences in Satellite, Vastrapur, Navrangpura, or Thaltej.
            Inspect the study lounges, test the Wi-Fi speed, and speak with existing residents.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn btn-primary text-xs gap-2">
              Book a Free Walkthrough <ArrowRight size={15} />
            </Link>
            <a href={`tel:${contact.phone || "+91 98250 12345"}`} className="btn btn-ghost text-xs gap-2">
              <PhoneCall size={14} /> Call Coordinator: {contact.phone || "+91 98250 12345"}
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
