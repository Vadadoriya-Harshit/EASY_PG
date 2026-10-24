"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, CheckCircle2, Clock, Mail, MailX, Plus, RefreshCw, Search, Send, Trash2, UserX, X, AlertCircle } from "lucide-react";
import { fmtDate } from "@/lib/utils";

type SubStatus = "pending" | "active" | "unsubscribed";
interface Subscriber {
  id: string; email: string; name?: string; phone?: string;
  preferredArea: string; preferredProperty: string; sharingType: string;
  status: SubStatus; source?: string; notes?: string; consentAt: string; confirmedAt?: string; createdAt: string;
}
interface NotifRow { key: string; email: string; status: "queued" | "sent" | "failed" | "skipped"; attempts: number; lastError?: string; sentAt?: string }
interface EventRow {
  id: string; propertyName: string; roomType: string; createdAt: string; createdBy: string;
  totals: { queued: number; sent: number; failed: number; skipped: number };
  notifications: NotifRow[];
}

const STATUS_STYLE: Record<SubStatus, string> = {
  pending: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300",
  active: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  unsubscribed: "bg-ink/5 border-ink/10 text-mute",
};
const STATUS_LABEL: Record<SubStatus, string> = { pending: "Awaiting confirmation", active: "Active", unsubscribed: "Unsubscribed" };
const NOTIF_STYLE: Record<NotifRow["status"], string> = {
  queued: "text-amber-600", sent: "text-emerald-600", failed: "text-red-600", skipped: "text-mute",
};

async function api<T = any>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: data as T };
}

export default function AdminVacanciesPage() {
  const [tab, setTab] = useState<"subscribers" | "log">("subscribers");
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [areas, setAreas] = useState<{ name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | SubStatus>("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", phone: "", preferredArea: "all", sharingType: "any", notes: "" });
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const notify = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr("");
    try {
      const [s, e] = await Promise.all([api("/api/admin/vacancies"), api("/api/admin/vacancy-notifications")]);
      if (s.status === 401 || e.status === 401) { window.location.href = "/admin/login"; return; }
      if (!s.ok) throw new Error(s.data?.error || "Could not load subscribers.");
      setSubs(s.data.subscribers || []);
      setEvents(e.ok ? e.data.events || [] : []);
    } catch (err: any) {
      setLoadErr(err?.message || "Could not load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/site-settings").then((r) => r.json()).then((r) => setAreas(r?.data?.areas || [])).catch(() => {});
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subs.filter((v) => (filter === "all" || v.status === filter) && (!term || [v.email, v.name, v.phone, v.preferredArea, v.notes].some((x) => x?.toLowerCase().includes(term))));
  }, [subs, search, filter]);

  const counts = useMemo(() => ({
    total: subs.length,
    active: subs.filter((s) => s.status === "active").length,
    pending: subs.filter((s) => s.status === "pending").length,
    failed: events.reduce((n, e) => n + e.totals.failed, 0),
  }), [subs, events]);

  const deactivate = async (v: Subscriber) => {
    if (!confirm(`Stop sending alerts to ${v.email}?`)) return;
    const r = await api(`/api/admin/vacancies/${v.id}`, { method: "PATCH", body: JSON.stringify({ status: "unsubscribed" }) });
    if (r.ok) { setSubs((p) => p.map((x) => (x.id === v.id ? { ...x, status: "unsubscribed" } : x))); notify("ok", "Subscriber deactivated."); }
    else notify("err", r.data?.error || "Could not update.");
  };

  const remove = async (v: Subscriber) => {
    if (!confirm(`Permanently delete ${v.email} and their notification history?`)) return;
    const r = await api(`/api/admin/vacancies/${v.id}`, { method: "DELETE" });
    if (r.ok) { setSubs((p) => p.filter((x) => x.id !== v.id)); notify("ok", "Subscriber deleted."); }
    else notify("err", r.data?.error || "Could not delete.");
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormErr("");
    const r = await api("/api/admin/vacancies", { method: "POST", body: JSON.stringify(form) });
    setSaving(false);
    if (!r.ok) { setFormErr(r.data?.error || "Could not add the subscriber."); return; }
    setAdding(false);
    setForm({ email: "", name: "", phone: "", preferredArea: "all", sharingType: "any", notes: "" });
    notify("ok", r.data.created ? "Subscriber added." : "That email was already subscribed; preferences were updated.");
    load();
  };

  const retry = async (eventId?: string) => {
    setRetrying(true);
    const r = await api("/api/admin/vacancy-notifications", { method: "POST", body: JSON.stringify({ action: "retry", eventId }) });
    setRetrying(false);
    if (r.ok) { notify("ok", `Retried: ${r.data.sent} sent, ${r.data.failed} failed.`); load(); }
    else notify("err", r.data?.error || "Retry failed.");
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Vacancy alerts</h1>
          <p className="mt-1 text-sm text-mute">Visitors who asked for an email when a bed opens up. Alerts go out automatically when you set a room to “Available now” on a property.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="btn btn-ghost gap-2 text-xs" aria-label="Refresh"><RefreshCw size={14} /> Refresh</button>
          <button type="button" onClick={() => setAdding(true)} className="btn btn-primary gap-2 text-xs"><Plus size={15} /> Add subscriber</button>
        </div>
      </div>

      {toast && (
        <div role="status" className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${toast.kind === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"}`}>
          {toast.kind === "ok" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}
      {loadErr && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={16} /> {loadErr}
          <button className="btn btn-ghost py-1 text-xs" onClick={load}>Try again</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Subscribers", counts.total, "text-ink"],
          ["Confirmed & active", counts.active, "text-emerald-600"],
          ["Awaiting confirmation", counts.pending, "text-amber-600"],
          ["Failed deliveries", counts.failed, counts.failed ? "text-red-600" : "text-mute"],
        ].map(([label, n, cls]) => (
          <div key={label as string} className="rounded-2xl border border-ink/10 bg-surface/80 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-mute">{label}</div>
            <div className={`mt-1 text-3xl font-extrabold ${cls}`}>{n as number}</div>
          </div>
        ))}
      </div>

      <div role="tablist" aria-label="Vacancy alerts" className="flex gap-1 rounded-xl bg-ink/5 p-1 sm:w-fit">
        {([["subscribers", "Subscribers"], ["log", "Notification log"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-[40px] flex-1 rounded-lg px-4 text-sm font-semibold transition sm:flex-none ${tab === k ? "bg-surface text-ink shadow-sm" : "text-mute hover:text-ink"}`}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-ink/10 bg-surface/80 p-14 text-center text-sm text-mute">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" /> Loading…
        </div>
      ) : tab === "subscribers" ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
              <input type="search" aria-label="Search subscribers" placeholder="Search email, name, locality…" value={search} onChange={(e) => setSearch(e.target.value)} className="input w-full pl-9 text-sm" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["all", "active", "pending", "unsubscribed"] as const).map((st) => (
                <button key={st} onClick={() => setFilter(st)} className={`min-h-[36px] shrink-0 rounded-full px-3.5 text-xs font-bold capitalize ${filter === st ? "bg-brand text-white" : "border border-ink/10 bg-surface text-mute hover:text-ink"}`}>{st}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-ink/10 bg-surface/80 p-12 text-center">
              <BellRing size={30} className="mx-auto mb-2 text-mute/50" />
              <h3 className="text-sm font-bold text-ink">{subs.length ? "No subscribers match" : "No subscribers yet"}</h3>
              <p className="mt-1 text-xs text-mute">{subs.length ? "Try a different search or filter." : "People who subscribe from the website footer or a property page will appear here after they confirm their email."}</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10 overflow-hidden rounded-3xl border border-ink/10 bg-surface/80">
              {filtered.map((v) => (
                <li key={v.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-bold text-ink">{v.name || "Subscriber"}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[v.status]}`}>{STATUS_LABEL[v.status]}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 break-all font-mono text-xs text-mute"><Mail size={12} className="shrink-0 text-brand" />{v.email}</div>
                    <div className="mt-1 text-xs capitalize text-mute">
                      {v.preferredProperty !== "all" ? `Property: ${v.preferredProperty} · ` : ""}Area: {v.preferredArea === "all" ? "any" : v.preferredArea} · Room: {v.sharingType === "any" ? "any" : v.sharingType}
                      {v.phone ? ` · ${v.phone}` : ""} · joined {fmtDate(v.createdAt)} · {v.source || "website"}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {v.status !== "unsubscribed" && (
                      <button onClick={() => deactivate(v)} className="btn btn-ghost min-h-[40px] gap-1.5 text-xs" title="Stop sending alerts"><UserX size={14} /> Deactivate</button>
                    )}
                    <button onClick={() => remove(v)} className="btn btn-ghost min-h-[40px] gap-1.5 text-xs text-red-600" aria-label={`Delete ${v.email}`}><Trash2 size={14} /> Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-mute">Each row is one “bed became available” event and the emails it triggered.</p>
            <button onClick={() => retry()} disabled={retrying} className="btn btn-ghost gap-2 text-xs"><Send size={14} /> {retrying ? "Working…" : "Retry failed & send due"}</button>
          </div>
          {events.length === 0 ? (
            <div className="rounded-3xl border border-ink/10 bg-surface/80 p-12 text-center">
              <MailX size={30} className="mx-auto mb-2 text-mute/50" />
              <h3 className="text-sm font-bold text-ink">No availability events yet</h3>
              <p className="mt-1 text-xs text-mute">Open a property, change a room from “Unknown / From date” to “Available now” and save. Matching confirmed subscribers are emailed automatically.</p>
            </div>
          ) : (
            events.map((ev) => (
              <details key={ev.id} className="rounded-2xl border border-ink/10 bg-surface/80 p-4" open={events.length === 1}>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-ink">{ev.propertyName} <span className="font-normal capitalize text-mute">· {ev.roomType}</span></span>
                  <span className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-mute"><Clock size={12} className="mr-1 inline" />{new Date(ev.createdAt).toLocaleString("en-IN")}</span>
                    <span className="text-emerald-600">{ev.totals.sent} sent</span>
                    {ev.totals.queued > 0 && <span className="text-amber-600">{ev.totals.queued} queued</span>}
                    {ev.totals.failed > 0 && <span className="text-red-600">{ev.totals.failed} failed</span>}
                    {ev.totals.skipped > 0 && <span className="text-mute">{ev.totals.skipped} skipped</span>}
                  </span>
                </summary>
                <ul className="mt-3 divide-y divide-ink/5 text-xs">
                  {ev.notifications.length === 0 && <li className="py-2 text-mute">No matching confirmed subscribers at the time.</li>}
                  {ev.notifications.map((n) => (
                    <li key={n.key} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="break-all font-mono">{n.email}</span>
                      <span className={`font-semibold capitalize ${NOTIF_STYLE[n.status]}`}>{n.status}{n.attempts > 1 ? ` (${n.attempts} tries)` : ""}</span>
                      {n.lastError && n.status !== "sent" && <span className="w-full text-[11px] text-mute">{n.lastError}</span>}
                    </li>
                  ))}
                </ul>
                {ev.totals.failed > 0 && <button onClick={() => retry(ev.id)} disabled={retrying} className="btn btn-ghost mt-3 gap-2 text-xs"><RefreshCw size={13} /> Retry failed for this event</button>}
              </details>
            ))
          )}
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="add-title">
          <form onSubmit={add} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-ink/10 bg-surface p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="add-title" className="text-lg font-bold text-ink">Add a subscriber</h2>
              <button type="button" onClick={() => setAdding(false)} aria-label="Close" className="rounded-full p-2 text-mute hover:bg-ink/5"><X size={18} /></button>
            </div>
            <p className="mb-4 text-xs text-mute">Only add someone who has agreed to receive vacancy emails (for example in person or by phone). This action is recorded in the audit log.</p>
            <div className="grid gap-3">
              <label className="block text-xs font-bold uppercase tracking-wide text-ink">Email *
                <input type="email" required autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input mt-1 text-sm normal-case" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-ink">Name
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input mt-1 text-sm normal-case" maxLength={80} />
                </label>
                <label className="block text-xs font-bold uppercase tracking-wide text-ink">Phone
                  <input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input mt-1 text-sm normal-case" maxLength={20} />
                </label>
                <label className="block text-xs font-bold uppercase tracking-wide text-ink">Locality
                  <select value={form.preferredArea} onChange={(e) => setForm({ ...form, preferredArea: e.target.value })} className="input mt-1 text-sm normal-case">
                    <option value="all">Any locality</option>
                    {areas.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-bold uppercase tracking-wide text-ink">Room type
                  <select value={form.sharingType} onChange={(e) => setForm({ ...form, sharingType: e.target.value })} className="input mt-1 text-sm normal-case">
                    <option value="any">Any</option><option value="single">Single</option><option value="double">Double</option><option value="triple">Triple</option><option value="dormitory">Dormitory</option>
                  </select>
                </label>
              </div>
              <label className="block text-xs font-bold uppercase tracking-wide text-ink">Notes
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input mt-1 text-sm normal-case" rows={2} maxLength={500} />
              </label>
              {formErr && <p role="alert" className="text-sm font-semibold text-warn">{formErr}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAdding(false)} className="btn btn-ghost text-xs">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary text-xs">{saving ? "Adding…" : "Add subscriber"}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
