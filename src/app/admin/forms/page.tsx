"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ClipboardList, ExternalLink, Plus } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import { cn } from "@/lib/utils";

interface Row { slug: string; title: string; status: "draft" | "published"; submissionCount: number; fields: unknown[]; updatedAt: string }

export default function FormsListPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    try {
      const r = await fetch("/api/admin/forms");
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) { window.location.href = "/admin/login"; return; }
      if (!r.ok) throw new Error(d.error || "Could not load forms.");
      setRows(d.forms);
    } catch (e: any) {
      setErr(e?.message || "Could not load forms.");
      setRows([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Forms & responses</h1>
          <p className="mt-1 text-sm text-mute">Build forms by choosing fields, drag them into order, preview, then publish. Responses arrive here.</p>
        </div>
        <Link href="/admin/forms/new" className="btn btn-primary min-h-[44px] gap-2 self-start text-sm sm:self-auto"><Plus size={16} /> New form</Link>
      </div>

      {err && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300"><AlertCircle size={16} />{err}<button onClick={load} className="btn btn-ghost py-1 text-xs">Try again</button></div>}

      {rows === null ? (
        <div className="p-14 text-center text-sm text-mute"><ProgressRing size={26} className="mx-auto mb-3 text-brand" /> Loading forms…</div>
      ) : rows.length === 0 && !err ? (
        <div className="rounded-3xl border-2 border-dashed border-ink/15 p-12 text-center">
          <ClipboardList className="mx-auto mb-3 text-mute/50" size={34} />
          <h2 className="text-base font-bold text-ink">No forms yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-mute">Start from a ready-made template (enquiry, visit booking, feedback) or a blank form.</p>
          <Link href="/admin/forms/new" className="btn btn-primary mt-5 min-h-[44px]">Create your first form</Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((f) => (
            <li key={f.slug} className="card flex flex-col justify-between gap-4 border-ink/10 p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="min-w-0 truncate text-base font-bold text-ink">{f.title}</h2>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold", f.status === "published" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300")}>{f.status === "published" ? "Published" : "Draft"}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-mute">/forms/{f.slug}</p>
                <p className="mt-3 text-xs text-mute">{f.fields.length} fields · <strong className="text-ink">{f.submissionCount}</strong> responses · updated {new Date(f.updatedAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/forms/${f.slug}`} className="btn btn-primary min-h-[44px] flex-1 text-xs">Edit & responses</Link>
                {f.status === "published" && <Link href={`/forms/${f.slug}`} target="_blank" aria-label={`Open ${f.title} on the website`} className="btn btn-ghost grid min-h-[44px] w-11 place-items-center border border-ink/10 p-0"><ExternalLink size={15} /></Link>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
