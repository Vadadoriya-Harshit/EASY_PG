import { NextResponse } from "next/server";
import { deleteSubmission, getForm, listSubmissions } from "@/lib/forms";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, noStore } from "@/lib/http";

export const runtime = "nodejs";
const SLUG = /^[a-z0-9-]{2,60}$/;

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  if (!SLUG.test(params.slug)) return jsonError("Invalid form.", 400);
  if (!(await getForm(params.slug))) return jsonError("Form not found.", 404);
  const rows = await listSubmissions(params.slug);
  // never send the duplicate-detection fingerprint or the hashed IP to the browser
  return noStore(NextResponse.json({ ok: true, submissions: rows.map(({ fp, ipHash, ...r }) => r) }));
}

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!SLUG.test(params.slug) || !/^sub_[a-f0-9]{16}$/.test(id)) return jsonError("Invalid request.", 400);
  const ok = await deleteSubmission(params.slug, id);
  if (!ok) return jsonError("Submission not found.", 404);
  await auditLog({ actor: a.session.email, action: "form.submission.delete", target: `${params.slug}/${id}`, ip: clientIp(req) });
  return noStore(NextResponse.json({ ok: true }));
}
