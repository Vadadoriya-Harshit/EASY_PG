import { NextResponse } from "next/server";
import { listAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/guard";
import { jsonError, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const a = await requireAdmin({ roles: ["superadmin"] });
  if ("res" in a) return a.res;
  try {
    return noStore(NextResponse.json({ ok: true, entries: await listAudit(200) }));
  } catch {
    return jsonError("Failed to load the audit log.", 500);
  }
}
