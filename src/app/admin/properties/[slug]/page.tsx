import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getProperty, listAreas } from "@/lib/repo";
import PropertyForm from "@/components/admin/PropertyForm";
import type { Property } from "@/lib/types";
import { FACILITY_CATALOG } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function EditProperty({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const areas = await listAreas({ includeInactive: true });
  let p: Property | null;
  if (params.slug === "new") {
    p = {
      slug: "",
      name: "",
      gender: "boys",
      area: areas[0]?.slug || "",
      address: "",
      description: "",
      status: "draft",
      verified: false,
      featured: false,
      metro: null,
      rooms: [],
      facilities: FACILITY_CATALOG.map((f) => ({ key: f.key, name: f.name, status: "not-available" as const })),
      media: [],
      rules: [],
      nearby: [],
      updatedAt: ""
    };
  } else {
    p = await getProperty(params.slug, true);
    if (!p) notFound();
    // make sure the full facility catalogue is editable
    p.facilities = FACILITY_CATALOG.map((f) => p!.facilities.find((x) => x.key === f.key) || { key: f.key, name: f.name, status: "not-available" as const });
  }
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{params.slug === "new" ? "Add property" : `Edit ${p.name}`}</h1>
      <PropertyForm initial={p} areas={areas} isNew={params.slug === "new"} />
    </div>
  );
}
