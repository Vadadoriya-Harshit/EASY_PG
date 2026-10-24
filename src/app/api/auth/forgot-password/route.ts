import { NextResponse } from "next/server";
import { findAdminUser } from "@/lib/auth";
import { issueOtp, clearOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { rateLimitShared } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, normalizeEmail, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

/** Always answers the same way so the endpoint can not be used to discover which e-mails are admins. */
const NEUTRAL = "If that email belongs to an administrator, a 6-digit reset code has been sent to it.";

export async function POST(req: Request) {
  const ip = clientIp(req);
  try {
    const ipLimit = await rateLimitShared(`forgot-ip:${ip}`, 3, 15 * 60_000);
    if (!ipLimit.allowed) {
      return jsonError(`Too many password reset requests from this network. Please wait ${ipLimit.retryAfterSec}s.`, 429, { retryAfterSec: ipLimit.retryAfterSec });
    }

    const body = await readJson(req, 2_000);
    const email = normalizeEmail(body?.email);
    if (!email) return jsonError("Please enter a valid email address.", 400);

    const emailLimit = await rateLimitShared(`forgot-acc:${email}`, 3, 15 * 60_000);
    if (!emailLimit.allowed) {
      return jsonError(`Too many password reset requests for this account. Please wait ${emailLimit.retryAfterSec}s.`, 429, { retryAfterSec: emailLimit.retryAfterSec });
    }

    const user = await findAdminUser(email);
    if (user && user.active !== false) {
      const issued = await issueOtp(email, "reset");
      if (issued.ok) {
        const sent = await sendOtpEmail({ to: email, otp: issued.code, userName: user.name, purpose: "Password Reset Code" });
        if (!sent.success) {
          await clearOtp(email, "reset");
          console.error("[auth] reset code e-mail could not be delivered");
        }
        await auditLog({ actor: email, action: "auth.reset.requested", ip, meta: { delivered: sent.success } });
      }
    }
    return noStore(NextResponse.json({ ok: true, message: NEUTRAL, email }));
  } catch (e: any) {
    console.error("[auth] forgot-password error:", e?.message);
    return jsonError("Could not process the request right now.", 503);
  }
}
