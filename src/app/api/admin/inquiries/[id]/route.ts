import { NextResponse } from "next/server";
import { inquiryPatchSchema } from "@/lib/validators";
import { updateInquiry } from "@/lib/repo";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) return jsonError("Invalid inquiry.", 400);
  const parsed = inquiryPatchSchema.safeParse(await readJson(req, 20_000));
  if (!parsed.success) return jsonError("Invalid update", 400);
  try {
    const next = await updateInquiry(id, parsed.data as any);
    if (!next) return jsonError("Not found", 404);
    await auditLog({ actor: a.session.email, action: "inquiry.update", target: id, ip: clientIp(req), meta: { status: parsed.data.status ?? null } });
    return noStore(NextResponse.json({ ok: true, inquiry: next }));
  } catch (e: any) {
    console.error("[inquiry] update failed:", e?.message);
    return jsonError("Could not update the inquiry.", 500);
  }
}
