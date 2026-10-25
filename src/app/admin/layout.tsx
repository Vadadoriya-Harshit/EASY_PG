import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminTabGuard from "@/components/admin/AdminTabGuard";
import AdminShell from "@/components/admin/AdminShell";
import { isDemoStore } from "@/lib/repo";

export const metadata: Metadata = {
  title: "Admin Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PUBLIC_PATHS = new Set(["/admin/login", "/admin/verify-otp"]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();

  const headerList = await headers();
  if (!s && !PUBLIC_PATHS.has(headerList.get("x-pathname") || "")) redirect("/admin/login");

  if (!s) {
    return (
      <div className="fixed inset-0 z-[70] overflow-auto bg-bg">
        {children}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-auto bg-bg">
      <AdminTabGuard currentSessionSid={s.sid} />

      {/* Subtle Living Ambient Animated Gradient Aura in Admin Panel */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 h-[550px] w-[550px] rounded-full bg-brand/10 blur-[130px] animate-ambient-drift opacity-80" />
        <div className="absolute top-1/3 -right-32 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[140px] animate-ambient-drift-rev opacity-75" />
      </div>

      <AdminShell user={s} demo={isDemoStore()}>
        {children}
      </AdminShell>
    </div>
  );
}
