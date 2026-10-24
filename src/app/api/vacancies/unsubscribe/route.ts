import { NextResponse } from "next/server";
import { unsubscribe } from "@/lib/vacancy";
import { rateLimitShared } from "@/lib/rate-limit";
import { clientIp, jsonError, noStore } from "@/lib/http";

export const runtime = "nodejs";

/**
 * GET never changes state (mail scanners and link previews fetch GET URLs); it sends people to the confirmation page.
 * POST performs the unsubscribe: used by that page and by e-mail clients' one-click unsubscribe (RFC 8058).
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const to = new URL("/vacancy/unsubscribe", u.origin);
  const id = u.searchParams.get("id"), t = u.searchParams.get("t");
  if (id) to.searchParams.set("id", id);
  if (t) to.searchParams.set("t", t);
  return NextResponse.redirect(to, 303);
}

export async function POST(req: Request) {
  try {
    const lim = await rateLimitShared(`vac-unsub:${clientIp(req)}`, 30, 10 * 60_000);
    if (!lim.allowed) return jsonError("Too many requests.", 429);
    const u = new URL(req.url);
    let id = u.searchParams.get("id") || "", t = u.searchParams.get("t") || "";
    if (!id || !t) {
      const body = await req.json().catch(() => null);
      id = typeof body?.id === "string" ? body.id : id;
      t = typeof body?.t === "string" ? body.t : t;
    }
    if (!/^vs_[a-f0-9]{18}$/.test(id) || !t) return jsonError("This unsubscribe link is not valid.", 400);
    const r = await unsubscribe(id, t);
    if (r === "invalid") return jsonError("This unsubscribe link is not valid.", 400);
    // "gone" is also success from the person's point of view: they will not be emailed.
    return noStore(NextResponse.json({ ok: true }));
  } catch (e: any) {
    console.error("[vacancy] unsubscribe failed:", e?.message);
    return jsonError("Could not unsubscribe right now. Please try again.", 500);
  }
}
