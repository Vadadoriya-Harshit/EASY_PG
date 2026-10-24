import { NextResponse } from "next/server";
import {
  COOKIE, OTP_COOKIE, findAdminUser, newSid, registerActiveSession, sessionCookieOptions,
  signSession, verifyOtpChallenge, normalizeRole,
} from "@/lib/auth";
import { verifyOtp, otpErrorMessage } from "@/lib/otp";
import { rateLimitShared } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  try {
    const limit = await rateLimitShared(`verify-otp-ip:${ip}`, 20, 10 * 60_000);
    if (!limit.allowed) return jsonError("Too many attempts. Please wait a few minutes.", 429, { retryAfterSec: limit.retryAfterSec });

    // The sign-in challenge cookie proves the password step succeeded. Without it no code is even checked.
    const cookie = req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${OTP_COOKIE}=([^;]+)`))?.[1];
    const challenge = await verifyOtpChallenge(cookie);
    if (!challenge) return jsonError("Your sign-in session expired. Please enter your email and password again.", 401, { restart: true });

    const body = await readJson(req, 2_000);
    const code = typeof body?.otp === "string" ? body.otp.trim() : "";
    if (!/^\d{6}$/.test(code)) return jsonError("Enter the 6-digit code.", 400);

    const result = await verifyOtp(challenge.email, code, "login");
    if (!result.valid) {
      await auditLog({ actor: challenge.email, action: "auth.otp.fail", ip, meta: { reason: result.reason } });
      const res = jsonError(otpErrorMessage(result), 401, { reason: result.reason, restart: result.reason === "locked" || result.reason === "none" });
      return res;
    }

    const user = await findAdminUser(challenge.email);
    if (!user || user.active === false) return jsonError("This account is not available.", 403);

    const sid = newSid();
    await registerActiveSession(user.email, sid, ip);
    await auditLog({ actor: user.email, action: "auth.login.success", ip });

    const res = noStore(
      NextResponse.json({
        ok: true,
        sid,
        user: { email: user.email, name: user.name || "Admin", role: normalizeRole(user.role), avatar: user.avatar || "" },
      })
    );
    res.cookies.set(COOKIE, await signSession(user.email, sid), sessionCookieOptions());
    res.cookies.set(OTP_COOKIE, "", { ...sessionCookieOptions(), path: "/api/auth", maxAge: 0 });
    return res;
  } catch (e: any) {
    console.error("[auth] verify-otp error:", e?.message);
    return jsonError("Verification is temporarily unavailable. Please try again.", 503);
  }
}
