import { NextResponse } from "next/server";
import { inquirySchema } from "@/lib/validators";
import { createInquiry, listInquiries, trackEvent } from "@/lib/repo";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";
import { uid } from "@/lib/utils";
import type { Inquiry } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`inq:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid details", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // honeypot: silently accept bots

  // Same person, same request within 10 minutes: tell them we have it instead of creating a second lead.
  try {
    const since = Date.now() - 10 * 60_000;
    const recent = (await listInquiries()).slice(0, 100);
    if (recent.some((r) => r.phone === d.phone && r.kind === d.kind && (r.propertySlug || "") === (d.propertySlug || "") && Date.parse(r.createdAt) >= since)) {
      return NextResponse.json({ error: "We already have your request. Our team will call you shortly: no need to send it again." }, { status: 409 });
    }
  } catch { /* the duplicate check is best-effort; saving below still reports real failures */ }

  const now = new Date().toISOString();
  const inquiry: Inquiry = {
    id: uid(), kind: d.kind, name: d.name, phone: d.phone,
    propertySlug: d.propertySlug || undefined, areaSlug: d.areaSlug || undefined,
    roomType: d.roomType || undefined, moveIn: d.moveIn || undefined, message: d.message || undefined,
    consent: true, status: "new", source: req.headers.get("referer") || undefined,
    visit: d.kind === "visit" && d.visitDate ? { date: d.visitDate, time: d.visitTime || undefined, status: "requested" } : undefined,
    notes: "", createdAt: now, updatedAt: now,
  };
  try {
    await createInquiry(inquiry);
    await trackEvent(d.kind === "visit" ? "visit_submit" : "inquiry_submit");
  } catch (e) {
    console.error("createInquiry failed", e);
    return NextResponse.json({ error: "We couldn't save your request. Please call or message us instead." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: inquiry.id });
}
