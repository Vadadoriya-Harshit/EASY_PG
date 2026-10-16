import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAreas, listProperties } from "@/lib/repo";
import PropertiesManager from "@/components/admin/PropertiesManager";

export const dynamic = "force-dynamic";

export default async function AdminProperties() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [props, areas] = await Promise.all([
    listProperties({ includeDraft: true }),
    listAreas({ includeInactive: true }),
  ]);

  return <PropertiesManager initialProps={props} areas={areas} />;
}
