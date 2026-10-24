import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAudit } from "@/lib/audit";

export const metadata: Metadata = { title: "Security audit log | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "superadmin") redirect("/admin");
  const entries = await listAudit(200);

  return (
    <div className="space-y-5 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Security audit log</h1>
        <p className="mt-1 text-sm text-mute">Sign-ins, failed attempts, content changes and alerts. Passwords, codes and tokens are never recorded.</p>
      </div>
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-ink/10 bg-surface/80 p-10 text-center text-sm text-mute">Nothing recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-surface/80">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-ink/10 text-[10px] uppercase tracking-wider text-mute">
              <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">IP</th></tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-mute">{new Date(e.at).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 font-mono">{e.actor}</td>
                  <td className="px-4 py-2.5 font-semibold text-ink">{e.action}</td>
                  <td className="px-4 py-2.5 font-mono text-mute">{e.target || ""}</td>
                  <td className="px-4 py-2.5 font-mono text-mute">{e.ip || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
