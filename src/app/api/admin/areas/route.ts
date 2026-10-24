import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { areaSchema } from "@/lib/validators";
import { deleteArea, saveArea } from "@/lib/repo";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  const parsed = areaSchema.safeParse(await readJson(req, 100_000));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid area", 400);
  try {
    await saveArea(parsed.data);
    revalidatePath("/", "layout");
    await auditLog({ actor: a.session.email, action: "area.save", target: parsed.data.slug, ip: clientIp(req) });
    return noStore(NextResponse.json({ ok: true }));
  } catch (e: any) {
    console.error("[area] save failed:", e?.message);
    return jsonError("Could not save the area.", 500);
  }
}

export async function DELETE(req: Request) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug || !/^[a-z0-9-]{2,120}$/.test(slug)) return jsonError("Missing or invalid slug", 400);
  try {
    await deleteArea(slug);
    revalidatePath("/", "layout");
    await auditLog({ actor: a.session.email, action: "area.delete", target: slug, ip: clientIp(req) });
    return noStore(NextResponse.json({ ok: true }));
  } catch (e: any) {
    console.error("[area] delete failed:", e?.message);
    return jsonError("Could not delete the area.", 500);
  }
}
