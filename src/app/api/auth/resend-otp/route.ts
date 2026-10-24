import { NextResponse } from "next/server";
import { OTP_COOKIE, findAdminUser, verifyOtpChallenge } from "@/lib/auth";
import { issueOtp, clearOtp, OTP_TTL_MS } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { rateLimitShared } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  try {
    const ipLimit = await rateLimitShared(`resend-otp-ip:${ip}`, 3, 10 * 60_000);
    if (!ipLimit.allowed) {
      return jsonError(`Too many code requests from this network. Please wait ${ipLimit.retryAfterSec}s.`, 429, { retryAfterSec: ipLimit.retryAfterSec });
    }

    const cookie = req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${OTP_COOKIE}=([^;]+)`))?.[1];
    const challenge = await verifyOtpChallenge(cookie);
    if (!challenge) return jsonError("Your sign-in session expired. Please sign in again.", 401, { restart: true });

    const accLimit = await rateLimitShared(`resend-otp-acc:${challenge.email}`, 3, 10 * 60_000);
    if (!accLimit.allowed) {
      return jsonError(`Too many code requests for this account. Please wait ${accLimit.retryAfterSec}s.`, 429, { retryAfterSec: accLimit.retryAfterSec });
    }

    const user = await findAdminUser(challenge.email);
    if (!user || user.active === false) return jsonError("This account is not available.", 403);

    const issued = await issueOtp(user.email, "login");
    if (!issued.ok) {
      return jsonError(
        issued.reason === "cooldown" ? `Please wait ${issued.retryAfterSec}s before requesting another code.` : "Too many codes requested. Please try again later.",
        429,
        { retryAfterSec: issued.retryAfterSec }
      );
    }
    const sent = await sendOtpEmail({ to: user.email, otp: issued.code, userName: user.name });
    if (!sent.success) {
      await clearOtp(user.email, "login");
      return jsonError("We could not send the verification email. Please try again.", 503);
    }
    await auditLog({ actor: user.email, action: "auth.otp.resent", ip });
    return noStore(NextResponse.json({ ok: true, message: "A new code has been sent.", resendAfterSec: issued.resendAfterSec, expiresInSec: OTP_TTL_MS / 1000 }));
  } catch (e: any) {
    console.error("[auth] resend-otp error:", e?.message);
    return jsonError("Could not resend the code right now.", 503);
  }
}
