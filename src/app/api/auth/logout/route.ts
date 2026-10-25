import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, OTP_COOKIE, sessionCookieOptions, terminateSessionById, verifyToken } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { clientIp, noStore } from "@/lib/http";

export const runtime = "nodejs";

/** Revokes the caller's own server-side session and clears the cookies. Safe to call when already signed out. */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const decoded = await verifyToken(cookieStore.get(COOKIE)?.value);
    if (decoded) {
      await terminateSessionById(decoded.sid);
      await auditLog({ actor: decoded.email, action: "auth.logout", ip: clientIp(req) });
    }
  } catch {
    /* clearing the cookie below is what matters */
  }
  const res = noStore(NextResponse.json({ ok: true }));
  res.cookies.set(COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  res.cookies.set(OTP_COOKIE, "", { ...sessionCookieOptions(), path: "/api/auth", maxAge: 0 });
  res.cookies.set("sorath_sid", "", { ...sessionCookieOptions(), maxAge: 0 }); // legacy cookie from earlier versions
  return res;
}
