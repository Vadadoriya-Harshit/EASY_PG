import crypto from "crypto";
import { collection } from "./db";
import { authSecret } from "./secret";
import { rateLimitShared } from "./rate-limit";

/**
 * One-time passcodes for admin sign-in and password reset.
 *
 * - Generated with crypto.randomInt (CSPRNG), never Math.random.
 * - Only an HMAC of the code is stored, never the code itself.
 * - Stored in the database (TTL index) so verification works across serverless instances / restarts.
 * - Single use, 5-minute lifetime, 5 verification attempts, 60 s resend cooldown, 5 sends per hour.
 * - `login` and `reset` codes are separate: a login code can not reset a password and vice versa.
 */
export type OtpPurpose = "login" | "reset";

export const getOtpTtlMs = () => {
  const v = Number(process.env.OTP_TTL_SEC);
  return !isNaN(v) && v > 0 ? v * 1000 : 5 * 60_000;
};

export const getOtpMaxAttempts = () => {
  if (process.env.DISABLE_RATE_LIMIT === "true" || process.env.RATE_LIMIT_DISABLED === "true") return 999;
  const v = Number(process.env.OTP_MAX_ATTEMPTS);
  return !isNaN(v) && v > 0 ? v : 5;
};

export const getOtpResendCooldownMs = () => {
  if (process.env.DISABLE_RATE_LIMIT === "true" || process.env.RATE_LIMIT_DISABLED === "true") return 0;
  const v = Number(process.env.OTP_RESEND_COOLDOWN_SEC);
  return !isNaN(v) && v >= 0 ? v * 1000 : 60_000;
};

export const getOtpMaxSendsPerHour = () => {
  if (process.env.DISABLE_RATE_LIMIT === "true" || process.env.RATE_LIMIT_DISABLED === "true") return 999;
  const v = Number(process.env.OTP_MAX_SENDS_PER_HOUR);
  return !isNaN(v) && v > 0 ? v : 5;
};

export const OTP_TTL_MS = 5 * 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60_000;
export const OTP_MAX_SENDS_PER_HOUR = 5;

const otps = () => collection("auth_otps", { unique: ["key"], ttl: "expiresAt" });
const keyOf = (email: string, purpose: OtpPurpose) => `${purpose}:${email.toLowerCase().trim()}`;
const hmac = (key: string, code: string) => crypto.createHmac("sha256", authSecret()).update(`${key}:${code}`).digest("hex");

export type IssueResult =
  | { ok: true; code: string; expiresAt: number; resendAfterSec: number }
  | { ok: false; reason: "cooldown" | "limit"; retryAfterSec: number };

export async function issueOtp(email: string, purpose: OtpPurpose): Promise<IssueResult> {
  const key = keyOf(email, purpose);
  const now = Date.now();
  const cooldownMs = getOtpResendCooldownMs();
  const maxSends = getOtpMaxSendsPerHour();
  const ttlMs = getOtpTtlMs();

  const existing = await otps().findOne({ key });
  if (cooldownMs > 0 && existing && existing.sentAt && now - Number(existing.sentAt) < cooldownMs) {
    return { ok: false, reason: "cooldown", retryAfterSec: Math.ceil((cooldownMs - (now - Number(existing.sentAt))) / 1000) };
  }
  const lim = await rateLimitShared(`otp-send:${key}`, maxSends, 3_600_000);
  if (!lim.allowed) return { ok: false, reason: "limit", retryAfterSec: lim.retryAfterSec };

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = now + ttlMs;
  // new code always replaces (and so invalidates) the previous one and resets attempts
  await otps().updateOne(
    { key },
    { $set: { key, hash: hmac(key, code), attempts: 0, sentAt: now, expiresAt: new Date(expiresAt) } },
    { upsert: true }
  );
  return { ok: true, code, expiresAt, resendAfterSec: cooldownMs / 1000 };
}

export type VerifyResult =
  | { valid: true }
  | { valid: false; reason: "none" | "expired" | "locked" | "invalid"; attemptsLeft?: number };

export async function verifyOtp(email: string, code: string, purpose: OtpPurpose): Promise<VerifyResult> {
  const key = keyOf(email, purpose);
  const col = otps();
  const maxAttempts = getOtpMaxAttempts();
  const rec = await col.findOne({ key });
  if (!rec) return { valid: false, reason: "none" };
  if (new Date(rec.expiresAt).getTime() <= Date.now()) {
    await col.deleteOne({ key });
    return { valid: false, reason: "expired" };
  }
  if (!/^\d{6}$/.test(String(code))) return { valid: false, reason: "invalid", attemptsLeft: Math.max(0, maxAttempts - Number(rec.attempts || 0)) };

  // Count the attempt atomically BEFORE comparing, so parallel guesses can not exceed the limit.
  const bumped = await col.updateOne({ key, attempts: { $lt: maxAttempts } }, { $inc: { attempts: 1 } });
  if (!bumped) {
    await col.deleteOne({ key });
    return { valid: false, reason: "locked" };
  }

  const given = Buffer.from(hmac(key, String(code)), "hex");
  const want = Buffer.from(String(bumped.hash), "hex");
  const same = given.length === want.length && crypto.timingSafeEqual(given, want);
  if (same) {
    // single use: only one concurrent request can win the delete
    const removed = await col.deleteOne({ key, hash: bumped.hash });
    return removed === 1 ? { valid: true } : { valid: false, reason: "none" };
  }
  const left = maxAttempts - Number(bumped.attempts);
  if (left <= 0) {
    await col.deleteOne({ key });
    return { valid: false, reason: "locked" };
  }
  return { valid: false, reason: "invalid", attemptsLeft: left };
}

export async function clearOtp(email: string, purpose: OtpPurpose) {
  await otps().deleteOne({ key: keyOf(email, purpose) });
}

export function otpErrorMessage(r: Extract<VerifyResult, { valid: false }>): string {
  switch (r.reason) {
    case "expired": return "This code has expired. Please request a new one.";
    case "locked": return "Too many incorrect attempts. Please request a new code.";
    case "none": return "No active code found. Please request a new one.";
    default: return `Incorrect code.${r.attemptsLeft != null ? ` ${r.attemptsLeft} attempt(s) left.` : ""}`;
  }
}
