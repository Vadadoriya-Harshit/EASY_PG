"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import OtpInput from "@/components/OtpInput";
import {
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Login() {
  const router = useRouter();

  // Mode: "login" or "forgot"
  const [mode, setMode] = useState<"login" | "forgot">("login");

  // Login Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: enter email, 2: enter otp & new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotErr, setForgotErr] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const inFlight = useRef(false);

  // Message passed back from the OTP step (expired session, too many attempts...)
  useEffect(() => {
    try {
      const m = new URLSearchParams(window.location.search).get("m");
      if (m) setErr(m.slice(0, 200));
    } catch {}
  }, []);

  const submitLogin = async (e?: React.FormEvent<HTMLFormElement>, force = false) => {
    if (e) e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setErr("");
    if (!force) setAlreadyLoggedIn(false);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, force }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.requireOtp) {
        setAlreadyLoggedIn(false);
        try {
          sessionStorage.setItem(
            "luxora_otp_pending",
            JSON.stringify({
              maskedEmail: data.maskedEmail || "",
              expiresAt: Date.now() + (data.expiresInSec || 300) * 1000,
              resendAt: Date.now() + (data.resendAfterSec || 60) * 1000,
            })
          );
        } catch {}
        router.push("/admin/verify-otp");
        return;
      } else {
        if (data.alreadyLoggedIn) {
          setAlreadyLoggedIn(true);
        }
        setErr(data.error || "Incorrect email or password. Access denied.");
        setBusy(false);
      }
    } catch {
      setErr("Authentication service temporarily unavailable. Please try again.");
      setBusy(false);
    } finally {
      inFlight.current = false;
    }
  };

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setBusy(true);
    setForgotErr("");
    setForgotMsg("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setForgotStep(2);
        setForgotMsg(data.message || "If that email belongs to an administrator, a 6-digit reset code has been sent.");
      } else {
        setForgotErr(data.error || "Could not send verification code.");
      }
    } catch {
      setForgotErr("Network error. Please verify connection.");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setForgotErr("New passwords do not match.");
      return;
    }
    if (newPassword.length < 10 || !/[a-z]/i.test(newPassword) || !/d/.test(newPassword)) {
      setForgotErr("Use at least 10 characters with both letters and numbers.");
      return;
    }
    setBusy(true);
    setForgotErr("");
    setForgotMsg("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setForgotSuccess(true);
        setTimeout(() => {
          setEmail(forgotEmail);
          setMode("login");
          setForgotStep(1);
          setForgotSuccess(false);
          setForgotOtp("");
          setNewPassword("");
          setConfirmPassword("");
          setForgotMsg("");
        }, 1800);
      } else {
        setForgotErr(data.error || "Invalid verification code or failed to reset password.");
      }
    } catch {
      setForgotErr("Failed to connect to reset service.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[92vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background Lighting */}
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

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="card-3d w-full max-w-md sm:max-w-lg rounded-3xl border border-ink/10 bg-surface/90 p-6 sm:p-9 shadow-[0_24px_65px_-12px_rgba(0,0,0,0.18),_inset_0_1px_2px_rgba(255,255,255,0.25)] backdrop-blur-2xl relative isolate"
      >
        {/* Header with Logo */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-ink/10 pb-5">
          <Link href="/" className="hover:opacity-90 transition min-w-0 shrink">
            <Logo showTagline={true} />
          </Link>

          <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand shadow-sm">
            <ShieldCheck size={14} className="shrink-0 text-brand" />
            <span>Official Portal</span>
          </span>
        </div>

        <AnimatePresence mode="wait">
          {mode === "login" ? (
            /* =========================================================================
               STANDARD MANAGEMENT LOGIN FORM
               ========================================================================= */
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mt-6 mb-6 space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                  Management Sign In
                </h1>
                <p className="text-xs text-mute leading-relaxed">
                  Enter authorized administrator credentials to access verified resident leads, room vacancies, and live CMS.
                </p>
              </div>

              <form onSubmit={submitLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Admin Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={16} className="absolute left-3.5 text-mute pointer-events-none" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      required
                      autoComplete="username"
                      className="input pl-10 text-sm placeholder:text-mute/60"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-ink">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotErr("");
                        setForgotMsg("");
                        setForgotStep(1);
                        setMode("forgot");
                      }}
                      className="text-xs font-semibold text-brand hover:underline transition"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-3.5 text-mute pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                      className="input pl-10 pr-10 text-sm placeholder:text-mute/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-mute hover:text-ink transition"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {err && (
                  <div className={cn(
                    "rounded-xl border p-3 text-xs space-y-2.5",
                    alreadyLoggedIn
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-300"
                      : "bg-warn/10 border-warn/30 text-warn"
                  )}>
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-semibold">{err}</span>
                    </div>

                    {alreadyLoggedIn && (
                      <div className="pt-2 border-t border-amber-500/20">
                        <p className="text-[11px] text-mute mb-2">
                          If you closed your other window or lost access to that device, you can continue here. The other session ends once you finish verification:
                        </p>
                        <button
                          type="button"
                          onClick={() => submitLogin(undefined, true)}
                          className="btn btn-warning w-full !text-[11px] py-1.5 font-bold uppercase tracking-wider shadow-sm"
                        >
                          Continue and replace the other session
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full gap-2 text-xs py-3 shadow-xl shadow-brand/25 mt-2"
                  disabled={busy}
                >
                  <KeyRound size={15} />
                  {busy ? "Authenticating…" : "Sign In & Open Panels"}
                  <ArrowRight size={15} />
                </button>
              </form>
            </motion.div>
          ) : (
            /* =========================================================================
               FORGOT PASSWORD FLOW
               ========================================================================= */
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mt-6 mb-5 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setForgotErr("");
                    setForgotMsg("");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-mute hover:text-ink mb-2 transition"
                >
                  <ArrowLeft size={13} /> Back to Sign In
                </button>
                <h1 className="text-2xl font-bold tracking-tight text-ink">
                  Reset Administrator Password
                </h1>
                <p className="text-xs text-mute leading-relaxed">
                  {forgotStep === 1
                    ? "Enter your registered email address to receive a secure 6-digit verification code."
                    : `Enter the 6-digit verification code sent to ${forgotEmail} and choose a new password.`}
                </p>
              </div>

              {forgotSuccess ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-2 my-4">
                  <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Check size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-ink">Password Reset Successfully!</h3>
                  <p className="text-xs text-mute">Redirecting to sign in...</p>
                </div>
              ) : forgotStep === 1 ? (
                <form onSubmit={handleSendResetOtp} className="space-y-4">
                  <div>
                    <label htmlFor="forgotEmail" className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={16} className="absolute left-3.5 text-mute pointer-events-none" />
                      <input
                        id="forgotEmail"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@domain.com"
                        required
                        className="input pl-10 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  {forgotErr && (
                    <div className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{forgotErr}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-full gap-2 text-xs py-3"
                    disabled={busy || !forgotEmail.trim()}
                  >
                    <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
                    {busy ? "Sending Code…" : "Send Reset Code via Email"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {forgotMsg && (
                    <div className="rounded-xl border border-brand/30 bg-brand/10 p-3 text-xs text-brand flex items-center gap-2">
                      <ShieldCheck size={15} className="shrink-0" />
                      <span>{forgotMsg}</span>
                    </div>
                  )}

                  <div>
                    <span id="forgotOtpLabel" className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                      6-Digit Security Code
                    </span>
                    <OtpInput value={forgotOtp} onChange={setForgotOtp} autoFocus labelId="forgotOtpLabel" disabled={busy} />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                      New Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={16} className="absolute left-3.5 text-mute pointer-events-none" />
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="10+ characters, letters and numbers"
                        required
                        minLength={10}
                        className="input pl-10 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 text-mute hover:text-ink"
                      >
                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={16} className="absolute left-3.5 text-mute pointer-events-none" />
                      <input
                        id="confirmPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        minLength={10}
                        className="input pl-10 text-sm"
                      />
                    </div>
                  </div>

                  {forgotErr && (
                    <div className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{forgotErr}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-full gap-2 text-xs py-3"
                    disabled={busy || forgotOtp.length < 6 || !newPassword}
                  >
                    <CheckCircle2 size={15} />
                    {busy ? "Resetting Password…" : "Reset Password & Sign In"}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-ink/10 flex items-center justify-between text-[11px] text-mute">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-500" /> Protected by email verification
          </span>
          <Link href="/" className="hover:text-ink hover:underline">
            ← Return to Website
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
