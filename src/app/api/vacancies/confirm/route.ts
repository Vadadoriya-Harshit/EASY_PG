import { NextResponse } from "next/server";
import { confirmSubscription } from "@/lib/vacancy";
import { rateLimitShared } from "@/lib/rate-limit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const lim = await rateLimitShared(`vac-confirm:${clientIp(req)}`, 20, 10 * 60_000);
    if (!lim.allowed) return jsonError("Too many requests.", 429);
    const body = await readJson(req, 2_000);
    const id = typeof body?.id === "string" ? body.id : "";
    const t = typeof body?.t === "string" ? body.t : "";
    if (!/^vs_[a-f0-9]{18}$/.test(id) || !t) return jsonError("This confirmation link is not valid.", 400);
    const r = await confirmSubscription(id, t);
    if (r === "invalid") return jsonError("This confirmation link is not valid.", 400);
    if (r === "gone") return jsonError("This subscription no longer exists. Please subscribe again.", 404);
    return noStore(NextResponse.json({ ok: true }));
  } catch (e: any) {
    console.error("[vacancy] confirm failed:", e?.message);
    return jsonError("Could not confirm right now. Please try again.", 500);
  }
}
