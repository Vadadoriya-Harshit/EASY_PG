import { NextResponse } from "next/server";
import { getSession, findAdminUser, updateAdminProfile, verifyPassword, COOKIE, signSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user: any = await findAdminUser(session.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    profile: {
      name: user.name || "Admin",
      email: user.email,
      role: user.role || "admin",
      avatar: user.avatar || "",
      phone: user.phone || "",
      activeSessionId: user.activeSessionId || session.sid || "",
      activeSessionIp: user.activeSessionIp || "Active Session",
      activeSessionAt: user.activeSessionAt ? new Date(user.activeSessionAt).toISOString() : new Date().toISOString(),
      createdAt: user.createdAt || "",
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, avatar, currentPassword, newPassword } = body;

    const user: any = await findAdminUser(session.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
      }
      const isMatch = verifyPassword(currentPassword, user.passwordHash || user.password || "");
      if (!isMatch) {
        return NextResponse.json({ error: "Current password does not match. Please verify." }, { status: 403 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 });
      }
    }

    const updated = await updateAdminProfile(session.email, {
      name,
      phone,
      avatar,
      newPassword: newPassword || undefined,
    });

    const res = NextResponse.json({
      ok: true,
      message: "Profile updated successfully!",
      profile: {
        name: updated?.name || name,
        email: session.email,
        role: updated?.role || session.role,
        avatar: updated?.avatar || avatar || "",
        phone: updated?.phone || phone || "",
      },
    });

    // Refresh session cookie with updated name/avatar
    res.cookies.set(
      COOKIE,
      await signSession(session.email, session.sid, {
        name: updated?.name || name,
        role: updated?.role || session.role,
        avatar: updated?.avatar || avatar || "",
      }),
      {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      }
    );

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update profile." }, { status: 500 });
  }
}
