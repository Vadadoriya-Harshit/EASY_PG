import { NextResponse } from "next/server";
import { verifyOtp, updateAdminProfile, findAdminUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json().catch(() => ({}));

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, 6-digit verification code, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const admin = await findAdminUser(cleanEmail);

    if (!admin) {
      return NextResponse.json(
        { error: "No administrator found with this email." },
        { status: 404 }
      );
    }

    // Verify OTP
    const otpResult = verifyOtp(cleanEmail, otp.trim());
    if (!otpResult.valid) {
      return NextResponse.json(
        { error: otpResult.error || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Update password in MongoDB Atlas
    await updateAdminProfile(cleanEmail, {
      newPassword,
    });

    return NextResponse.json({
      ok: true,
      message: "Password reset successfully! You can now sign in with your new password.",
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: err.message || "Failed to reset password." }, { status: 500 });
  }
}
