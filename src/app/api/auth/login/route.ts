import { NextResponse } from "next/server";
import {
  findAdminUser, checkPassword, hasActiveSession, isLocked, recordLoginFailure, recordLoginSuccess,
  signOtpChallenge, OTP_COOKIE, sessionCookieOptions, COOKIE, newSid, registerActiveSession, signSession, normalizeRole,
} from "@/lib/auth";
import { dummyVerify } from "@/lib/passwords";
import { issueOtp, clearOtp, OTP_TTL_MS } from "@/lib/otp";
import { rateLimitShared, rateLimitReset } from "@/lib/rate-limit";
import { sendOtpEmail } from "@/lib/email";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

const GENERIC = "Incorrect email or password.";

function mask(email: string) {
  const [u, d] = email.split("@");
  return `${u.slice(0, 1)}${"*".repeat(Math.max(1, Math.min(u.length - 1, 6)))}@${d}`;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  try {
    const ipLimit = await rateLimitShared(`login-ip:${ip}`, 5, 5 * 60_000);
    if (!ipLimit.allowed) {
      return jsonError(`Too many sign-in attempts from this network. Please wait ${ipLimit.retryAfterSec}s.`, 429, { retryAfterSec: ipLimit.retryAfterSec });
    }

    const body = await readJson(req, 5_000);
    const { email, password, force } = body || {};
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password || email.length > 254 || password.length > 128) {
      return jsonError("Please enter your email and password.", 400);
    }
    const cleanEmail = email.toLowerCase().trim();

    const accLimit = await rateLimitShared(`login-acc:${cleanEmail}`, 5, 5 * 60_000);
    if (!accLimit.allowed) {
      return jsonError(`Too many sign-in attempts on this account. Please wait ${accLimit.retryAfterSec}s.`, 429, { retryAfterSec: accLimit.retryAfterSec });
    }

    const user = await findAdminUser(cleanEmail);
    if (!user || user.active === false) {
      await dummyVerify(password);
      await auditLog({ actor: "anonymous", action: "auth.login.fail", ip, meta: { reason: user ? "disabled" : "unknown-account" } });
      return jsonError(GENERIC, 401);
    }
    if (await isLocked(user)) {
      await auditLog({ actor: user.email, action: "auth.login.locked", ip });
      return jsonError("This account is temporarily locked after repeated failures. Try again in 15 minutes.", 429);
    }
    if (!(await checkPassword(user, password))) {
      await recordLoginFailure(user.email);
      await auditLog({ actor: user.email, action: "auth.login.fail", ip, meta: { reason: "bad-password" } });
      return jsonError(GENERIC, 401);
    }
    await recordLoginSuccess(user.email);
    await rateLimitReset(`login-acc:${cleanEmail}`);

    // One active session per account. The other session is only replaced after the OTP step succeeds.
    const active = await hasActiveSession(user.email);
    if (active.active && force !== true) {
      return jsonError(
        "This account is already signed in on another device or browser. Only one active session is allowed.",
        409,
        { alreadyLoggedIn: true, since: active.since }
      );
    }

    // Option to disable OTP requirement (e.g. while setting up Resend or in emergencies)
    const requireOtp = process.env.REQUIRE_ADMIN_OTP !== "false" && process.env.DISABLE_LOGIN_OTP !== "true";
    if (!requireOtp) {
      const sid = newSid();
      await registerActiveSession(user.email, sid, ip);
      await auditLog({ actor: user.email, action: "auth.login.success", ip });
      const res = noStore(
        NextResponse.json({
          ok: true,
          requireOtp: false,
          user: { email: user.email, name: user.name || "Admin", role: normalizeRole(user.role), avatar: user.avatar || "" },
        })
      );
      res.cookies.set(COOKIE, await signSession(user.email, sid), sessionCookieOptions());
      return res;
    }

    const issued = await issueOtp(user.email, "login");
    let resendAfterSec = 60;
    if (issued.ok) {
      const sent = await sendOtpEmail({ to: user.email, otp: issued.code, userName: user.name });
      if (!sent.success) {
        await clearOtp(user.email, "login");
        console.error("[auth] OTP e-mail could not be delivered:", sent.error);
        await auditLog({ actor: user.email, action: "auth.otp.send-failed", ip, meta: { error: sent.error || "unknown" } });
        return jsonError("We could not send the verification email. Please try again, or contact the site owner if this keeps happening.", 503, {
          reason: sent.error || "delivery_failed",
        });
      }
      await auditLog({ actor: user.email, action: "auth.otp.sent", ip });
    } else if (issued.reason === "cooldown") {
      resendAfterSec = issued.retryAfterSec; // a code was sent moments ago and is still valid
    } else {
      return jsonError("Too many codes requested. Please try again later.", 429, { retryAfterSec: issued.retryAfterSec });
    }

    const res = noStore(
      NextResponse.json({
        ok: true,
        requireOtp: true,
        maskedEmail: mask(user.email),
        resendAfterSec,
        expiresInSec: OTP_TTL_MS / 1000,
        message: `A 6-digit code was sent to ${mask(user.email)}.`,
      })
    );
    res.cookies.set(OTP_COOKIE, await signOtpChallenge(user.email, { force: force === true }), { ...sessionCookieOptions(600), path: "/api/auth" });
    return res;
  } catch (e: any) {
    console.error("[auth] login error:", e?.message);
    return jsonError("Sign-in is temporarily unavailable. Please try again shortly.", 503);
  }
}
