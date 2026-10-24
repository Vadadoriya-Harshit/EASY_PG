import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteForm, getForm, resolveOptionSets, saveForm } from "@/lib/forms";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";
const SLUG = /^[a-z0-9-]{2,60}$/;

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  if (!SLUG.test(params.slug)) return jsonError("Invalid form.", 400);
  const form = await getForm(params.slug);
  if (!form) return jsonError("Form not found.", 404);
  // live option lists let the builder preview show the same choices visitors will see
  return noStore(NextResponse.json({ ok: true, form, optionSets: await resolveOptionSets(form) }));
}

export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  if (!SLUG.test(params.slug)) return jsonError("Invalid form.", 400);
  const body = await readJson(req, 400_000);
  if (!body || typeof body !== "object") return jsonError("Invalid request.", 400);
  try {
    // the address in the URL is authoritative; a body can not move a form to another slug
    const r = await saveForm({ ...body, slug: params.slug }, false);
    if (!r.ok) return jsonError(r.error, r.status);
    revalidatePath(`/forms/${params.slug}`);
    await auditLog({ actor: a.session.email, action: "form.update", target: params.slug, ip: clientIp(req), meta: { status: r.form.status, version: r.form.version } });
    return noStore(NextResponse.json({ ok: true, form: r.form, optionSets: await resolveOptionSets(r.form) }));
  } catch (e: any) {
    console.error("[forms] update failed:", e?.message);
    return jsonError("Could not save the form. Nothing was changed.", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  if (!SLUG.test(params.slug)) return jsonError("Invalid form.", 400);
  try {
    const ok = await deleteForm(params.slug);
    if (!ok) return jsonError("Form not found.", 404);
    revalidatePath(`/forms/${params.slug}`);
    await auditLog({ actor: a.session.email, action: "form.delete", target: params.slug, ip: clientIp(req) });
    return noStore(NextResponse.json({ ok: true }));
  } catch (e: any) {
    console.error("[forms] delete failed:", e?.message);
    return jsonError("Could not delete the form.", 500);
  }
}
