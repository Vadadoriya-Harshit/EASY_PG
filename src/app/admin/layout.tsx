import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import AdminTabGuard from "@/components/admin/AdminTabGuard";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin Portal | Luxora PG",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();

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

      <AdminShell user={s}>
        {children}
      </AdminShell>
    </div>
  );
}
