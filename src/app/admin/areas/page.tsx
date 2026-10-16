import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAreas } from "@/lib/repo";
import AreaManager from "@/components/admin/AreaManager";

export const dynamic = "force-dynamic";

export default async function AdminAreas() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Areas</h1>
      <AreaManager initial={await listAreas({ includeInactive: true })} />
    </div>
  );
}

