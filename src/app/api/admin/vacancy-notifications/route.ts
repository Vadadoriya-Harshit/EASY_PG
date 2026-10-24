import { NextResponse } from "next/server";
import { listEvents, retryFailed } from "@/lib/vacancy";
import { deliverQueuedVacancyAlerts } from "@/lib/vacancy-delivery";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  try {
    return noStore(NextResponse.json({ ok: true, events: await listEvents(50) }));
  } catch (e: any) {
    console.error("[vacancy] events failed:", e?.message);
    return jsonError("Failed to load the notification log.", 500);
  }
}

// { action: "retry", eventId? } re-queues failed deliveries and sends; { action: "process" } sends anything due.
export async function POST(req: Request) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  const body = await readJson(req, 2_000);
  const action = body?.action;
  if (action !== "retry" && action !== "process") return jsonError("Unknown action.", 400);
  try {
    let requeued = 0;
    if (action === "retry") requeued = await retryFailed(typeof body?.eventId === "string" ? body.eventId : undefined);
    const r = await deliverQueuedVacancyAlerts();
    await auditLog({ actor: a.session.email, action: `vacancy.notifications.${action}`, ip: clientIp(req), meta: { requeued, sent: r.sent, failed: r.failed } });
    return noStore(NextResponse.json({ ok: true, requeued, ...r }));
  } catch (e: any) {
    console.error("[vacancy] retry failed:", e?.message);
    return jsonError("Could not process the queue.", 500);
  }
}
