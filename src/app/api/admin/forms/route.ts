import { NextResponse } from "next/server";
import { listForms, saveForm } from "@/lib/forms";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  try {
    return noStore(NextResponse.json({ ok: true, forms: await listForms() }));
  } catch (e: any) {
    console.error("[forms] list failed:", e?.message);
    return jsonError("Could not load forms.", 500);
  }
}

export async function POST(req: Request) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  const body = await readJson(req, 400_000);
  if (!body) return jsonError("Invalid request.", 400);
  try {
    const r = await saveForm(body, true);
    if (!r.ok) return jsonError(r.error, r.status);
    await auditLog({ actor: a.session.email, action: "form.create", target: r.form.slug, ip: clientIp(req) });
    return noStore(NextResponse.json({ ok: true, form: r.form }));
  } catch (e: any) {
    console.error("[forms] create failed:", e?.message);
    return jsonError("Could not create the form.", 500);
  }
}
