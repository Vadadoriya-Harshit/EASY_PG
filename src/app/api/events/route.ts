import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/repo";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`evt:${ip}`, 60, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  try {
    const { event } = await req.json();
    if (typeof event === "string") await trackEvent(event);
  } catch {}
  return NextResponse.json({ ok: true });
}
