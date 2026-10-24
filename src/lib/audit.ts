import crypto from "crypto";
import { collection } from "./db";

const audit = () => collection("audit_logs", { indexes: ["at"] });

export interface AuditEntry {
  id: string;
  at: string;
  actor: string; // admin email, or "anonymous"
  action: string; // e.g. "auth.login.success", "property.save"
  target?: string;
  ip?: string;
  meta?: Record<string, string | number | boolean | null>;
}

/** Keys that must never be written to the log, whatever a caller passes in. */
const FORBIDDEN = /pass|otp|secret|token|code|hash/i;

export async function auditLog(e: Omit<AuditEntry, "id" | "at">) {
  try {
    const meta: AuditEntry["meta"] = {};
    for (const [k, v] of Object.entries(e.meta || {})) if (!FORBIDDEN.test(k)) meta[k] = typeof v === "string" ? v.slice(0, 300) : v;
    await audit().insertOne({ id: crypto.randomUUID(), at: new Date().toISOString(), ...e, meta });
  } catch (err: any) {
    // auditing must never break the request it is describing
    console.error("[audit] failed to record", e.action, err?.message);
  }
}

export async function listAudit(limit = 100): Promise<AuditEntry[]> {
  return (await audit().find({}, { sort: { at: -1 }, limit })) as AuditEntry[];
}
