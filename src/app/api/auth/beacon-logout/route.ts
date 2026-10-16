import { NextResponse } from "next/server";
import { COOKIE, getSession, terminateActiveSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    const s = await getSession();
    if (s && s.email) {
      await terminateActiveSession(s.email);
    }
  } catch {}

  const res = NextResponse.json({ ok: true, message: "Session terminated on tab exit." });
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set("sorath_sid", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
