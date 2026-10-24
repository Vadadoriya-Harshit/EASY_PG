import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import AreaCardsGrid from "@/components/AreaCardsGrid";
import { listAreas, listProperties } from "@/lib/repo";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "PG areas we serve in Ahmedabad",
  description: "Explore verified student and executive PG localities in Satellite, Vastrapur, Navrangpura, and Thaltej.",
  alternates: { canonical: "/areas" },
};

export default async function Areas() {
  const [areas, props] = await Promise.all([listAreas(), listProperties()]);
  const counts = Object.fromEntries(areas.map((a) => [a.slug, props.filter((p) => p.area === a.slug).length]));

  return (
    <>
      <PageHeader
        title="Areas We Serve in Ahmedabad"
        intro="Explore verified accommodations across prime college and corporate hubs. Real photos, walking metro routes, and nearby food hotspots."
      />

      <div className="container-x py-12">
        <AreaCardsGrid areas={areas} counts={counts} />
      </div>
    </>
  );
}
