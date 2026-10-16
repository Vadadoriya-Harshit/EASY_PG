"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { KeySquare, ArrowLeft, CheckCircle2, RefreshCw, ShieldAlert, Sparkles, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function VerifyOtp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [countdown, setCountdown] = useState(600); // 10 minutes

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("sorath_otp_email");
      if (storedEmail && !email) setEmail(storedEmail);
    }
  }, [email]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length < 6) return;
    setBusy(true);
    setErr("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || "admin@luxorapg.com", otp: otp.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("luxora_admin_tab_active", data.sid || "active");
          sessionStorage.removeItem("sorath_otp_email");
        }
        router.replace("/admin");
        router.refresh();
      } else {
        setErr(data.error || "Invalid 6-digit verification code.");
        setBusy(false);
      }
    } catch {
      setErr("Failed to verify code. Please check connection and try again.");
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src="/images/hero-building.jpg"
          alt="Luxora PG Campus"
          className="h-full w-full object-cover brightness-[0.4] contrast-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/85 to-bg/50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md sm:max-w-lg rounded-3xl border border-white/20 bg-surface/85 p-6 sm:p-9 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 pb-5">
          <Link href="/" className="hover:opacity-90 transition min-w-0 shrink">
            <Logo showTagline={true} />
          </Link>
          <span className="shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-xs font-semibold text-accent">
            Step 2 of 2
          </span>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-ink">Enter Verification Code</h1>
        <p className="mt-1 text-xs text-mute">
          A secure 6-digit one-time passcode was sent to{" "}
          <strong className="text-ink">{email || "your registered email"}</strong>.
        </p>

        <form onSubmit={handleVerify} className="mt-6 grid gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wider text-mute">
                6-Digit Security Code
              </label>
              <span className="text-[11px] text-mute">
                Expires in: <strong className="text-warn">{formatTimer(countdown)}</strong>
              </span>
            </div>
            <input
              id="otp"
              name="otp"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              autoFocus
              required
              className="input text-center font-mono text-2xl tracking-[0.4em] font-bold"
            />
          </div>

          {err && (
            <div className="flex items-center gap-2 text-xs font-semibold text-warn">
              <ShieldAlert size={15} />
              <span>{err}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full gap-2 mt-2"
            disabled={busy || otp.length < 6}
          >
            <CheckCircle2 size={16} />
            {busy ? "Verifying…" : "Verify Code & Access Admin"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-4 text-xs text-mute">
          <Link href="/admin/login" className="flex items-center gap-1 hover:text-ink">
            <ArrowLeft size={13} /> Back to Sign In
          </Link>
          <button
            onClick={() => router.push("/admin/login")}
            className="flex items-center gap-1 hover:text-ink"
          >
            <RefreshCw size={13} /> Resend Code
          </button>
        </div>
      </motion.div>
    </div>
  );
}
