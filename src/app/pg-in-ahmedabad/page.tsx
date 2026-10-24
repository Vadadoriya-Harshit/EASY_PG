import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BedDouble, MapPin, ShieldCheck } from "lucide-react";
import PGCard from "@/components/PGCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import InquiryForm from "@/components/InquiryForm";
import { listAreas, listProperties } from "@/lib/repo";
import { fetchCmsData, DEFAULT_CMS_DATA } from "@/lib/cms-store";
import { SHARING_PAGES, faqLd, itemListLd, rentSummary, rentText } from "@/lib/seo";
import { safeJsonLd } from "@/lib/http";
import { inr, rentRange } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const props = await listProperties();
  const areas = await listAreas();
  const rent = rentSummary(props);
  return {
    title: "PG in Ahmedabad: Boys & Girls PG Accommodation",
    description: `Compare ${props.length} PG${props.length === 1 ? "" : "s"} across ${areas.length} Ahmedabad localities${rent ? `, from ${inr(rent.min)} per month` : ""}. Single, double and triple sharing, facilities, house rules and metro distance.`,
    alternates: { canonical: "/pg-in-ahmedabad" },
  };
}

export default async function PgInAhmedabad() {
  const [props, areas, cms] = await Promise.all([listProperties(), listAreas(), fetchCmsData().catch(() => DEFAULT_CMS_DATA)]);
  const rent = rentSummary(props);
  const boys = props.filter((p) => p.gender === "boys");
  const girls = props.filter((p) => p.gender === "girls");
  const areaName = Object.fromEntries(areas.map((a) => [a.slug, a.name]));
  const perArea = areas.map((a) => {
    const list = props.filter((p) => p.area === a.slug);
    return { a, list, rent: rentSummary(list) };
  }).filter((x) => x.list.length > 0);
  const sharing = (Object.entries(SHARING_PAGES) as [keyof typeof SHARING_PAGES, (typeof SHARING_PAGES)[keyof typeof SHARING_PAGES]][]).map(([slug, s]) => {
    const list = props.filter((p) => p.rooms.some((r) => r.type === s.type));
    const rs = rentSummary(list.map((p) => ({ ...p, rooms: p.rooms.filter((r) => r.type === s.type) })));
    return { slug, s, list, rs };
  });
  const openNow = props.filter((p) => p.rooms.some((r) => r.availability === "now")).length;
  const faqs = (cms.faq?.categories || []).flatMap((c) => c.items).slice(0, 6);
  const crumbs = [{ name: "Home", href: "/" }, { name: "PG in Ahmedabad", href: "/pg-in-ahmedabad" }];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd("PG accommodation in Ahmedabad", props)) }} />
      {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd(faqs)) }} />}

      <div className="container-x py-8 sm:py-12">
        <Breadcrumbs items={crumbs} className="mb-5" />
        <header className="max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">PG accommodation in Ahmedabad</h1>
          <p className="mt-4 text-base leading-relaxed text-mute">
            Luxora PG lists {props.length} residence{props.length === 1 ? "" : "s"} for students and working professionals across {perArea.length} Ahmedabad localit{perArea.length === 1 ? "y" : "ies"}
            : {boys.length} for boys and {girls.length} for girls. Rent is shown {rent ? <>from <strong className="text-ink">{inr(rent.min)}</strong> up to <strong className="text-ink">{inr(rent.max)}</strong> per month</> : "on each listing"}, with deposit, what is included and what costs extra.
            {openNow > 0 && <> {openNow} listing{openNow === 1 ? " has" : "s have"} a room available right now.</>}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/pgs" className="btn btn-primary min-h-[44px] gap-2">Browse all PGs <ArrowRight size={16} /></Link>
            <Link href="/pgs/boys" className="btn btn-ghost min-h-[44px] border border-ink/15">Boys PG in Ahmedabad</Link>
            <Link href="/pgs/girls" className="btn btn-ghost min-h-[44px] border border-ink/15">Girls PG in Ahmedabad</Link>
          </div>
        </header>

        <section className="mt-14" aria-labelledby="by-area">
          <h2 id="by-area" className="text-2xl font-bold text-ink">PG by locality in Ahmedabad</h2>
          <p className="mt-1 text-sm text-mute">Pick the neighbourhood closest to your college or office. Each page lists nearby metro stations and essentials.</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {perArea.map(({ a, list, rent: r }) => (
              <li key={a.slug}>
                <Link href={`/areas/${a.slug}`} className="card block h-full border-ink/10 p-5 transition hover:border-brand/50 hover:shadow-md">
                  <MapPin size={18} className="text-brand" aria-hidden="true" />
                  <h3 className="mt-2 text-base font-bold text-ink">PG in {a.name}</h3>
                  <p className="mt-1 text-xs text-mute">{list.length} PG{list.length === 1 ? "" : "s"}{r ? ` · ${rentText(r)}` : ""}</p>
                  {a.landmarks[0] && <p className="mt-2 text-xs text-mute">Near {a.landmarks.slice(0, 2).join(", ")}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14" aria-labelledby="by-sharing">
          <h2 id="by-sharing" className="text-2xl font-bold text-ink">Single, double and triple sharing PG</h2>
          <p className="mt-1 text-sm text-mute">Sharing changes the monthly cost the most. Compare what is on offer today.</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-3">
            {sharing.map(({ slug, s, list, rs }) => (
              <li key={slug}>
                <Link href={`/pg-in-ahmedabad/${slug}`} className="card block h-full border-ink/10 p-5 transition hover:border-brand/50 hover:shadow-md">
                  <BedDouble size={18} className="text-brand" aria-hidden="true" />
                  <h3 className="mt-2 text-base font-bold text-ink">{s.label}-sharing PG in Ahmedabad</h3>
                  <p className="mt-1 text-xs text-mute">{list.length ? `${list.length} PG${list.length === 1 ? "" : "s"} · ${rentText(rs)}` : "Not currently listed"}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14" aria-labelledby="featured-pgs">
          <h2 id="featured-pgs" className="text-2xl font-bold text-ink">Available PGs</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {props.slice(0, 6).map((p) => <PGCard key={p.slug} p={p} areaName={areaName[p.area] || p.area} isSliderItem={false} />)}
          </div>
          {props.length > 6 && <p className="mt-5"><Link href="/pgs" className="font-semibold text-brand hover:underline">See all {props.length} PGs →</Link></p>}
        </section>

        <section className="mt-14 max-w-3xl" aria-labelledby="choose">
          <h2 id="choose" className="text-2xl font-bold text-ink">How to choose a PG in Ahmedabad</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-mute marker:font-bold marker:text-brand">
            <li><strong className="text-ink">Check the full monthly cost.</strong> Ask what the rent includes (food, Wi-Fi, housekeeping) and what is billed separately, such as AC electricity. Each Luxora listing shows included and paid-extra items.</li>
            <li><strong className="text-ink">Understand the deposit.</strong> Confirm the amount, when it is refunded and any notice period before you pay.</li>
            <li><strong className="text-ink">Measure the commute.</strong> Compare the walking distance to the nearest metro station and to your college or office. Listings show how each distance was measured.</li>
            <li><strong className="text-ink">Read the house rules.</strong> Gate timings, visitor policy and quiet hours differ between residences.</li>
            <li><strong className="text-ink">Visit before you commit.</strong> Book a free visit and look at the actual room, washroom and common areas.</li>
          </ol>
        </section>

        {faqs.length > 0 && (
          <section className="mt-14 max-w-3xl" aria-labelledby="faq-h">
            <h2 id="faq-h" className="text-2xl font-bold text-ink">PG in Ahmedabad: common questions</h2>
            <div className="card mt-4 divide-y divide-ink/10 border-ink/10">
              {faqs.map((f, i) => (
                <details key={i} className="group p-5">
                  <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between gap-4 font-bold text-ink"><span>{f.q}</span><span aria-hidden="true" className="text-brand transition group-open:rotate-45">+</span></summary>
                  <p className="mt-3 text-sm leading-relaxed text-mute">{f.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-4"><Link href="/faq" className="text-sm font-semibold text-brand hover:underline">Read all FAQs →</Link></p>
          </section>
        )}

        <section className="mt-14" aria-labelledby="enquire">
          <div className="card grid gap-8 border-brand/20 p-6 sm:p-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h2 id="enquire" className="text-2xl font-bold text-ink">Tell us what you need</h2>
              <p className="mt-2 text-sm leading-relaxed text-mute">Share your number and a coordinator will call you back with options that match your budget and locality.</p>
              <p className="mt-4 flex items-center gap-2 text-xs text-mute"><ShieldCheck size={15} className="text-emerald-500" aria-hidden="true" /> No brokerage. Your number is used only to contact you about PG availability.</p>
            </div>
            <div className="lg:col-span-3"><InquiryForm areas={areas} /></div>
          </div>
        </section>
      </div>
    </>
  );
}
