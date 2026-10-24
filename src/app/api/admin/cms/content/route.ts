import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchCmsData, updateCmsData, resetCmsData } from "@/lib/cms-store";
import { cmsPatchSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  try {
    return noStore(NextResponse.json({ ok: true, data: await fetchCmsData() }));
  } catch {
    return jsonError("Could not load site content.", 503);
  }
}

export async function POST(req: Request) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;

  const body = await readJson(req, 15_000_000);
  if (!body) return jsonError("Invalid or oversized request.", 400);
  // Allow-list + shape validation: unknown keys are rejected instead of being merged into the stored document.
  const parsed = cmsPatchSchema.safeParse(body);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return jsonError(`${i.path.join(".") || "content"}: ${i.message}`, 400);
  }
  try {
    const updated = await updateCmsData(parsed.data as any);
    revalidatePath("/", "layout");
    await auditLog({ actor: a.session.email, action: "cms.save", ip: clientIp(req), meta: { sections: Object.keys(parsed.data).join(",") } });
    return noStore(NextResponse.json({ ok: true, data: updated }));
  } catch (err: any) {
    console.error("[cms] save failed:", err?.message);
    return jsonError("Could not save site content. Nothing was changed.", 500);
  }
}

export async function DELETE(req: Request) {
  // Wiping all site copy back to factory defaults is a super-admin action.
  const a = await requireAdmin({ roles: ["superadmin"] });
  if ("res" in a) return a.res;
  try {
    const reset = await resetCmsData();
    revalidatePath("/", "layout");
    await auditLog({ actor: a.session.email, action: "cms.reset", ip: clientIp(req) });
    return noStore(NextResponse.json({ ok: true, data: reset }));
  } catch {
    return jsonError("Could not reset site content.", 500);
  }
}
