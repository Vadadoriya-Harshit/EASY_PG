import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PGCard from "@/components/PGCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { listAreas, listProperties } from "@/lib/repo";
import { SHARING_PAGES, itemListLd, rentSummary, rentText, type SharingSlug } from "@/lib/seo";
import { safeJsonLd } from "@/lib/http";
import { inr } from "@/lib/utils";

export const revalidate = 300;
export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(SHARING_PAGES).map((sharing) => ({ sharing }));

async function load(slug: SharingSlug) {
  const s = SHARING_PAGES[slug];
  const [all, areas] = await Promise.all([listProperties(), listAreas()]);
  // keep only the matching room type so the rent range and cards describe THIS sharing option
  const list = all.filter((p) => p.rooms.some((r) => r.type === s.type)).map((p) => ({ ...p, rooms: p.rooms.filter((r) => r.type === s.type) }));
  return { s, list, areas, rent: rentSummary(list) };
}

export async function generateMetadata({ params }: { params: { sharing: string } }): Promise<Metadata> {
  const slug = params.sharing as SharingSlug;
  if (!SHARING_PAGES[slug]) return {};
  const { s, list, rent } = await load(slug);
  return {
    title: `${s.label}-sharing PG in Ahmedabad${rent ? ` from ${inr(rent.min)}` : ""}`,
    description: list.length
      ? `${list.length} PG${list.length === 1 ? "" : "s"} in Ahmedabad with ${s.plural}: rent ${rentText(rent)}, facilities, rules and metro distance.`
      : `${s.label}-sharing PG options in Ahmedabad.`,
    alternates: { canonical: `/pg-in-ahmedabad/${slug}` },
    // a page with nothing to show is not worth indexing
    robots: list.length ? undefined : { index: false, follow: true },
  };
}

export default async function SharingPage({ params }: { params: { sharing: string } }) {
  const slug = params.sharing as SharingSlug;
  if (!SHARING_PAGES[slug]) notFound();
  const { s, list, areas, rent } = await load(slug);
  const areaName = Object.fromEntries(areas.map((a) => [a.slug, a.name]));
  const localities = Array.from(new Set(list.map((p) => areaName[p.area] || p.area)));
  const open = list.filter((p) => p.rooms.some((r) => r.availability === "now")).length;
  const crumbs = [{ name: "Home", href: "/" }, { name: "PG in Ahmedabad", href: "/pg-in-ahmedabad" }, { name: `${s.label}-sharing PG`, href: `/pg-in-ahmedabad/${slug}` }];
  const others = (Object.entries(SHARING_PAGES) as [SharingSlug, (typeof SHARING_PAGES)[SharingSlug]][]).filter(([k]) => k !== slug);

  return (
    <>
      {list.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd(`${s.label}-sharing PG in Ahmedabad`, list)) }} />}
      <div className="container-x py-8 sm:py-12">
        <Breadcrumbs items={crumbs} className="mb-5" />
        <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">{s.label}-sharing PG in Ahmedabad</h1>
        {list.length > 0 ? (
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-mute">
            {list.length} Luxora PG residence{list.length === 1 ? " offers" : "s offer"} {s.plural}, priced {rentText(rent)}
            {localities.length ? <> in {localities.join(", ")}</> : null}.
            {open > 0 && <> {open} {open === 1 ? "has" : "have"} a bed available now.</>} Rent is per bed or per room as marked on each listing.
          </p>
        ) : (
          <p className="mt-4 max-w-3xl text-base text-mute">We do not have {s.plural} listed right now. Browse <Link href="/pgs" className="font-semibold text-brand hover:underline">all PGs</Link> or ask us on the <Link href="/contact" className="font-semibold text-brand hover:underline">contact page</Link>; you can also get an email when a bed opens up.</p>
        )}

        {list.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => <PGCard key={p.slug} p={p} areaName={areaName[p.area] || p.area} isSliderItem={false} />)}
          </div>
        )}

        <nav aria-label="Other sharing options" className="mt-12 border-t border-ink/10 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-mute">Compare other options</h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {others.map(([k, o]) => <li key={k}><Link href={`/pg-in-ahmedabad/${k}`} className="btn btn-ghost min-h-[44px] border border-ink/15 text-sm">{o.label}-sharing PG</Link></li>)}
            <li><Link href="/pg-in-ahmedabad" className="btn btn-ghost min-h-[44px] border border-ink/15 text-sm">PG in Ahmedabad</Link></li>
            <li><Link href="/pgs/boys" className="btn btn-ghost min-h-[44px] border border-ink/15 text-sm">Boys PG</Link></li>
            <li><Link href="/pgs/girls" className="btn btn-ghost min-h-[44px] border border-ink/15 text-sm">Girls PG</Link></li>
          </ul>
        </nav>
      </div>
    </>
  );
}
