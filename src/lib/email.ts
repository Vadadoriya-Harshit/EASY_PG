import nodemailer from "nodemailer";

interface SendOtpOptions {
  to: string;
  otp: string;
  userName?: string;
  purpose?: string;
}

/**
 * Creates nodemailer transporter using SMTP environment variables.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends a 6-digit OTP verification email via SMTP with high-security HTML template.
 */
export async function sendOtpEmail({ to, otp, userName, purpose }: SendOtpOptions): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();

  // If SMTP is not yet configured in .env.local, log securely on server terminal only
  if (!transporter) {
    console.warn(`\n[SMTP Notice] SMTP environment variables are missing in .env.local.`);
    console.log(`🔒 [SERVER SECURE LOG] Active OTP for ${to}: [ ${otp} ] (${purpose || "Verification"}, Expires in 10 minutes)\n`);
    return {
      success: false,
      error: "SMTP server is not configured in .env.local. Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.",
    };
  }

  const from = process.env.SMTP_FROM || `"Luxora PG Security" <${process.env.SMTP_USER}>`;

  const digits = otp.split("");
  const subject = purpose ? `Luxora PG: ${purpose} [${otp}]` : `Your Luxora PG Admin Passcode: ${otp}`;
  const headingText = purpose || "Two-Factor Security Code";
  const actionText = purpose
    ? `Use the following 6-digit one-time code to <strong>${purpose.toLowerCase()}</strong>:`
    : `Use the following 6-digit one-time code to complete your sign-in to the <strong>Luxora PG Admin Portal</strong>:`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Luxora PG Admin Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF8F4; padding: 32px 12px 40px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Lightweight Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Top Golden Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header / Same Logo as Website -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              
              <!-- Emblem (Same squircle with L + roof + golden accent) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 12px auto;">
                <tr>
                  <td align="center" style="width: 52px; height: 52px; background: #0F172A; border: 2px solid #F59E0B; border-radius: 14px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
                    <div style="font-family: Georgia, serif; font-size: 24px; font-weight: 900; color: #F59E0B; line-height: 52px; text-shadow: 0 1px 4px rgba(245, 158, 11, 0.4);">
                      L
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Brand Name Wordmark -->
              <div style="font-family: Georgia, serif; font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #0F172A; text-transform: uppercase; margin-bottom: 6px;">
                LUXORA <span style="color: #D97706;">PG</span>
              </div>

              <!-- Slogan Micro-Badge (Pure English, Identical to Website) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 999px; padding: 3px 12px; text-align: center;">
                    <span style="font-size: 9.5px; font-weight: 800; letter-spacing: 1.2px; color: #B45309; text-transform: uppercase;">
                      ✦ &nbsp; FEEL AT HOME &nbsp;•&nbsp; LIVE IN LUXURY &nbsp; ✦
                    </span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Subtle Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #F1F5F9; font-size: 0; line-height: 0;">&nbsp;</div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 24px 32px 16px 32px;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 800; color: #0F172A;">
                ${headingText}
              </h2>

              <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Hello<strong>${userName ? ` ${userName}` : " Administrator"}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 1.6; color: #475569;">
                ${actionText}
              </p>

              <!-- Lightweight Clean 6-Digit OTP Block -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0; background-color: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 14px; padding: 18px 12px; text-align: center;">
                <tr>
                  <td align="center">
                    
                    <!-- Digit Blocks -->
                    <table role="presentation" cellpadding="0" cellspacing="6" border="0" align="center" style="margin: 0 auto;">
                      <tr>
                        ${digits.map(d => `
                          <td align="center" valign="middle" style="width: 42px; height: 50px; background-color: #FFFFFF; border: 1.5px solid #F59E0B; border-radius: 10px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);">
                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: 900; color: #0F172A; line-height: 50px; display: block;">
                              ${d}
                            </span>
                          </td>
                        `).join("")}
                      </tr>
                    </table>

                    <div style="margin-top: 12px; font-size: 11px; font-weight: 700; color: #DC2626;">
                      ⏱ Expires in 10 minutes
                    </div>

                  </td>
                </tr>
              </table>

              <!-- High-Security Zero-Trust Instruction Box (No Clickable Admin Links) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 18px 0; background-color: #FEF3C7; border: 1.5px solid #F59E0B; border-radius: 12px; padding: 14px 16px;">
                <tr>
                  <td valign="top" style="width: 22px; padding-top: 2px;">
                    <span style="font-size: 15px;">🛡️</span>
                  </td>
                  <td style="font-size: 12px; line-height: 1.55; color: #92400E; text-align: left;">
                    <strong style="color: #78350F; font-size: 12.5px; display: block; margin-bottom: 2px;">Zero-Trust Direct Link Policy:</strong>
                    For maximum cybersecurity, this email does <u>not</u> contain any direct portal login links. Please switch to your active browser tab and enter the 6 digits shown above manually.
                  </td>
                </tr>
              </table>

              <!-- Concise Security Note -->
              <div style="background-color: #F1F5F9; border-left: 3px solid #64748B; border-radius: 0 8px 8px 0; padding: 10px 14px; font-size: 11.5px; line-height: 1.5; color: #64748B;">
                <strong>Security Reminder:</strong> Never share this code with anyone. Luxora PG personnel will never ask for your verification code. If you did not request this code, your account credentials may be compromised.
              </div>

            </td>
          </tr>

          <!-- Light Clean Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">
                Luxora PG Luxury Residences
              </div>
              <div style="font-size: 11px; color: #64748B; line-height: 1.5;">
                Satellite · Vastrapur · Navrangpura · Thaltej · Ahmedabad<br />
                Support: <a href="https://wa.me/919825087654" style="color: #D97706; text-decoration: none;">+91 98250 87654</a> · <a href="${siteUrl}" style="color: #D97706; text-decoration: none;">Official Website</a>
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: `Your Luxora PG verification code is: ${otp}. It will expire in 10 minutes.`,
      html,
    });
    console.log(`✅ [SMTP Delivery] OTP email successfully sent to ${to}`);
    return { success: true };
  } catch (err: any) {
    console.error(`❌ [SMTP Error] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}
