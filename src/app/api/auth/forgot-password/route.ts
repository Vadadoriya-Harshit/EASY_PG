import { NextResponse } from "next/server";
import { findAdminUser, generateAndSaveOtp } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}));

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid administrator email address." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const admin = await findAdminUser(cleanEmail);

    if (!admin) {
      return NextResponse.json(
        { error: "No registered administrator found with this email address." },
        { status: 404 }
      );
    }

    if (admin.active === false) {
      return NextResponse.json(
        { error: "This administrator account is currently suspended. Please contact the owner." },
        { status: 403 }
      );
    }

    // Generate 6-digit secure OTP
    const otp = generateAndSaveOtp(cleanEmail);

    // Send via SMTP
    const mailRes = await sendOtpEmail({
      to: cleanEmail,
      otp,
      userName: admin.name || "Administrator",
      purpose: "Password Reset Code",
    });

    if (!mailRes.success && mailRes.error?.includes("SMTP")) {
      return NextResponse.json({
        ok: true,
        message: "Passcode generated. (SMTP Notice: check server console in development mode).",
        email: cleanEmail,
      });
    }

    return NextResponse.json({
      ok: true,
      message: `A secure 6-digit verification code has been sent to ${cleanEmail}.`,
      email: cleanEmail,
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: err.message || "Failed to process password reset request." }, { status: 500 });
  }
}
