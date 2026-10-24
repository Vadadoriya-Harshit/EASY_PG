import { NextResponse } from "next/server";
import crypto from "crypto";
import { deliverQueuedVacancyAlerts } from "@/lib/vacancy-delivery";
import { jsonError, noStore } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Drains the vacancy-notification queue (retries with back-off). Call it from any scheduler
 * (Vercel Cron, GitHub Actions, cron-job.org) with `Authorization: Bearer $CRON_SECRET`.
 */
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return jsonError("Cron is not configured.", 503);
  const given = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given), b = Buffer.from(secret);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return jsonError("Unauthorized.", 401);
  try {
    return noStore(NextResponse.json({ ok: true, ...(await deliverQueuedVacancyAlerts({ max: 100, deadlineMs: 45_000 })) }));
  } catch (e: any) {
    console.error("[cron] vacancy queue failed:", e?.message);
    return jsonError("Queue processing failed.", 500);
  }
}

export const GET = run;
export const POST = run;
