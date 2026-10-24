import { NextResponse } from "next/server";
import { checkPassword, findAdminUser, getSessionRecord, updateAdminProfile } from "@/lib/auth";
import { passwordPolicyError } from "@/lib/passwords";
import { requireAdmin } from "@/lib/guard";
import { auditLog } from "@/lib/audit";
import { clientIp, jsonError, readJson, noStore } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  const { session } = a;

  const user = await findAdminUser(session.email);
  if (!user) return jsonError("User not found", 404);
  const rec = await getSessionRecord(session.email);

  return noStore(
    NextResponse.json({
      ok: true,
      profile: {
        name: user.name || "Admin",
        email: user.email,
        role: session.role,
        avatar: user.avatar || "",
        phone: user.phone || "",
        activeSessionId: session.sid,
        activeSessionIp: rec?.ip || "This device",
        activeSessionAt: rec?.createdAt ? new Date(Number(rec.createdAt)).toISOString() : new Date().toISOString(),
        createdAt: user.createdAt || "",
      },
    })
  );
}

export async function POST(req: Request) {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  const { session } = a;

  // Own profile only: the target is always the signed-in user, never taken from the request.
  const body = await readJson(req, 700_000);
  if (!body || typeof body !== "object") return jsonError("Invalid request.", 400);
  const { name, phone, avatar, currentPassword, newPassword } = body as Record<string, unknown>;

  try {
    const user = await findAdminUser(session.email);
    if (!user) return jsonError("User not found", 404);

    if (newPassword) {
      if (typeof currentPassword !== "string" || !currentPassword) return jsonError("Current password is required to set a new password.", 400);
      if (!(await checkPassword(user, currentPassword))) {
        await auditLog({ actor: session.email, action: "profile.password.fail", ip: clientIp(req) });
        return jsonError("Current password does not match.", 403);
      }
      const bad = passwordPolicyError(newPassword);
      if (bad) return jsonError(bad, 400);
    }

    const updated = await updateAdminProfile(session.email, {
      name: typeof name === "string" ? name : undefined,
      phone: typeof phone === "string" ? phone : undefined,
      avatar: typeof avatar === "string" ? avatar : undefined,
      newPassword: typeof newPassword === "string" && newPassword ? newPassword : undefined,
    });
    await auditLog({ actor: session.email, action: newPassword ? "profile.password.change" : "profile.update", ip: clientIp(req) });

    return noStore(
      NextResponse.json({
        ok: true,
        message: "Profile updated successfully.",
        profile: { name: updated?.name, email: session.email, role: session.role, avatar: updated?.avatar || "", phone: updated?.phone || "" },
      })
    );
  } catch (err: any) {
    // validation messages from updateAdminProfile are safe to show; anything else is generic
    const safe = /^(Enter a valid|Avatar must|Password must)/.test(err?.message || "");
    if (!safe) console.error("[profile] update failed:", err?.message);
    return jsonError(safe ? err.message : "Failed to update profile.", safe ? 400 : 500);
  }
}
