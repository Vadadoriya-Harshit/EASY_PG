import { NextResponse } from "next/server";
import { inquiryPatchSchema } from "@/lib/validators";
import { updateInquiry, deleteInquiry, getProperty } from "@/lib/repo";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";
import { sendVisitConfirmationEmail, mailConfigured } from "@/lib/email";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(params.id)) return jsonError("Invalid inquiry.", 400);
  const parsed = inquiryPatchSchema.safeParse(await readJson(req, 20_000));
  if (!parsed.success) return jsonError("Invalid update", 400);
  try {
    const { sendEmail, ...fieldsToUpdate } = parsed.data;
    const next = await updateInquiry(params.id, fieldsToUpdate as any);
    if (!next) return jsonError("Not found", 404);

    let emailSent = false;
    const recipientEmail = fieldsToUpdate.email || next.email;
    if (sendEmail && recipientEmail && parsed.data.visit?.date && mailConfigured()) {
      try {
        const prop = next.propertySlug ? await getProperty(next.propertySlug) : null;
        const mailRes = await sendVisitConfirmationEmail({
          to: recipientEmail,
          name: next.name,
          propertyName: prop?.name || "Luxora PG",
          propertyAddress: prop?.address,
          visitDate: parsed.data.visit.date,
          visitTime: parsed.data.visit.time,
          coordinatorPhone: prop?.phone || undefined,
        });
        emailSent = !!mailRes.success;
      } catch (err) {
        console.warn("[inquiry] visit confirmation email failed:", err);
      }
    }

    await auditLog({
      actor: a.session.email,
      action: "inquiry.update",
      target: params.id,
      ip: clientIp(req),
      meta: { status: parsed.data.status ?? null, emailSent },
    });
    return noStore(NextResponse.json({ ok: true, inquiry: next, emailSent }));
  } catch (e: any) {
    console.error("[inquiry] update failed:", e?.message);
    return jsonError("Could not update the inquiry.", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(params.id)) return jsonError("Invalid inquiry.", 400);
  try {
    const ok = await deleteInquiry(params.id);
    if (!ok) return jsonError("Not found", 404);
    await auditLog({ actor: a.session.email, action: "inquiry.delete", target: params.id, ip: clientIp(req) });
    return noStore(NextResponse.json({ ok: true }));
  } catch (e: any) {
    console.error("[inquiry] delete failed:", e?.message);
    return jsonError("Could not delete the inquiry.", 500);
  }
}
