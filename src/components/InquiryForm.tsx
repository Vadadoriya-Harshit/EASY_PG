"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Loader2,
  Calendar,
  Clock,
  Phone,
  User,
  MapPin,
  Sparkles,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  Building2,
  Zap,
  Check
} from "lucide-react";
import { inquirySchema, type InquiryInput } from "@/lib/validators";
import type { Area, RoomType } from "@/lib/types";
import { ROOM_LABEL, SITE } from "@/lib/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface Props {
  kind?: "inquiry" | "visit";
  propertySlug?: string;
  propertyName?: string;
  areas?: Pick<Area, "slug" | "name">[];
  roomTypes?: RoomType[];
}

const TIME_SLOTS = ["11:00 AM", "2:30 PM", "5:00 PM", "6:30 PM"];
const SHARING_OPTIONS = [
  { id: "single", label: "Private Single AC", desc: "Dedicated study pod" },
  { id: "double", label: "Twin Sharing", desc: "Shared attached washroom" },
  { id: "triple", label: "Triple Budget", desc: "Maximum savings" },
];

export default function InquiryForm({
  kind = "inquiry",
  propertySlug,
  propertyName,
  areas,
  roomTypes,
}: Props) {
  const [formMode, setFormMode] = useState<"inquiry" | "visit">(kind);
  const [selectedSharing, setSelectedSharing] = useState<string>("double");
  const [selectedSlot, setSelectedSlot] = useState<string>("5:00 PM");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  const [phoneVal, setPhoneVal] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      kind: formMode,
      propertySlug: propertySlug ?? "",
      website: "",
      roomType: "double",
      date: new Date().toISOString().slice(0, 10),
    },
  });

  const userName = watch("name") || "";
  const isVisit = formMode === "visit";

  const handleModeSwitch = (newMode: "inquiry" | "visit") => {
    setFormMode(newMode);
    setValue("kind", newMode);
  };

  const onSubmit = async (data: InquiryInput) => {
    setState("sending");
    setErr("");
    try {
      const payload = {
        ...data,
        kind: formMode,
        roomType: selectedSharing,
        timeSlot: isVisit ? selectedSlot : undefined,
      };

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Submission failed. Please check inputs.");

      track(isVisit ? "visit_submit" : "inquiry_submit");
      setState("done");
    } catch (e: any) {
      setErr(e.message);
      setState("idle");
    }
  };

  // Direct WhatsApp Quick Connect
  const openWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello Luxora PG! My name is ${userName || "Resident"}. I am inquiring about ${
        propertyName ? propertyName : "room vacancies"
      } (${selectedSharing} sharing). Please share current availability and rent structure.`
    );
    track("cta_whatsapp");
    window.open(`https://wa.me/${SITE.whatsapp}?text=${text}`, "_blank");
  };

  // Success Celebration Screen
  if (state === "done") {
    const bookingRef = `SPG-${Math.floor(100000 + Math.random() * 900000)}`;
    return (
      <div
        role="status"
        className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-surface to-surface p-8 text-center space-y-4 shadow-xl backdrop-blur-xl animate-fadeIn"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30">
          <CheckCircle2 size={32} />
        </div>

        <div>
          <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 text-xs">
            Booking Request Confirmed
          </span>
          <h3 className="mt-3 text-2xl font-black text-ink">
            {isVisit ? "Walkthrough Scheduled!" : "Inquiry Received!"}
          </h3>
          <p className="mt-1 text-xs text-mute max-w-sm mx-auto">
            {isVisit
              ? `Our property coordinator will greet you for the walkthrough at ${selectedSlot}.`
              : "Our admissions coordinator will review room availability and call you within 30 minutes."}
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-bg/80 p-3.5 text-xs font-mono space-y-1 max-w-xs mx-auto">
          <div className="flex justify-between text-mute">
            <span>Reference ID:</span>
            <strong className="text-brand">{bookingRef}</strong>
          </div>
          <div className="flex justify-between text-mute">
            <span>Sharing Option:</span>
            <strong className="capitalize text-ink">{selectedSharing}</strong>
          </div>
          {isVisit && (
            <div className="flex justify-between text-mute">
              <span>Slot Time:</span>
              <strong className="text-accent">{selectedSlot}</strong>
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={openWhatsAppDirect}
            className="btn btn-primary text-xs py-2 px-4 gap-1.5 shadow-md shadow-brand/25"
          >
            <MessageSquare size={14} /> Open on WhatsApp Now
          </button>
          <button
            onClick={() => setState("idle")}
            className="btn btn-ghost text-xs py-2 px-4"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  const ErrorMsg = ({ k }: { k: string }) =>
    errors[k] ? (
      <p role="alert" className="mt-1 text-xs text-warn font-semibold flex items-center gap-1">
        <span>⚠</span> {String((errors as any)[k].message)}
      </p>
    ) : null;

  return (
    <div className="rounded-3xl border border-ink/10 bg-surface/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative ambient gradient inside card */}
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand/10 blur-[80px] pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-accent/10 blur-[80px] pointer-events-none" />

      {/* =========================================================================
          TOP MODE SELECTOR TABS (International Multi-Action Switcher)
          ========================================================================= */}
      <div className="flex rounded-2xl bg-ink/5 p-1.5 border border-ink/5 mb-6">
        <button
          type="button"
          onClick={() => handleModeSwitch("inquiry")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all",
            !isVisit
              ? "bg-surface text-brand shadow-md ring-1 ring-black/5 dark:ring-white/10"
              : "text-mute hover:text-ink"
          )}
        >
          <Zap size={14} className={!isVisit ? "text-brand" : ""} />
          <span>Quick Callback</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeSwitch("visit")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all",
            isVisit
              ? "bg-surface text-accent shadow-md ring-1 ring-black/5 dark:ring-white/10"
              : "text-mute hover:text-ink"
          )}
        >
          <Calendar size={14} className={isVisit ? "text-accent" : ""} />
          <span>Schedule Free Visit</span>
        </button>
      </div>

      {/* Property Context Banner */}
      {propertyName && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-brand/20 bg-brand/5 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-brand shrink-0" />
            <span className="text-mute">Inquiring for:</span>
            <strong className="text-ink font-bold">{propertyName}</strong>
          </div>
          <span className="rounded-full bg-brand/15 text-brand px-2 py-0.5 text-[10px] font-bold">
            Verified Property
          </span>
        </div>
      )}

      {/* Main Interactive Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <input type="hidden" {...register("kind")} />
        <input type="hidden" {...register("propertySlug")} />
        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" {...register("website")} />
          </label>
        </div>

        {/* 1. Name & Phone (Modern Floating Look) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label text-xs font-bold uppercase tracking-wider text-mute" htmlFor={`n-${kind}`}>
              Full Name
            </label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3.5 text-mute pointer-events-none" />
              <input
                id={`n-${kind}`}
                className="input pl-10 text-sm font-medium"
                autoComplete="name"
                placeholder="e.g. Yash Patel"
                {...register("name")}
              />
            </div>
            <ErrorMsg k="name" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0 text-xs font-bold uppercase tracking-wider text-mute" htmlFor={`p-${kind}`}>
                Mobile Number
              </label>
              {phoneVal.replace(/\D/g, "").length === 10 && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                  <Check size={12} /> Valid 10 Digits
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <Phone size={16} className="absolute left-3.5 text-mute pointer-events-none" />
              <input
                id={`p-${kind}`}
                className="input pl-10 text-sm font-medium"
                inputMode="tel"
                autoComplete="tel"
                placeholder="10-digit phone number"
                {...register("phone")}
                onChange={(e) => {
                  setPhoneVal(e.target.value);
                  register("phone").onChange(e);
                }}
              />
            </div>
            <ErrorMsg k="phone" />
          </div>
        </div>

        {/* 2. Room Sharing Preference Chips */}
        <div>
          <label className="label text-xs font-bold uppercase tracking-wider text-mute mb-2 block">
            Room Sharing Preference
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SHARING_OPTIONS.map((opt) => {
              const isSelected = selectedSharing === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    setSelectedSharing(opt.id);
                    setValue("roomType", opt.id);
                  }}
                  className={cn(
                    "flex flex-col items-start p-2.5 rounded-xl border text-left transition-all",
                    isSelected
                      ? "border-brand bg-brand/10 shadow-sm ring-1 ring-brand/30"
                      : "border-ink/10 bg-bg/60 text-mute hover:border-ink/20 hover:text-ink"
                  )}
                >
                  <span className={cn("text-xs font-bold", isSelected ? "text-brand" : "text-ink")}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-mute line-clamp-1 mt-0.5">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Visit-specific Date & Timing Slots */}
        {isVisit && (
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Calendar size={14} /> Walkthrough Slot
              </span>
              <span className="text-[11px] text-mute">Complimentary Free Tour</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold text-mute uppercase tracking-wider block mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  className="input text-xs"
                  {...register("date")}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-mute uppercase tracking-wider block mb-1">
                  Available Timing
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "rounded-lg py-1.5 px-2 text-xs font-bold transition",
                          isSelected
                            ? "bg-accent text-white shadow-sm"
                            : "bg-surface border border-ink/10 text-mute hover:text-ink"
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Preferred Area (if on general home or contact page) */}
        {!propertySlug && areas && (
          <div>
            <label className="label text-xs font-bold uppercase tracking-wider text-mute mb-1.5 block">
              Preferred Ahmedabad Locality
            </label>
            <div className="relative flex items-center">
              <MapPin size={16} className="absolute left-3.5 text-mute pointer-events-none" />
              <select
                className="input pl-10 text-sm font-medium"
                defaultValue=""
                {...register("area")}
              >
                <option value="">Any Locality (Flexible)</option>
                {areas.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.name} (Ahmedabad)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Error notice */}
        {err && (
          <div className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs font-semibold text-warn">
            {err}
          </div>
        )}

        {/* Submit Action Buttons */}
        <div className="pt-2 space-y-2.5">
          <button
            type="submit"
            disabled={state === "sending"}
            className="btn btn-primary w-full gap-2 text-xs py-3.5 shadow-xl shadow-brand/25 font-bold"
          >
            {state === "sending" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Confirming Request…</span>
              </>
            ) : (
              <>
                <span>{isVisit ? "Schedule Walkthrough Tour" : "Request Instant Callback"}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Quick WhatsApp Connect Alternative */}
          <button
            type="button"
            onClick={openWhatsAppDirect}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            <MessageSquare size={14} />
            <span>Chat Directly on WhatsApp</span>
          </button>
        </div>

        {/* Trust & Privacy Pill */}
        <div className="pt-2 border-t border-ink/10 flex items-center justify-between text-[11px] text-mute">
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-500" /> 100% Zero Brokerage
          </span>
          <span>We respect your privacy · No spam</span>
        </div>
      </form>
    </div>
  );
}
