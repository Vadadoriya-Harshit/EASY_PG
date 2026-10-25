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
  X,
  Mail,
  Send,
  Calendar,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import type { Inquiry, InquiryStatus } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { showAlert, showConfirm, showToast } from "@/components/FeedbackDialog";

const STATUSES: { key: InquiryStatus; label: string; color: string; icon: any }[] = [
  { key: "new", label: "New Lead", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25", icon: Clock },
  { key: "contacted", label: "Contacted", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25", icon: PhoneCall },
  { key: "visit-scheduled", label: "Visit Scheduled", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25", icon: CalendarCheck },
  { key: "converted", label: "Converted / Admitted", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25", icon: CheckCircle2 },
  { key: "closed", label: "Closed / Archived", color: "bg-ink/10 text-mute border-ink/15", icon: X },
];

interface TransitionOption {
  value: InquiryStatus;
  label: string;
  isVisitModal?: boolean;
}

const PIPELINE_TRANSITIONS: Record<InquiryStatus, TransitionOption[]> = {
  new: [
    { value: "contacted", label: "Mark as Contacted" },
    { value: "visit-scheduled", label: "Schedule PG Visit...", isVisitModal: true },
    { value: "closed", label: "Archive / Lost Lead" },
  ],
  contacted: [
    { value: "visit-scheduled", label: "Schedule PG Visit...", isVisitModal: true },
    { value: "converted", label: "Convert & Admit Resident" },
    { value: "closed", label: "Archive / Lost Lead" },
  ],
  "visit-scheduled": [
    { value: "converted", label: "Convert & Admit Resident" },
    { value: "visit-scheduled", label: "Reschedule Visit Date...", isVisitModal: true },
    { value: "closed", label: "No-Show / Cancelled" },
  ],
  converted: [
    { value: "closed", label: "Archive Resident" },
  ],
  closed: [
    { value: "new", label: "Reopen as New Lead" },
    { value: "contacted", label: "Reopen as Contacted" },
  ],
};

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
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  // Visit Scheduling Modal State
  const [visitModalInquiry, setVisitModalInquiry] = useState<Inquiry | null>(null);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("04:00 PM - 06:00 PM");
  const [visitEmail, setVisitEmail] = useState("");
  const [visitSendEmail, setVisitSendEmail] = useState(true);
  const [visitNotes, setVisitNotes] = useState("");
  const [isSavingVisit, setIsSavingVisit] = useState(false);

  const getId = (item?: Inquiry | null) => item?.id || (item as any)?._id || "";

  const patch = async (id: string, body: any) => {
    if (!id || id === "undefined") {
      await showAlert({
        title: "Invalid Lead Record",
        message: "Inquiry ID is invalid or missing.",
        tone: "danger",
      });
      return;
    }
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const { inquiry, emailSent } = await res.json();
        setRows((r) => r.map((x) => (getId(x) === id ? { ...x, ...inquiry, id: getId(x) } : x)));
        if (emailSent) {
          showToast("Lead updated & visit confirmation email sent to resident via SMTP!", "success");
        } else {
          showToast("Lead record updated successfully!", "success");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        await showAlert({
          title: "Update Failed",
          message: err.error || "Failed to update lead status.",
          tone: "danger",
        });
      }
    } catch {
      await showAlert({
        title: "Network Error",
        message: "Failed to update lead. Please check your connection.",
        tone: "danger",
      });
    } finally {
      setSavingId("");
    }
  };

  const openVisitModal = (item: Inquiry) => {
    setVisitModalInquiry(item);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    setVisitDate(item.visit?.date || tomorrow);
    setVisitTime(item.visit?.time || "04:00 PM - 06:00 PM");
    setVisitEmail(item.email || "");
    setVisitSendEmail(true);
    setVisitNotes(item.notes || "");
  };

  const getVisitWhatsAppUrl = (item: Inquiry, customDate?: string, customTime?: string) => {
    const cleanPhone = item.phone.replace(/[^0-9]/g, "").slice(-10);
    const propName = item.propertySlug ? propertyNames[item.propertySlug] || item.propertySlug : item.areaSlug || "Luxora PG";
    const dateStr = customDate || (item.visit?.date ? fmtDate(item.visit.date) : "soon");
    const timeStr = customTime || item.visit?.time || "";
    const msg = `Hello ${item.name}! Your visit to ${propName} has been scheduled for ${dateStr}${timeStr ? ` (${timeStr})` : ""}. Our coordinator will welcome you and show you around. Please let us know if you need any directions!`;
    return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const submitVisitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitModalInquiry) return;
    const itemId = getId(visitModalInquiry);
    if (!itemId) return;
    if (!visitDate) {
      await showAlert({ title: "Date Required", message: "Please pick a visit date.", tone: "warning" });
      return;
    }
    setIsSavingVisit(true);
    try {
      await patch(itemId, {
        status: "visit-scheduled",
        email: visitEmail.trim() || undefined,
        sendEmail: visitSendEmail && !!visitEmail.trim(),
        notes: visitNotes,
        visit: {
          date: visitDate,
          time: visitTime,
          status: "confirmed",
          confirmedSlot: `${visitDate} ${visitTime}`.trim(),
        },
      });
      setVisitModalInquiry(null);
    } finally {
      setIsSavingVisit(false);
    }
  };

  const handleTransition = async (item: Inquiry, target: string) => {
    if (!target) return;
    const itemId = getId(item);
    if (!itemId) return;

    if (target === "visit-scheduled" || target === "schedule-visit-modal") {
      openVisitModal(item);
      return;
    }

    if (target === "closed") {
      const ok = await showConfirm({
        title: "Archive Inquiry Lead",
        message: `Move lead "${item.name}" to Closed/Archived?`,
        tone: "neutral",
        confirmLabel: "Archive Lead",
      });
      if (ok) patch(itemId, { status: "closed" });
      return;
    }

    if (target === "converted") {
      const ok = await showConfirm({
        title: "Admit & Convert Resident",
        message: `Confirm admission for "${item.name}"? This marks the lead as successfully converted!`,
        tone: "success",
        confirmLabel: "Mark as Admitted",
      });
      if (ok) patch(itemId, { status: "converted" });
      return;
    }

    patch(itemId, { status: target as InquiryStatus });
  };

  const deleteInquiry = async (id: string) => {
    if (!id || id === "undefined") return;
    const ok = await showConfirm({
      title: "Remove Inquiry Lead",
      message: "Are you sure you want to permanently remove this inquiry lead? This action cannot be undone.",
      tone: "danger",
      danger: true,
      confirmLabel: "Delete Lead",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((r) => r.filter((x) => getId(x) !== id));
        showToast("Inquiry lead removed from CRM.", "info");
      } else {
        const err = await res.json().catch(() => ({}));
        await showAlert({
          title: "Delete Failed",
          message: err.error || "Could not delete this inquiry.",
          tone: "danger",
        });
      }
    } catch {
      await showAlert({
        title: "Error",
        message: "Failed to delete inquiry lead.",
        tone: "danger",
      });
    }
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
                const itemId = getId(item);
                const cleanPhone = item.phone.replace(/[^0-9]/g, "");
                const currentStatusObj = STATUSES.find((s) => s.key === item.status) || STATUSES[0];
                const CurrentStatusIcon = currentStatusObj.icon || Clock;

                return (
                  <tr key={itemId} className="hover:bg-ink/5 transition-colors group">
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
                        {item.status === "visit-scheduled" || item.visit ? (
                          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-2 text-[11px] space-y-1">
                            <div className="flex items-center gap-1 font-bold text-ink">
                              <CalendarCheck size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>{item.visit?.date ? fmtDate(item.visit.date) : "Visit Scheduled"}</span>
                              {item.visit?.time && <span>· {item.visit.time}</span>}
                            </div>
                            <div className="flex items-center gap-2 pt-0.5">
                              <button
                                type="button"
                                onClick={() => openVisitModal(item)}
                                className="text-[10px] font-bold text-brand hover:underline"
                              >
                                Reschedule
                              </button>
                              <span className="text-mute">·</span>
                              <a
                                href={getVisitWhatsAppUrl(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                title="Send visit pass to resident on WhatsApp"
                              >
                                <MessageSquare size={10} /> WhatsApp Pass
                              </a>
                            </div>
                          </div>
                        ) : item.moveIn ? (
                          <div className="space-y-1">
                            <span className="text-[11px] text-mute block">
                              Move-in: <strong>{fmtDate(item.moveIn)}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => openVisitModal(item)}
                              className="text-[10px] font-bold text-brand hover:underline flex items-center gap-1"
                            >
                              <Calendar size={10} /> Schedule Visit
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-mute text-[11px]">Immediate</span>
                            <button
                              type="button"
                              onClick={() => openVisitModal(item)}
                              className="text-[10px] font-bold text-brand hover:underline"
                            >
                              + Schedule
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status & Progressive Pipeline */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5 min-w-[170px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border shadow-2xs",
                              currentStatusObj.color
                            )}
                          >
                            <CurrentStatusIcon size={12} />
                            <span>{currentStatusObj.label}</span>
                          </span>
                        </div>

                        {/* Next Step Selector */}
                        <div className="relative">
                          <select
                            value=""
                            disabled={savingId === itemId}
                            onChange={(e) => handleTransition(item, e.target.value)}
                            className="text-[11px] font-semibold bg-surface border border-ink/15 hover:border-brand/40 text-ink rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer transition shadow-2xs"
                            aria-label="Advance lead to next pipeline stage"
                          >
                            <option value="" disabled>
                              ⚡ Next Step →
                            </option>
                            <optgroup label="Recommended Next Steps">
                              {(PIPELINE_TRANSITIONS[item.status] || []).map((step) => (
                                <option key={step.label} value={step.isVisitModal ? "schedule-visit-modal" : step.value}>
                                  {step.label}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="── All Statuses (Override) ──">
                              {STATUSES.filter((s) => s.key !== item.status).map((s) => (
                                <option key={s.key} value={s.key}>
                                  Change to {s.label}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    </td>

                    {/* Actions & Notes */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedNotesId(expandedNotesId === itemId ? null : itemId)
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
                          onClick={() => deleteInquiry(itemId)}
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
            const itemId = getId(item);
            const cleanPhone = item.phone.replace(/[^0-9]/g, "");
            const currentStatusObj = STATUSES.find((s) => s.key === item.status) || STATUSES[0];
            const CurrentStatusIcon = currentStatusObj.icon || Clock;

            return (
              <div key={itemId} className="p-4 space-y-3">
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

                  <div className="space-y-1.5 min-w-[130px] text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                        currentStatusObj.color
                      )}
                    >
                      <CurrentStatusIcon size={10} />
                      <span>{currentStatusObj.label}</span>
                    </span>

                    <select
                      value=""
                      disabled={savingId === itemId}
                      onChange={(e) => handleTransition(item, e.target.value)}
                      className="text-[11px] font-semibold bg-surface border border-ink/15 text-ink rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                    >
                      <option value="" disabled>
                        ⚡ Next Step →
                      </option>
                      <optgroup label="Recommended Next Steps">
                        {(PIPELINE_TRANSITIONS[item.status] || []).map((step) => (
                          <option key={step.label} value={step.isVisitModal ? "schedule-visit-modal" : step.value}>
                            {step.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="── All Statuses ──">
                        {STATUSES.filter((s) => s.key !== item.status).map((s) => (
                          <option key={s.key} value={s.key}>
                            Change to {s.label}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Target stay / room */}
                <div className="rounded-xl bg-ink/5 p-2.5 text-xs space-y-1.5">
                  <div className="flex items-center gap-1 font-semibold text-ink">
                    <Building2 size={13} className="text-brand shrink-0" />
                    <span>
                      {item.propertySlug ? propertyNames[item.propertySlug] || item.propertySlug : item.areaSlug || "General Inquiry"}
                    </span>
                    {item.roomType && (
                      <span className="text-mute font-normal capitalize">({item.roomType} sharing)</span>
                    )}
                  </div>
                  {item.status === "visit-scheduled" || item.visit ? (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300">
                        <CalendarCheck size={12} />
                        <span>Visit: {item.visit?.date ? fmtDate(item.visit.date) : "Scheduled"} {item.visit?.time ? `(${item.visit.time})` : ""}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => openVisitModal(item)}
                          className="text-[10px] font-bold text-brand hover:underline"
                        >
                          Reschedule
                        </button>
                        <span className="text-mute">·</span>
                        <a
                          href={getVisitWhatsAppUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          <MessageSquare size={10} /> WhatsApp Pass
                        </a>
                      </div>
                    </div>
                  ) : item.moveIn ? (
                    <div className="flex items-center justify-between text-[11px] text-mute font-medium">
                      <span>Move-in: {fmtDate(item.moveIn)}</span>
                      <button
                        type="button"
                        onClick={() => openVisitModal(item)}
                        className="text-[10px] font-bold text-brand hover:underline"
                      >
                        + Schedule Visit
                      </button>
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
                      onClick={() => setExpandedNotesId(expandedNotesId === itemId ? null : itemId)}
                      className={cn(
                        "btn btn-ghost text-xs px-2 py-1 border border-ink/10",
                        item.notes && "text-brand border-brand/30"
                      )}
                    >
                      Notes {item.notes ? "•" : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteInquiry(itemId)}
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

      {/* Schedule PG Visit Modal */}
      {visitModalInquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg rounded-2xl border border-ink/15 bg-surface p-6 shadow-2xl space-y-4 animate-scale-up"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">Schedule PG Walkthrough Visit</h3>
                  <p className="text-xs text-mute mt-0.5">
                    Resident: <strong className="text-ink">{visitModalInquiry.name}</strong> ({visitModalInquiry.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVisitModalInquiry(null)}
                className="text-mute hover:text-ink p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitVisitModal} className="space-y-4">
              {/* Target Property Location */}
              <div className="rounded-xl bg-ink/5 p-3 text-xs flex items-center gap-2">
                <Building2 size={16} className="text-brand shrink-0" />
                <div>
                  <span className="text-mute block text-[10px] uppercase font-bold">Property Location</span>
                  <span className="font-bold text-ink">
                    {visitModalInquiry.propertySlug ? propertyNames[visitModalInquiry.propertySlug] || visitModalInquiry.propertySlug : visitModalInquiry.areaSlug || "Luxora PG"}
                  </span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Visit Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="input text-xs w-full font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Time Slot *</label>
                  <select
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="input text-xs w-full font-medium"
                  >
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM (Morning)</option>
                    <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM (Noon)</option>
                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon)</option>
                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Evening)</option>
                    <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM (Late Walkthrough)</option>
                  </select>
                </div>
              </div>

              {/* Resident Email Notification (SMTP) */}
              <div className="space-y-2 border-t border-ink/10 pt-3">
                <label className="block text-xs font-bold text-ink">Resident Email (Optional)</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3 text-mute" />
                  <input
                    type="email"
                    value={visitEmail}
                    onChange={(e) => setVisitEmail(e.target.value)}
                    placeholder="resident@gmail.com (for automated visit email confirmation)"
                    className="input text-xs w-full pl-9"
                  />
                </div>
                {visitEmail.trim() && (
                  <label className="flex items-center gap-2 text-xs text-mute cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={visitSendEmail}
                      onChange={(e) => setVisitSendEmail(e.target.checked)}
                      className="rounded border-ink/20 text-brand focus:ring-brand"
                    />
                    <span>Send official branded visit confirmation email to resident via SMTP</span>
                  </label>
                )}
              </div>

              {/* Instant WhatsApp Pass Action */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <MessageSquare size={13} />
                    WhatsApp Confirmation Pass
                  </span>
                  <a
                    href={getVisitWhatsAppUrl(visitModalInquiry, visitDate, visitTime)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs hover:bg-emerald-700 transition"
                  >
                    <Send size={11} /> Open WhatsApp
                  </a>
                </div>
                <p className="text-[11px] text-mute line-clamp-2 italic">
                  "Hello {visitModalInquiry.name}! Your visit to {visitModalInquiry.propertySlug ? propertyNames[visitModalInquiry.propertySlug] || visitModalInquiry.propertySlug : "Luxora PG"} has been scheduled for {visitDate || "date"} ({visitTime}). Our coordinator will welcome you..."
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Coordinator / Visit Notes</label>
                <input
                  type="text"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="e.g. Inquiring for Double Sharing with AC; parents joining"
                  className="input text-xs w-full"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-4">
                <button
                  type="button"
                  onClick={() => setVisitModalInquiry(null)}
                  className="btn btn-ghost text-xs min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVisit}
                  className="btn btn-brand text-xs min-h-[38px] font-bold px-4 flex items-center gap-1.5"
                >
                  {isSavingVisit ? "Saving..." : "Confirm & Schedule Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
