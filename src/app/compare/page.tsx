import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getProperty, listAreas } from "@/lib/repo";
import { FACILITY_CATALOG, ROOM_LABEL } from "@/lib/site";
import { inr, rentRange } from "@/lib/utils";
import type { Property } from "@/lib/types";

export const metadata: Metadata = { title: "Compare PGs", robots: { index: false } };

export default async function Compare({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const sp = await searchParams;
  const slugs = (sp.ids || "").split(",").filter(Boolean).slice(0, 3);
  const props = (await Promise.all(slugs.map((s) => getProperty(s)))).filter(Boolean) as Property[];
  const areas = await listAreas();
  const aName = (s: string) => areas.find((a) => a.slug === s)?.name || s;
  const NC = <span className="text-warn">Not confirmed</span>;

  const rows: [string, (p: Property) => React.ReactNode][] = [
    ["Type", (p) => (p.gender === "girls" ? "Girls PG" : "Boys PG")],
    ["Area", (p) => aName(p.area)],
    ["Rent / month", (p) => { const r = rentRange(p.rooms); return r ? (r.min === r.max ? inr(r.min) : `${inr(r.min)} – ${inr(r.max)}`) : NC; }],
    ["Deposit", (p) => { const d = p.rooms.map((r) => r.deposit).filter((x): x is number => x != null); return d.length ? `${inr(Math.min(...d))}${Math.max(...d) !== Math.min(...d) ? ` – ${inr(Math.max(...d))}` : ""}` : NC; }],
    ["Occupancy", (p) => Array.from(new Set(p.rooms.map((r) => ROOM_LABEL[r.type]))).join(", ")],
    ["AC rooms", (p) => (p.rooms.some((r) => r.ac) ? "Yes" : "No")],
    ...FACILITY_CATALOG.map((f): [string, (p: Property) => React.ReactNode] => [f.name, (p) => { const s = p.facilities.find((x) => x.key === f.key)?.status; return s === "included" ? "Included" : s === "paid" ? "Paid extra" : "Not offered"; }]),
    ["Metro", (p) => (p.metro ? `${p.metro.station}, ${p.metro.distanceKm} km (${p.metro.method})` : "Not recorded")],
    ["House rules", (p) => <ul className="list-disc pl-4">{p.rules.map((r, i) => <li key={i}>{r}</li>)}</ul>],
  ];

  return (
    <>
      <PageHeader title="Compare PGs" intro="Side-by-side details for up to three properties." />
      <div className="container-x py-12">
        {props.length < 2 ? (
          <div className="card grid place-items-center gap-4 p-12 text-center"><p className="text-mute">Pick at least two PGs from the listings to compare them.</p><Link className="btn btn-primary" href="/pgs">Browse PGs</Link></div>
        ) : (
          <div className="overflow-x-auto rounded-xl2 border border-ink/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-ink/5"><tr><th className="px-4 py-3"><span className="sr-only">Feature</span></th>{props.map((p) => <th scope="col" key={p.slug} className="px-4 py-3 text-base"><Link href={`/pg/${p.slug}`} className="hover:text-brand">{p.name}</Link></th>)}</tr></thead>
              <tbody>{rows.map(([l, fn]) => (<tr key={l} className="border-t border-ink/10 align-top"><th scope="row" className="px-4 py-3 font-medium text-mute">{l}</th>{props.map((p) => <td key={p.slug} className="px-4 py-3">{fn(p)}</td>)}</tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
