import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { escapeHtml } from "./http";
import { isProd } from "./secret";
import { getSiteUrl } from "./site";

/**
 * Transactional e-mail.
 *
 * Drivers (EMAIL_DRIVER, or auto-detected):
 *  - "smtp": nodemailer using SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS (SMTP_FROM optional).
 *  - "file": development/test only. Writes each message as JSON into ./.mail-outbox so flows can be exercised
 *            without sending anything. Refused in production.
 * Credentials stay server side. Message bodies containing codes are never written to the application log.
 */
export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
}
export interface MailResult { success: boolean; error?: string; messageId?: string }

type Sender = (m: MailInput) => Promise<MailResult>;
const g = globalThis as any;

/** Tests can replace the transport entirely. */
export function __setMailSender(s: Sender | null) { g.__sorathMailSender = s; }

function driver(): "smtp" | "file" | "none" {
  const d = process.env.EMAIL_DRIVER;
  if (d === "file" && !isProd()) return "file";
  if (d === "smtp" || (!d && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) return "smtp";
  if (!d && !isProd()) return "file";
  return "none";
}

export const mailConfigured = () => driver() !== "none";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function smtp() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST, user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass }, connectionTimeout: 10_000, socketTimeout: 15_000 });
  return transporter;
}

export async function sendMail(m: MailInput): Promise<MailResult> {
  if (g.__sorathMailSender) return g.__sorathMailSender(m);
  const d = driver();
  if (d === "none") return { success: false, error: "Email delivery is not configured (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)." };
  if (d === "file") {
    const dir = process.env.MAIL_OUTBOX_DIR || path.join(process.cwd(), ".mail-outbox");
    fs.mkdirSync(dir, { recursive: true });
    const id = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify({ ...m, at: new Date().toISOString() }, null, 2));
    console.log(`[mail] captured ${id}.json (EMAIL_DRIVER=file)`);
    return { success: true, messageId: id };
  }
  const t = smtp();
  if (!t) return { success: false, error: "SMTP credentials are incomplete." };
  const rawFrom = process.env.SMTP_FROM;
  const from = (rawFrom && !rawFrom.includes("your-domain.example"))
    ? rawFrom
    : `"Luxora PG" <${process.env.SMTP_USER || "stay@luxorapg.com"}>`;
  try {
    const info = await t.sendMail({ from, to: m.to, subject: m.subject, text: m.text, html: m.html, headers: m.headers });
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("[mail] delivery failed:", err?.code || err?.message);
    return { success: false, error: err?.message || "Delivery failed" };
  }
}

// ------------------------------------------------------------------ templates
const siteUrl = getSiteUrl;

function shell(opts: { preheader: string; heading: string; bodyHtml: string; footerNote?: string }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:#FAF8F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F4;padding:32px 12px 40px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;">
<tr><td style="height:4px;background:#F59E0B;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:28px 32px 8px;text-align:center;">
<div style="font-family:Georgia,serif;font-size:22px;font-weight:900;letter-spacing:2px;color:#0F172A;text-transform:uppercase;">LUXORA <span style="color:#D97706;">PG</span></div>
<div style="margin-top:4px;font-size:11px;letter-spacing:1px;color:#B45309;text-transform:uppercase;">Feel at home &bull; Live in luxury</div>
</td></tr>
<tr><td style="padding:16px 32px 8px;">
<h2 style="margin:0 0 12px;font-size:18px;color:#0F172A;">${escapeHtml(opts.heading)}</h2>
${opts.bodyHtml}
</td></tr>
<tr><td style="padding:18px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;font-size:11px;line-height:1.6;color:#64748B;">
${opts.footerNote || ""}
<div>Luxora PG &middot; Ahmedabad, Gujarat &middot; <a href="${escapeHtml(siteUrl())}" style="color:#D97706;text-decoration:none;">${escapeHtml(siteUrl().replace(/^https?:\/\//, ""))}</a></div>
</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#475569;">${html}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:20px 0;text-align:center;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#D97706;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;">${escapeHtml(label)}</a></p>`;

/** 6-digit code e-mail for admin sign-in and password reset. */
export async function sendOtpEmail(o: { to: string; otp: string; userName?: string; purpose?: string }): Promise<MailResult> {
  const reset = o.purpose === "Password Reset Code";
  const heading = reset ? "Password reset code" : "Your admin sign-in code";
  const digits = o.otp
    .split("")
    .map((d) => `<td align="center" style="width:40px;height:48px;background:#fff;border:1.5px solid #F59E0B;border-radius:10px;font-family:'Courier New',monospace;font-size:24px;font-weight:900;color:#0F172A;">${escapeHtml(d)}</td>`)
    .join('<td style="width:6px;"></td>');
  const body =
    p(`Hello <strong>${escapeHtml(o.userName || "Administrator")}</strong>,`) +
    p(reset ? "Use this one-time code to reset your Luxora PG admin password:" : "Use this one-time code to finish signing in to the Luxora PG admin portal:") +
    `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:8px auto 14px;"><tr>${digits}</tr></table>` +
    `<p style="margin:0 0 14px;text-align:center;font-size:12px;font-weight:700;color:#DC2626;">Expires in 5 minutes. Single use.</p>` +
    p("Never share this code. Luxora PG staff will never ask for it. If you did not request it, someone may know your password, so change it.");
  return sendMail({
    to: o.to,
    subject: `${o.otp} is your Luxora PG ${reset ? "password reset" : "sign-in"} code`,
    text: `Your Luxora PG ${reset ? "password reset" : "admin sign-in"} code is ${o.otp}. It expires in 5 minutes and can be used once. If you did not request it, change your password.`,
    html: shell({ preheader: `Your code is ${o.otp}`, heading, bodyHtml: body }),
  });
}

/** Double opt-in confirmation for vacancy alerts. */
export async function sendVacancyConfirmEmail(o: { to: string; confirmUrl: string; unsubscribeUrl: string; name?: string }): Promise<MailResult> {
  const body =
    p(`Hi${o.name ? ` ${escapeHtml(o.name)}` : ""},`) +
    p("You asked to be emailed when a bed opens up at Luxora PG. Please confirm your email address so we can start sending alerts.") +
    button(o.confirmUrl, "Confirm my email") +
    p("If you did not request this, ignore this message: you will not be subscribed and we will not email you again.");
  return sendMail({
    to: o.to,
    subject: "Confirm your Luxora PG vacancy alerts",
    text: `Confirm your Luxora PG vacancy alerts: ${o.confirmUrl}\n\nIf you did not request this, ignore this message.\nUnsubscribe: ${o.unsubscribeUrl}`,
    html: shell({
      preheader: "Confirm your email to get bed vacancy alerts",
      heading: "Confirm your vacancy alerts",
      bodyHtml: body,
      footerNote: `<div style="margin-bottom:6px;"><a href="${escapeHtml(o.unsubscribeUrl)}" style="color:#64748B;">Unsubscribe</a></div>`,
    }),
    headers: { "List-Unsubscribe": `<${o.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
}

export interface VacancyMailInput {
  to: string;
  name?: string;
  propertyName: string;
  propertyUrl: string;
  roomLabel: string;
  areaName?: string;
  rentText?: string;
  unsubscribeUrl: string;
}

/** The alert itself. */
export async function sendVacancyAlertEmail(o: VacancyMailInput): Promise<MailResult> {
  const lines = [
    `<strong>${escapeHtml(o.propertyName)}</strong>${o.areaName ? ` &middot; ${escapeHtml(o.areaName)}` : ""}`,
    `${escapeHtml(o.roomLabel)} is now available${o.rentText ? ` &middot; ${escapeHtml(o.rentText)}` : ""}`,
  ];
  const body =
    p(`Hi${o.name ? ` ${escapeHtml(o.name)}` : ""},`) +
    p("A bed you asked about has just become available:") +
    `<div style="margin:0 0 6px;padding:14px 16px;background:#FEF3C7;border:1px solid #FDE68A;border-radius:12px;font-size:14px;line-height:1.7;color:#78350F;">${lines.join("<br/>")}</div>` +
    button(o.propertyUrl, "View room & book a visit") +
    p("Beds go quickly, so reply or call us if you would like to reserve it.");
  return sendMail({
    to: o.to,
    subject: `Bed available: ${o.roomLabel} at ${o.propertyName}`,
    text: `A bed is now available: ${o.roomLabel} at ${o.propertyName}${o.areaName ? ` (${o.areaName})` : ""}.\nView: ${o.propertyUrl}\n\nUnsubscribe: ${o.unsubscribeUrl}`,
    html: shell({
      preheader: `${o.roomLabel} is now available at ${o.propertyName}`,
      heading: "A bed just opened up",
      bodyHtml: body,
      footerNote: `<div style="margin-bottom:6px;">You are receiving this because you subscribed to vacancy alerts. <a href="${escapeHtml(o.unsubscribeUrl)}" style="color:#64748B;">Unsubscribe</a></div>`,
    }),
    headers: { "List-Unsubscribe": `<${o.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
}
