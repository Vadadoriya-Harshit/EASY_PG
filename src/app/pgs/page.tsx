import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PGFinder from "@/components/PGFinder";
import DemoNotice from "@/components/DemoNotice";
import { listAreas, listProperties, isDemoStore } from "@/lib/repo";
import { parseFilters } from "@/lib/filter";

export const revalidate = 60;

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Object.keys(sp || {}).length > 0;
  return {
    title: "PG in Ahmedabad: Boys & Girls PG Listings",
    description: "Browse every Luxora PG in Ahmedabad. Filter by locality, budget, single / double / triple sharing, AC, facilities and metro distance.",
    alternates: { canonical: "/pgs" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function PGs({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [props, areas] = await Promise.all([listProperties(), listAreas()]);
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Find your PG" intro="Filter by area, budget and sharing type. Every filter works with the others." />
      <div className="container-x py-10">
        <DemoNotice show={isDemoStore()} />
        <PGFinder properties={props} areas={areas} initial={parseFilters(sp)} />
      </div>
    </>
  );
}
