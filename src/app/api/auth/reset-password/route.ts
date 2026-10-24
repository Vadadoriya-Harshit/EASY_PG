import { NextResponse } from "next/server";
import { findAdminUser, terminateActiveSession, updateAdminProfile } from "@/lib/auth";
import { verifyOtp, otpErrorMessage, clearOtp } from "@/lib/otp";
import { passwordPolicyError } from "@/lib/passwords";
import { rateLimitShared, rateLimitReset } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, normalizeEmail, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  try {
    const ipLimit = await rateLimitShared(`reset-ip:${ip}`, 5, 15 * 60_000);
    if (!ipLimit.allowed) {
      return jsonError(`Too many password reset attempts from this network. Please wait ${ipLimit.retryAfterSec}s.`, 429, { retryAfterSec: ipLimit.retryAfterSec });
    }

    const body = await readJson(req, 4_000);
    const email = normalizeEmail(body?.email);
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
    const newPassword = body?.newPassword;
    if (!email || !/^\d{6}$/.test(otp)) return jsonError("Enter your email and the 6-digit code.", 400);
    const bad = passwordPolicyError(newPassword);
    if (bad) return jsonError(bad, 400);

    const accLimit = await rateLimitShared(`reset-acc:${email}`, 5, 15 * 60_000);
    if (!accLimit.allowed) {
      return jsonError(`Too many password reset attempts for this account. Please wait ${accLimit.retryAfterSec}s.`, 429, { retryAfterSec: accLimit.retryAfterSec });
    }

    const user = await findAdminUser(email);
    // Same message whether the account exists or not.
    if (!user || user.active === false) return jsonError("The code is incorrect or has expired.", 400);

    const result = await verifyOtp(email, otp, "reset");
    if (!result.valid) {
      await auditLog({ actor: email, action: "auth.reset.fail", ip, meta: { reason: result.reason } });
      return jsonError(otpErrorMessage(result), 400, { reason: result.reason });
    }

    await rateLimitReset(`reset-ip:${ip}`);
    await rateLimitReset(`reset-acc:${email}`);

    await updateAdminProfile(email, { newPassword });
    await terminateActiveSession(email); // every existing session is invalid after a reset
    await clearOtp(email, "login");
    await auditLog({ actor: email, action: "auth.reset.success", ip });
    return noStore(NextResponse.json({ ok: true, message: "Password updated. You can now sign in." }));
  } catch (e: any) {
    console.error("[auth] reset-password error:", e?.message);
    return jsonError("Could not reset the password right now.", 503);
  }
}
