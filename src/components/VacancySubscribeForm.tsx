"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Send, ShieldCheck, MailCheck } from "lucide-react";

interface Props {
  source: string;
  defaultProperty?: string;
  defaultArea?: string;
  /** Footer variant: only the e-mail field is shown up front. */
  compact?: boolean;
  onDone?: () => void;
}

let areaCache: { name: string; slug: string }[] | null = null;

export default function VacancySubscribeForm({ source, defaultProperty, defaultArea, compact, onDone }: Props) {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [area, setArea] = useState(defaultArea || "all");
  const [room, setRoom] = useState("any");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot, must stay empty
  const [areas, setAreas] = useState<{ name: string; slug: string }[]>(areaCache || []);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [err, setErr] = useState("");
  const inFlight = useRef(false);

  useEffect(() => {
    if (compact || areaCache) return;
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((r) => {
        areaCache = r?.data?.areas || [];
        setAreas(areaCache!);
      })
      .catch(() => {});
  }, [compact]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return; // blocks double submits
    setErr("");
    if (!consent) { setErr("Please tick the box to agree to receive vacancy emails."); return; }
    inFlight.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/vacancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          preferredArea: area,
          preferredProperty: defaultProperty || "all",
          sharingType: room,
          consent: true,
          source,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(data.message || "Check your inbox to confirm your email.");
        onDone && setTimeout(onDone, 4500);
      } else {
        setErr(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setErr("Network error. Please check your connection and try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
        <MailCheck className="mx-auto mb-2 text-emerald-500" size={26} />
        <h4 className="text-sm font-bold text-ink">Check your inbox</h4>
        <p className="mt-1 text-xs text-mute">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <label htmlFor={`${uid}-email`} className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink">Email address <span className="text-warn" aria-hidden="true">*</span></label>
        <div className={compact ? "flex flex-col gap-2.5 sm:flex-row" : ""}>
          <input
            id={`${uid}-email`} type="email" inputMode="email" autoComplete="email" required maxLength={254}
            placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
            className="input flex-1 bg-surface/90 text-sm" aria-invalid={!!err} aria-describedby={`${uid}-msg`}
          />
          {compact && (
            <button type="submit" disabled={busy} className="btn btn-primary shrink-0 gap-2 whitespace-nowrap px-6 py-3 text-xs">
              <Send size={15} /> {busy ? "Subscribing…" : "Notify me"}
            </button>
          )}
        </div>
      </div>

      {!compact && (
        <>
          <div>
            <label htmlFor={`${uid}-name`} className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink">Name (optional)</label>
            <input id={`${uid}-name`} type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className="input text-sm" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-area`} className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink">Locality</label>
              <select id={`${uid}-area`} value={area} onChange={(e) => setArea(e.target.value)} className="input text-sm">
                <option value="all">Any locality</option>
                {areas.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${uid}-room`} className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink">Room type</label>
              <select id={`${uid}-room`} value={room} onChange={(e) => setRoom(e.target.value)} className="input text-sm">
                <option value="any">Any room type</option>
                <option value="single">Single private room</option>
                <option value="double">Double sharing</option>
                <option value="triple">Triple sharing</option>
                <option value="dormitory">4-bed dormitory</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* honeypot: hidden from people and assistive tech */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-mute">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
        <span>Email me when a matching bed becomes available. I can unsubscribe any time with one click.</span>
      </label>

      <p id={`${uid}-msg`} role="alert" aria-live="polite" className="min-h-[1rem] text-xs font-semibold text-warn">
        {err && (<span className="inline-flex items-start gap-1.5"><AlertCircle size={14} className="mt-0.5 shrink-0" />{err}</span>)}
      </p>

      {!compact && (
        <>
          <button type="submit" disabled={busy} className="btn btn-primary w-full gap-2 py-3 text-xs shadow-lg shadow-brand/25">
            <Send size={15} /> {busy ? "Subscribing…" : "Email me when a bed opens"}
          </button>
          <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-mute">
            <ShieldCheck size={13} className="text-emerald-500" /> <span>No spam. We confirm your email first and never share it.</span>
          </div>
        </>
      )}
      {compact && <p className="flex items-center gap-1.5 text-[11px] text-mute"><CheckCircle2 size={12} className="text-emerald-500" /> Double opt-in · unsubscribe any time</p>}
    </form>
  );
}
