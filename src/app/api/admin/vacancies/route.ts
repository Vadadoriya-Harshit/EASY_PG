import { NextResponse } from "next/server";
import { listSubscribers, subscribe } from "@/lib/vacancy";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  try {
    return noStore(NextResponse.json({ ok: true, subscribers: await listSubscribers() }));
  } catch (e: any) {
    console.error("[vacancy] list failed:", e?.message);
    return jsonError("Failed to load subscribers.", 500);
  }
}

// Admin adds a subscriber who has already consented (e.g. by phone/in person). Recorded as such in the audit log.
export async function POST(req: Request) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  const body = await readJson(req, 5_000);
  if (!body) return jsonError("Invalid request.", 400);
  try {
    const out = await subscribe({ ...body, source: "admin-entry" }, { byAdmin: true });
    if (!out.ok) return jsonError(out.error, 400);
    await auditLog({ actor: a.session.email, action: "vacancy.subscriber.add", target: String(body.email || "").toLowerCase(), ip: clientIp(req) });
    return noStore(NextResponse.json({ ok: true, created: out.created }));
  } catch (e: any) {
    console.error("[vacancy] admin add failed:", e?.message);
    return jsonError("Could not add the subscriber.", 500);
  }
}
