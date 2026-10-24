import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CmsManager from "@/components/admin/CmsManager";

export const metadata: Metadata = {
  title: "Website CMS & SEO Center | Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCmsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div>
      <CmsManager canReset={session.role === "superadmin"} />
    </div>
  );
}
