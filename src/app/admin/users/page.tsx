import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminUsersManager from "@/components/admin/AdminUsersManager";

export const metadata: Metadata = {
  title: "Management Users & Accounts | Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "superadmin") redirect("/admin");

  return (
    <div>
      <AdminUsersManager currentUserEmail={session.email} />
    </div>
  );
}
