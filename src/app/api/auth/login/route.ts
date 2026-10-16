import { NextResponse } from "next/server";
import { findAdminUser, verifyPassword, issueOtp, hasActiveSession, terminateActiveSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`login:${ip}`, 5, 5 * 60_000)) {
    return NextResponse.json({ error: "Too many login attempts. For security, please wait 5 minutes." }, { status: 429 });
  }

  const { email, password, force } = await req.json().catch(() => ({}));

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
  }

  const cleanEmail = email.toLowerCase().trim();
  if (!rateLimit(`login-acc:${cleanEmail}`, 5, 5 * 60_000)) {
    return NextResponse.json({ error: "Too many sign-in attempts on this account. Please wait 5 minutes." }, { status: 429 });
  }

  const user: any = await findAdminUser(cleanEmail);
  if (!user) {
    return NextResponse.json({ error: "Incorrect email or account not found in database." }, { status: 401 });
  }

  if (user.active === false) {
    return NextResponse.json({ error: "This administrator account has been disabled." }, { status: 403 });
  }

  const validPw = verifyPassword(password, user.passwordHash || user.password);
  if (!validPw) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  // Check for concurrent active session ("ak sath 2 jgh login nahi hona chhiye already login ki err aani chhiye")
  const activeCheck = await hasActiveSession(cleanEmail);
  if (activeCheck.active && !force) {
    return NextResponse.json(
      {
        error: `This administrator account is already logged in on another device or browser. Simultaneous logins are strictly prohibited for cybersecurity.`,
        alreadyLoggedIn: true,
        since: activeCheck.since,
      },
      { status: 409 }
    );
  }

  if (force) {
    await terminateActiveSession(cleanEmail);
  }

  // Issue 6-digit OTP code for MFA verification
  const targetEmail = user.email.toLowerCase();
  const otp = issueOtp(targetEmail);

  // Send real email via SMTP service
  await sendOtpEmail({
    to: targetEmail,
    otp,
    userName: user.name,
  });

  return NextResponse.json({
    ok: true,
    requireOtp: true,
    email: targetEmail,
    message: `A 6-digit security verification code has been sent to ${targetEmail}.`,
  });
}


