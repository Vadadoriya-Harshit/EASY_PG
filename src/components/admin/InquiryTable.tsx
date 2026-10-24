"use client";
import { useState, useMemo } from "react";
import {
  Users,
  Search,
  PhoneCall,
  MessageSquare,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  Filter,
  Check,
  Building2,
  MapPin,
  X
} from "lucide-react";
import type { Inquiry, InquiryStatus } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUSES: { key: InquiryStatus; label: string; color: string }[] = [
  { key: "new", label: "New Lead", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { key: "contacted", label: "Contacted", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  { key: "visit-scheduled", label: "Visit Scheduled", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { key: "converted", label: "Converted / Admitted", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { key: "closed", label: "Closed / Archived", color: "bg-ink/10 text-mute border-ink/15" },
];

export default function InquiryTable({
  initial,
  propertyNames,
}: {
  initial: Inquiry[];
  propertyNames: Record<string, string>;
}) {
  const [rows, setRows] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | InquiryStatus>("all");
  const [savingId, setSavingId] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  const patch = async (id: string, body: any) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const { inquiry } = await res.json();
        setRows((r) => r.map((x) => (x.id === id ? inquiry : x)));
        setToastMsg("Lead record updated successfully!");
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch {
      alert("Failed to update lead.");
    } finally {
      setSavingId("");
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm("Remove this inquiry lead permanently?")) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== id));
        setToastMsg("Inquiry removed from CRM.");
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch {}
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchFilter = filter === "all" || r.status === filter;
      const q = search.toLowerCase();
      const matchSearch =
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        (r.propertySlug && r.propertySlug.toLowerCase().includes(q)) ||
        (r.message && r.message.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }, [rows, filter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    STATUSES.forEach((s) => {
      c[s.key] = rows.filter((r) => r.status === s.key).length;
    });
    return c;
  }, [rows]);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="flex items-center justify-between rounded-xl bg-ok/15 border border-ok/30 px-4 py-2.5 text-ok text-xs font-semibold shadow-lg">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} /> {toastMsg}
          </span>
          <button onClick={() => setToastMsg("")} className="text-ok">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter Chips & Search Bar */}
      <div className="card p-4 border-ink/10 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input
              type="text"
              placeholder="Search leads by resident name, phone number, or property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input text-xs pl-9 w-full"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-mute font-medium">
            <span>Showing:</span>
            <strong className="text-ink">{filtered.length} Leads</strong>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap",
              filter === "all"
                ? "bg-brand text-white shadow-sm"
                : "bg-surface border border-ink/10 text-mute hover:text-ink"
            )}
          >
            <span>All Requests</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">{counts.all}</span>
          </button>

          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap",
                filter === s.key
                  ? "bg-brand text-white shadow-sm"
                  : "bg-surface border border-ink/10 text-mute hover:text-ink"
              )}
            >
              <span>{s.label}</span>
              <span className="rounded-full bg-ink/10 px-1.5 py-0.2 text-[10px]">{counts[s.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CRM Pipeline Table & Mobile Cards */}
      <div className="card border-ink/10 overflow-hidden shadow-xl">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-xs">
            <thead className="bg-ink/5 border-b border-ink/10 text-mute uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Resident Lead</th>
                <th className="py-3 px-4">Contact Channels</th>
                <th className="py-3 px-4">Target Stay</th>
                <th className="py-3 px-4">Visit / Move-in</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filtered.map((item) => {
                const cleanPhone = item.phone.replace(/[^0-9]/g, "");
                const currentStatusObj = STATUSES.find((s) => s.key === item.status) || STATUSES[0];

                return (
                  <tr key={item.id} className="hover:bg-ink/5 transition-colors group">
                    {/* Resident Info */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-ink">{item.name}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                              item.kind === "visit"
                                ? "bg-accent/15 text-accent border border-accent/20"
                                : "bg-brand/15 text-brand border border-brand/20"
                            )}
                          >
                            {item.kind === "visit" ? "Visit Request" : "Inquiry"}
                          </span>
                        </div>
                        <span className="text-[11px] text-mute">{fmtDate(item.createdAt)}</span>
                        {item.message && (
                          <p className="mt-1 text-[11px] text-mute max-w-xs line-clamp-1 italic">
                            "{item.message}"
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Contact Actions */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${item.phone}`}
                            className="inline-flex items-center gap-1 font-bold text-brand hover:underline"
                            title="Direct Dial"
                          >
                            <PhoneCall size={13} />
                            <span>{item.phone}</span>
                          </a>
                        </div>
                        <a
                          href={`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(`Hello ${item.name}! This is Luxora PG coordinator regarding your inquiry.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <MessageSquare size={12} />
                          <span>WhatsApp Chat</span>
                        </a>
                      </div>
                    </td>

                    {/* Target Stay */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-ink flex items-center gap-1">
                          <Building2 size={12} className="text-brand shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {item.propertySlug ? propertyNames[item.propertySlug] || item.propertySlug : item.areaSlug || "General Inq"}
                          </span>
                        </span>
                        {item.roomType && (
                          <span className="text-[11px] text-mute block capitalize">{item.roomType} Sharing</span>
                        )}
                      </div>
                    </td>

                    {/* Visit / Move-In Slot */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {item.visit ? (
                          <div className="rounded-xl border border-brand/15 bg-brand/5 p-2 text-[11px]">
                            <div className="flex items-center gap-1 font-bold text-ink">
                              <CalendarCheck size={12} className="text-brand" />
                              <span>{fmtDate(item.visit.date)}</span>
                              {item.visit.time && <span>· {item.visit.time}</span>}
                            </div>
                            <span className="text-[10px] text-mute font-medium block mt-0.5">
                              Status: <strong>{item.visit.status}</strong>
                            </span>
                            {item.visit.status === "requested" && (
                              <button
                                type="button"
                                onClick={() =>
                                  patch(item.id, {
                                    status: "visit-scheduled",
                                    visit: {
                                      status: "confirmed",
                                      confirmedSlot: `${item.visit?.date} ${item.visit?.time || ""}`.trim(),
                                    },
                                  })
                                }
                                className="mt-1 inline-flex items-center gap-1 rounded bg-brand text-white px-2 py-0.5 text-[10px] font-bold shadow-sm hover:bg-brand/90"
                              >
                                <Check size={10} /> Confirm Slot
                              </button>
                            )}
                          </div>
                        ) : item.moveIn ? (
                          <span className="text-[11px] text-mute block">
                            Move-in: <strong>{fmtDate(item.moveIn)}</strong>
                          </span>
                        ) : (
                          <span className="text-mute text-[11px]">Immediate</span>
                        )}
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={item.status}
                        disabled={savingId === item.id}
                        onChange={(e) => patch(item.id, { status: e.target.value })}
                        className={cn(
                          "input text-xs !w-36 font-bold border transition",
                          currentStatusObj.color
                        )}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Actions & Notes */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedNotesId(expandedNotesId === item.id ? null : item.id)
                          }
                          className={cn(
                            "btn btn-ghost text-xs px-2.5 py-1.5 border border-ink/10",
                            item.notes && "text-brand border-brand/30"
                          )}
                          title="Internal Coordinator Notes"
                        >
                          Notes {item.notes ? "•" : ""}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteInquiry(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 text-mute hover:text-red-500 hover:border-red-500/40 transition"
                          title="Delete Lead"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-mute">
                    <Users size={32} className="mx-auto text-mute/50 mb-2" />
                    <p className="font-semibold text-sm">No inquiries matching filter</p>
                    <p className="text-xs">Incoming visitor forms from website will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile App Cards View (md:hidden - Zero horizontal squashing on phones) */}
        <div className="md:hidden divide-y divide-ink/10">
          {filtered.map((item) => {
            const cleanPhone = item.phone.replace(/[^0-9]/g, "");
            const currentStatusObj = STATUSES.find((s) => s.key === item.status) || STATUSES[0];

            return (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-ink">{item.name}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                          item.kind === "visit"
                            ? "bg-accent/15 text-accent border border-accent/20"
                            : "bg-brand/15 text-brand border border-brand/20"
                        )}
                      >
                        {item.kind === "visit" ? "Visit Request" : "Inquiry"}
                      </span>
                    </div>
                    <span className="text-[11px] text-mute block mt-0.5">{fmtDate(item.createdAt)}</span>
                  </div>

                  <select
                    value={item.status}
                    disabled={savingId === item.id}
                    onChange={(e) => patch(item.id, { status: e.target.value })}
                    className={cn(
                      "input text-xs !w-32 font-bold border transition",
                      currentStatusObj.color
                    )}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target stay / room */}
                <div className="rounded-xl bg-ink/5 p-2.5 text-xs space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-ink">
                    <Building2 size={13} className="text-brand shrink-0" />
                    <span>
                      {item.propertySlug ? propertyNames[item.propertySlug] || item.propertySlug : item.areaSlug || "General Inquiry"}
                    </span>
                    {item.roomType && (
                      <span className="text-mute font-normal capitalize">({item.roomType} sharing)</span>
                    )}
                  </div>
                  {item.visit ? (
                    <div className="text-[11px] text-accent font-medium">
                      <span>Visit: {item.visit.date} {item.visit.time ? `(${item.visit.time})` : ""}</span>
                    </div>
                  ) : item.moveIn ? (
                    <div className="text-[11px] text-mute font-medium">
                      <span>Move-in: {fmtDate(item.moveIn)}</span>
                    </div>
                  ) : null}
                  {item.message && (
                    <p className="text-[11px] text-mute italic">"{item.message}"</p>
                  )}
                </div>

                {/* Contact Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-ink/5">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${item.phone}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-xs font-bold text-brand"
                    >
                      <PhoneCall size={12} />
                      <span>{item.phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(`Hello ${item.name}! This is Luxora PG coordinator regarding your inquiry.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                    >
                      <MessageSquare size={12} />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExpandedNotesId(expandedNotesId === item.id ? null : item.id)}
                      className={cn(
                        "btn btn-ghost text-xs px-2 py-1 border border-ink/10",
                        item.notes && "text-brand border-brand/30"
                      )}
                    >
                      Notes {item.notes ? "•" : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteInquiry(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink/10 text-mute hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!filtered.length && (
            <div className="p-8 text-center text-mute">
              <Users size={28} className="mx-auto text-mute/50 mb-2" />
              <p className="font-semibold text-xs">No inquiries found</p>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Notes Drawer / Card */}
      {expandedNotesId && (
        <div className="card p-5 border-brand/30 bg-surface/90 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-ink/10">
            <h4 className="font-bold text-xs text-brand uppercase tracking-wider flex items-center gap-1.5">
              <span>Internal Notes for:</span>
              <strong className="text-ink">
                {rows.find((r) => r.id === expandedNotesId)?.name}
              </strong>
            </h4>
            <button
              onClick={() => setExpandedNotesId(null)}
              className="text-mute hover:text-ink text-xs"
            >
              Close
            </button>
          </div>

          <textarea
            rows={3}
            className="input text-xs w-full"
            placeholder="Type confidential resident background notes, parent contact details, or budget limits..."
            defaultValue={rows.find((r) => r.id === expandedNotesId)?.notes || ""}
            onBlur={(e) => {
              const current = rows.find((r) => r.id === expandedNotesId)?.notes;
              if (e.target.value !== current) {
                patch(expandedNotesId, { notes: e.target.value });
              }
            }}
          />
          <span className="text-[10px] text-mute block">Changes save automatically when you click outside.</span>
        </div>
      )}
    </div>
  );
}
