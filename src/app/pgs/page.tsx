import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PGFinder from "@/components/PGFinder";
import DemoNotice from "@/components/DemoNotice";
import { listAreas, listProperties, isDemoStore } from "@/lib/repo";
import { parseFilters } from "@/lib/filter";

export const revalidate = 60;

export async function generateMetadata({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }): Promise<Metadata> {
  const filtered = Object.keys(searchParams).length > 0;
  return {
    title: "All PGs: boys & girls PG listings",
    description: "Browse every Sorath PG. Filter by area, budget, sharing type, AC, facilities and metro distance.",
    alternates: { canonical: "/pgs" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function PGs({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const [props, areas] = await Promise.all([listProperties(), listAreas()]);
  return (
    <>
      <PageHeader title="Find your PG" intro="Filter by area, budget and sharing type. Every filter works with the others." />
      <div className="container-x py-10">
        <DemoNotice show={isDemoStore()} />
        <PGFinder properties={props} areas={areas} initial={parseFilters(searchParams)} />
      </div>
    </>
  );
}
