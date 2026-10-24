import { NextResponse } from "next/server";
import { createAdminUser, deleteAdminUser, listAdminUsers, ROLES } from "@/lib/auth";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, normalizeEmail, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

// Managing administrators is a super-admin capability; a plain admin must never be able to mint accounts or roles.
const SUPER = { roles: ["superadmin"] as ("superadmin")[] };

export async function GET() {
  const a = await requireAdmin(SUPER);
  if ("res" in a) return a.res;
  try {
    return noStore(NextResponse.json({ ok: true, data: await listAdminUsers() }));
  } catch (err: any) {
    console.error("[users] list failed:", err?.message);
    return jsonError("Failed to load management users", 500);
  }
}

export async function POST(req: Request) {
  const a = await requireAdmin(SUPER);
  if ("res" in a) return a.res;
  const body = await readJson(req, 5_000);
  const email = normalizeEmail(body?.email);
  if (!email) return jsonError("Enter a valid email address.", 400);
  if (typeof body?.password !== "string") return jsonError("Password is required.", 400);
  const role = body?.role === undefined ? "admin" : body.role;
  if (!ROLES.includes(role)) return jsonError("Unknown role.", 400);
  try {
    const created = await createAdminUser({ name: typeof body.name === "string" ? body.name : "", email, password: body.password, role });
    await auditLog({ actor: a.session.email, action: "user.create", target: email, ip: clientIp(req), meta: { role: created.role } });
    return NextResponse.json({ ok: true, data: created });
  } catch (err: any) {
    const safe = /already exists|Password must/.test(err?.message || "");
    if (!safe) console.error("[users] create failed:", err?.message);
    return jsonError(safe ? err.message : "Failed to create user", safe ? 400 : 500);
  }
}

export async function DELETE(req: Request) {
  const a = await requireAdmin(SUPER);
  if ("res" in a) return a.res;
  const email = normalizeEmail(new URL(req.url).searchParams.get("email"));
  if (!email) return jsonError("A valid email parameter is required.", 400);
  try {
    await deleteAdminUser(email, a.session.email);
    await auditLog({ actor: a.session.email, action: "user.delete", target: email, ip: clientIp(req) });
    return NextResponse.json({ ok: true, message: "User deleted" });
  } catch (err: any) {
    const safe = /cannot delete|not found/i.test(err?.message || "");
    if (!safe) console.error("[users] delete failed:", err?.message);
    return jsonError(safe ? err.message : "Failed to delete user", safe ? 400 : 500);
  }
}
