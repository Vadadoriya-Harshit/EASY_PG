import { NextResponse } from "next/server";
import { COOKIE, signSession, verifyOtp, registerActiveSession, findAdminUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`verify-otp:${ip}`, 5, 5 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts from this IP address. Please wait 5 minutes." }, { status: 429 });
  }

  const { email, otp } = await req.json().catch(() => ({}));

  if (typeof email !== "string" || typeof otp !== "string" || !otp.trim()) {
    return NextResponse.json({ error: "Email and 6-digit verification code are required." }, { status: 400 });
  }

  const result = verifyOtp(email, otp);
  if (!result.valid) {
    return NextResponse.json({ error: result.error || "Invalid verification code." }, { status: 401 });
  }

  // Issue unique single-active session identifier
  const newSid = crypto.randomUUID();
  await registerActiveSession(email, newSid, ip);

  const adminUser = await findAdminUser(email);
  const userToken = await signSession(email, newSid, {
    name: adminUser?.name || "Admin",
    role: adminUser?.role || "admin",
    avatar: adminUser?.avatar || "",
  });

  const res = NextResponse.json({
    ok: true,
    message: "Authentication successful.",
    sid: newSid,
    user: {
      email: adminUser?.email || email,
      name: adminUser?.name || "Admin",
      role: adminUser?.role || "admin",
      avatar: adminUser?.avatar || "",
    },
  });

  // Strict HTTP-Only Session Cookies (NO persistent maxAge: destroyed on browser close!)
  res.cookies.set(COOKIE, userToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  res.cookies.set("sorath_sid", newSid, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res;
}
