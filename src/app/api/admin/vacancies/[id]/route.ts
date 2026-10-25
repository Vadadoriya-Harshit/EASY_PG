import { NextResponse } from "next/server";
import { deleteSubscriber, patchSubscriber } from "@/lib/vacancy";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

const ID = /^vs_[a-f0-9]{18}$/;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  if (!ID.test(id)) return jsonError("Invalid subscriber.", 400);
  const patch = await readJson(req, 5_000);
  if (!patch || typeof patch !== "object") return jsonError("Invalid request.", 400);
  try {
    const updated = await patchSubscriber(id, patch);
    if (!updated) return jsonError("Subscriber not found.", 404);
    await auditLog({ actor: a.session.email, action: "vacancy.subscriber.update", target: id, ip: clientIp(req) });
    return noStore(NextResponse.json({ ok: true, subscriber: updated }));
  } catch (e: any) {
    console.error("[vacancy] update failed:", e?.message);
    return jsonError("Failed to update the record.", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  if (!ID.test(id)) return jsonError("Invalid subscriber.", 400);
  try {
    const removed = await deleteSubscriber(id);
    if (!removed) return jsonError("Subscriber not found.", 404);
    await auditLog({ actor: a.session.email, action: "vacancy.subscriber.delete", target: id, ip: clientIp(req) });
    return noStore(NextResponse.json({ ok: true }));
  } catch (e: any) {
    console.error("[vacancy] delete failed:", e?.message);
    return jsonError("Failed to delete the record.", 500);
  }
}
