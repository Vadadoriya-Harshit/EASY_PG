import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import FacilityIcon from "@/components/FacilityIcon";
import Link from "next/link";
import { listProperties } from "@/lib/repo";
import { FACILITY_CATALOG } from "@/lib/site";

export const revalidate = 60;
export const metadata: Metadata = { title: "Facilities", description: "What each Sorath PG includes, what costs extra and what isn't offered." };

export default async function Facilities() {
  const props = await listProperties();
  return (
    <>
      <PageHeader title="Facilities, stated plainly" intro="Facilities differ by property. This table shows what is included in rent, what costs extra and what isn't offered." />
      <div className="container-x py-12">
        <div className="overflow-x-auto rounded-xl2 border border-ink/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-ink/5"><tr><th scope="col" className="px-4 py-3">Property</th>{FACILITY_CATALOG.map((f) => <th scope="col" key={f.key} className="px-3 py-3 text-center font-medium"><FacilityIcon k={f.key} className="mx-auto mb-1 text-accent" /><span className="text-xs">{f.name}</span></th>)}</tr></thead>
            <tbody>{props.map((p) => (
              <tr key={p.slug} className="border-t border-ink/10">
                <th scope="row" className="px-4 py-3 font-medium"><Link className="hover:text-brand" href={`/pg/${p.slug}`}>{p.name}</Link></th>
                {FACILITY_CATALOG.map((f) => {
                  const s = p.facilities.find((x) => x.key === f.key)?.status;
                  return <td key={f.key} className="px-3 py-3 text-center">{s === "included" ? <span className="text-ok" aria-label="Included">Included</span> : s === "paid" ? <span className="text-warn" aria-label="Paid extra">Paid</span> : <span className="text-mute" aria-label="Not available">None</span>}</td>;
                })}
              </tr>))}</tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-mute">Included = covered by rent. Paid = available at extra cost. None = not offered at this property.</p>
      </div>
    </>
  );
}
