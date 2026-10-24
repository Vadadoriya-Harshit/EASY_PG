"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  MailCheck,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ClipboardPaste,
  KeyRound,
  Lock,
  Sparkles,
  Shield,
  Clock,
} from "lucide-react";
import Logo from "@/components/Logo";
import OtpInput from "@/components/OtpInput";
import ProgressRing from "@/components/ProgressRing";
import { cn } from "@/lib/utils";

interface Pending {
  maskedEmail: string;
  expiresAt: number;
  resendAt: number;
  ttlMs?: number;
}
const KEY = "luxora_otp_pending";
const LEN = 6;

function readPending(): Pending | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    return null;
  }
}

const fmt = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

type Phase = "idle" | "verifying" | "success";

export default function VerifyOtp() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [resending, setResending] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const inFlight = useRef(false);

  useEffect(() => {
    const p = readPending();
    if (!p) {
      router.replace("/admin/login");
      return;
    }
    setPending({ ...p, ttlMs: p.ttlMs || Math.max(p.expiresAt - Date.now(), 1000) });
    setReady(true);
  }, [router]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const expiresIn = pending ? Math.max(0, Math.ceil((pending.expiresAt - now) / 1000)) : 0;
  const resendIn = pending ? Math.max(0, Math.ceil((pending.resendAt - now) / 1000)) : 0;
  const ringValue = pending
    ? Math.min(1, Math.max(0, (pending.expiresAt - now) / (pending.ttlMs || 300_000)))
    : 0;
  const busy = phase !== "idle";

  const backToLogin = useCallback(
    (msg?: string) => {
      try {
        sessionStorage.removeItem(KEY);
      } catch {}
      router.replace(msg ? `/admin/login?m=${encodeURIComponent(msg)}` : "/admin/login");
    },
    [router]
  );

  const verify = useCallback(
    async (code: string) => {
      if (inFlight.current || code.length !== LEN) return;
      inFlight.current = true;
      setPhase("verifying");
      setErr("");
      setInfo("");
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: code }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const reason = data?.reason;
          if (reason === "expired") {
            setErr("Passcode expired. Request a new one.");
          } else if (reason === "locked") {
            backToLogin("Too many incorrect attempts. Please sign in again.");
            return;
          } else {
            const left = typeof data?.attemptsLeft === "number" ? data.attemptsLeft : null;
            setErr(
              left !== null && left > 0
                ? `Invalid passcode. ${left} ${left === 1 ? "attempt" : "attempts"} remaining.`
                : data?.error || "Invalid passcode."
            );
          }
          setPhase("idle");
          inFlight.current = false;
          return;
        }

        // Successfully verified
        try {
          sessionStorage.removeItem(KEY);
        } catch {}
        setPhase("success");
        setTimeout(() => {
          router.replace("/admin/leads");
        }, 900);
      } catch {
        setErr("Could not reach server. Check connection.");
        setPhase("idle");
        inFlight.current = false;
      }
    },
    [backToLogin, router]
  );

  const resend = async () => {
    if (resending || resendIn > 0 || busy) return;
    setResending(true);
    setErr("");
    setInfo("");
    try {
      const res = await fetch("/api/auth/resend-otp", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.reason === "expired") {
          backToLogin("Authentication session expired. Please sign in again.");
          return;
        }
        setErr(data?.error || "Failed to resend passcode.");
        return;
      }
      const newExp = Date.now() + (data.expiresInSec || 300) * 1000;
      const newRes = Date.now() + (data.resendInSec || 60) * 1000;
      const updated: Pending = {
        maskedEmail: pending?.maskedEmail || "",
        expiresAt: newExp,
        resendAt: newRes,
        ttlMs: (data.expiresInSec || 300) * 1000,
      };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(updated));
      } catch {}
      setPending(updated);
      setOtp("");
      setInfo("A fresh 6-digit passcode has been sent to your email.");
    } catch {
      setErr("Failed to dispatch passcode. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.replace(/\D/g, "").slice(0, LEN);
      if (clean) {
        setOtp(clean);
        if (clean.length === LEN) {
          verify(clean);
        }
      }
    } catch (e) {
      console.warn("Could not read from clipboard", e);
    }
  };

  if (!ready) return null;
  const expired = expiresIn === 0;

  return (
    <div className="relative min-h-[92vh] flex items-center justify-center px-4 py-12 overflow-hidden selection:bg-brand selection:text-white">
      {/* Background Lighting - Identical to Login Screen */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src="/images/hero-building.jpg"
          alt="Luxora PG Campus"
          className="h-full w-full object-cover brightness-[0.4] contrast-[1.08] saturate-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/85 to-bg/50" />
        <div className="absolute -left-[10%] top-[-10%] h-[40vmax] w-[40vmax] rounded-full bg-brand/20 blur-[120px] pointer-events-none" />
        <div className="absolute -right-[10%] bottom-0 h-[35vmax] w-[35vmax] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
      </div>

      {/* =========================================================================
          EXECUTIVE 2FA VERIFICATION CONSOLE
          ========================================================================= */}
      <motion.main
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="card-3d w-full max-w-md sm:max-w-lg rounded-3xl border border-ink/10 bg-surface/90 p-6 sm:p-9 shadow-[0_24px_65px_-12px_rgba(0,0,0,0.18),_inset_0_1px_2px_rgba(255,255,255,0.25)] backdrop-blur-2xl relative isolate"
      >
        {/* Top Header Row with Logo & Two-Factor Badge */}
        <div className="flex items-center justify-between border-b border-ink/10 pb-5">
          <Link href="/" className="hover:opacity-90 transition min-w-0" aria-label="Luxora PG home">
            <Logo showTagline={false} />
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-xs font-bold text-brand shadow-xs">
            <ShieldCheck size={13} className="text-brand" />
            <span>2FA Security</span>
          </span>
        </div>

        {/* Hero Identity Badge & Headline */}
        <div className="mt-6 flex items-start gap-4">
          <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand shadow-xs">
            {phase === "success" ? (
              <CheckCircle2 size={30} className="text-emerald-500 animate-bounce" />
            ) : (
              <KeyRound size={26} className="text-brand" />
            )}
            {!expired && phase !== "success" && (
              <ProgressRing
                size={66}
                stroke={3}
                value={ringValue}
                className={cn(
                  "absolute -inset-1.5 transition-colors",
                  ringValue < 0.2 ? "text-red-500" : ringValue < 0.5 ? "text-amber-500" : "text-brand"
                )}
              />
            )}
          </div>

          <div className="min-w-0">
            <h1 id="otp-title" className="text-xl sm:text-2xl font-black text-ink tracking-tight">
              Two-Step Authorization
            </h1>
            <p className="mt-1 text-xs text-mute leading-relaxed">
              Enter the 6-digit one-time passcode sent to:
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink break-all">
              <MailCheck size={13} className="text-brand shrink-0" />
              <span>{pending?.maskedEmail || "your registered email"}</span>
            </div>
          </div>
        </div>

        {/* Interactive OTP Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify(otp);
          }}
          className="mt-6 grid gap-5"
          noValidate
          aria-labelledby="otp-title"
        >
          <div>
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <span id="otp-label" className="font-bold uppercase tracking-wider text-mute flex items-center gap-1.5">
                <Lock size={12} className="text-brand" /> Verification Code
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-brand hover:bg-brand/10 transition"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste size={12} />
                  <span>Paste</span>
                </button>

                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold border transition-colors",
                    expired
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : expiresIn <= 60
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                      : "bg-ink/5 text-ink border-ink/10"
                  )}
                >
                  <Clock size={11} />
                  <span>{expired ? "Expired" : fmt(expiresIn)}</span>
                </div>
              </div>
            </div>

            <motion.div
              animate={err ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.35 }}
            >
              <OtpInput
                value={otp}
                onChange={setOtp}
                length={LEN}
                autoFocus
                disabled={busy}
                invalid={!!err}
                labelId="otp-label"
                describedBy="otp-status"
                onComplete={(code) => {
                  if (!expired) verify(code);
                }}
              />
            </motion.div>
          </div>

          {/* Feedback Messages */}
          <div id="otp-status" role="status" aria-live="polite" className="min-h-[1.5rem] text-xs">
            <AnimatePresence mode="wait">
              {err && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 font-semibold text-red-500 flex items-center gap-2"
                >
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>{err}</span>
                </motion.div>
              )}

              {!err && info && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{info}</span>
                </motion.div>
              )}

              {!err && phase === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
                >
                  <Sparkles size={18} className="text-emerald-500 animate-spin-slow shrink-0" />
                  <span>Passcode confirmed! Redirecting to Management Console…</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            className={cn(
              "btn w-full gap-2.5 py-3.5 text-sm font-bold shadow-lg transition-all duration-300",
              phase === "success"
                ? "bg-emerald-600 text-white shadow-emerald-600/30"
                : "btn-primary shadow-brand/25"
            )}
            disabled={busy || otp.length !== LEN || expired}
            aria-busy={phase === "verifying"}
          >
            {phase === "verifying" ? (
              <>
                <ProgressRing size={18} label="Verifying code" />
                <span>Authenticating Passcode…</span>
              </>
            ) : phase === "success" ? (
              <>
                <CheckCircle2 size={18} />
                <span>Authenticated Successfully</span>
              </>
            ) : (
              <span>Verify & Continue to Console</span>
            )}
          </button>
        </form>

        {/* Resend and Return Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-4 text-xs text-mute">
          <button
            type="button"
            onClick={() => backToLogin()}
            disabled={busy}
            className="flex min-h-[38px] items-center gap-1.5 font-semibold hover:text-ink disabled:opacity-50 transition"
          >
            <ArrowLeft size={13} /> Back to Sign In
          </button>

          <button
            type="button"
            onClick={resend}
            disabled={resendIn > 0 || resending || busy}
            className="flex min-h-[38px] items-center gap-1.5 font-bold text-brand hover:underline disabled:text-mute disabled:cursor-not-allowed disabled:no-underline transition"
          >
            {resending ? (
              <ProgressRing size={14} stroke={2} />
            ) : (
              <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
            )}
            {resendIn > 0 ? `Resend Code in ${resendIn}s` : resending ? "Dispatching…" : "Resend Passcode"}
          </button>
        </div>

        {/* Trust Badges Footer */}
        <div className="mt-5 pt-3 border-t border-ink/8 flex items-center justify-center gap-3 text-[10.5px] text-mute font-medium">
          <span className="flex items-center gap-1">
            <Lock size={10} className="text-emerald-500" /> 256-Bit TLS Security
          </span>
          <span>·</span>
          <span>Single-Use Passcode</span>
          <span>·</span>
          <span>Audit Logged</span>
        </div>
      </motion.main>
    </div>
  );
}
