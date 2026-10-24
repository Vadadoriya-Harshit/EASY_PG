import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteProperty } from "@/lib/repo";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  if (!/^[a-z0-9-]{2,120}$/.test(params.slug)) return jsonError("Invalid property.", 400);
  try {
    await deleteProperty(params.slug);
    revalidatePath("/", "layout");
    await auditLog({ actor: a.session.email, action: "property.delete", target: params.slug, ip: clientIp(req) });
    return noStore(NextResponse.json({ ok: true }));
  } catch (e: any) {
    console.error("[property] delete failed:", e?.message);
    return jsonError("Could not delete the property.", 500);
  }
}
