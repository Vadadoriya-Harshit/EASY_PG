import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import NearbyExplorer from "@/components/NearbyExplorer";
import { listProperties } from "@/lib/repo";

export const revalidate = 60;
export const metadata: Metadata = { title: "Metro & nearby essentials", description: "Metro stations, breakfast, tiffin, groceries and pharmacies near each Sorath PG, with distance method and last-checked date." };

export default async function Nearby() {
  const props = await listProperties();
  return (
    <>
      <PageHeader title="Metro & nashta explorer" intro="Stations, breakfast spots, tiffin providers and shops near each PG. Each entry shows how its distance was measured and when it was last checked." />
      <div className="container-x py-12"><NearbyExplorer properties={props} /></div>
    </>
  );
}
