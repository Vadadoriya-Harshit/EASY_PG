import { NextResponse } from "next/server";
import { publicSubscribeSchema } from "@/lib/validators";
import { subscribe } from "@/lib/vacancy";
import { rateLimitShared } from "@/lib/rate-limit";
import { clientIp, jsonError, readJson, noStore, normalizeEmail } from "@/lib/http";

export const runtime = "nodejs";

/** Same answer whether the address was new, pending or already subscribed (no account/subscription enumeration). */
const NEUTRAL = "Almost done! If this address is not already subscribed, we have emailed you a link to confirm it.";

// Public: subscribe to vacancy e-mail alerts (double opt-in).
export async function POST(req: Request) {
  const ip = clientIp(req);
  try {
    const ipLimit = await rateLimitShared(`vac-sub-ip:${ip}`, 8, 10 * 60_000);
    if (!ipLimit.allowed) return jsonError("Too many requests. Please try again in a few minutes.", 429, { retryAfterSec: ipLimit.retryAfterSec });

    const body = await readJson(req, 5_000);
    if (!body) return jsonError("Invalid request.", 400);
    const parsed = publicSubscribeSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Please check your details.", 400);
    if (parsed.data.website) return NextResponse.json({ ok: true, message: NEUTRAL }); // honeypot: pretend success

    const email = normalizeEmail(parsed.data.email);
    if (!email) return jsonError("Please enter a valid email address.", 400);
    const perEmail = await rateLimitShared(`vac-sub-email:${email}`, 3, 60 * 60_000);
    if (!perEmail.allowed) return NextResponse.json({ ok: true, message: NEUTRAL });

    const out = await subscribe({ ...parsed.data, email, consent: true, source: parsed.data.source || "public" });
    if (!out.ok) return jsonError(out.error, 400);
    if (out.mail && !out.mail.success) {
      console.error("[vacancy] confirmation e-mail could not be delivered");
      return jsonError("We saved your request but could not send the confirmation email just now. Please try again in a little while.", 503);
    }
    return noStore(NextResponse.json({ ok: true, message: NEUTRAL }));
  } catch (e: any) {
    console.error("[vacancy] subscribe failed:", e?.message);
    return jsonError("We could not record your subscription. Please try again.", 500);
  }
}
