import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { propertySchema } from "@/lib/validators";
import { getProperty, saveProperty } from "@/lib/repo";
import { recordAvailabilityChange } from "@/lib/vacancy";
import { deliverQueuedVacancyAlerts } from "@/lib/vacancy-delivery";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;

  const body = await readJson(req, 15_000_000);
  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return jsonError(`${i.path.join(".")}: ${i.message}`, 400);
  }
  try {
    const before = await getProperty(parsed.data.slug, true);
    const saved = await saveProperty({ ...parsed.data, updatedAt: "" } as any);
    revalidatePath("/", "layout");
    await auditLog({ actor: a.session.email, action: before ? "property.update" : "property.create", target: saved.slug, ip: clientIp(req) });

    // A room that just flipped to "available" queues e-mails for matching confirmed subscribers.
    let alerts = { events: 0, queued: 0, sent: 0, failed: 0 };
    try {
      const rec = await recordAvailabilityChange(before, saved as any, a.session.email);
      alerts = { ...alerts, ...rec };
      if (rec.queued > 0) {
        const r = await deliverQueuedVacancyAlerts();
        alerts.sent = r.sent;
        alerts.failed = r.failed;
        await auditLog({ actor: a.session.email, action: "vacancy.alerts", target: saved.slug, meta: { queued: rec.queued, sent: r.sent, failed: r.failed } });
      }
    } catch (e: any) {
      // The property IS saved; tell the admin the alerting part needs attention instead of failing the whole save.
      console.error("[vacancy] alerting failed:", e?.message);
      return noStore(NextResponse.json({ ok: true, property: saved, alerts, alertError: "Saved, but vacancy alerts could not be queued. Check the notification log." }));
    }
    return noStore(NextResponse.json({ ok: true, property: saved, alerts }));
  } catch (e: any) {
    console.error("[property] save failed:", e?.message);
    return jsonError("Could not save the property. Nothing was changed.", 500);
  }
}
