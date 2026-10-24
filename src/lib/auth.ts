import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import crypto from "crypto";
import { collection, DuplicateKeyError } from "./db";
import { authSecretBytes, isProd } from "./secret";
import { hashPassword, verifyPassword, passwordPolicyError } from "./passwords";

export const COOKIE = "sorath_admin";
export const OTP_COOKIE = "sorath_otp";
const JWT_ISSUER = "luxora-pg";
const JWT_AUDIENCE = "luxora-admin";

export const SESSION_MAX_AGE_SEC = 4 * 60 * 60; // absolute lifetime
export const SESSION_IDLE_MS = 30 * 60_000; // server-side idle timeout

export const ROLES = ["superadmin", "admin"] as const;
export type Role = (typeof ROLES)[number];

export interface AdminSession {
  email: string;
  role: Role;
  sid: string;
  name: string;
  avatar: string;
  phone: string;
}

// ---------------------------------------------------------------- tokens
export async function signSession(email: string, sid: string) {
  return new SignJWT({ email, sid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(authSecretBytes());
}

export async function verifyToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecretBytes(), { issuer: JWT_ISSUER, audience: JWT_AUDIENCE, algorithms: ["HS256"] });
    if (typeof payload.email !== "string" || typeof payload.sid !== "string") return null;
    return payload as { email: string; sid: string; exp: number };
  } catch {
    return null;
  }
}

/** Short-lived proof that the password step succeeded; required (with the emailed code) to finish sign-in. */
export async function signOtpChallenge(email: string, extra: { force?: boolean } = {}) {
  return new SignJWT({ email, purpose: "login-otp", force: !!extra.force })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience("luxora-otp")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(authSecretBytes());
}

export async function verifyOtpChallenge(token?: string): Promise<{ email: string; force: boolean } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecretBytes(), { issuer: JWT_ISSUER, audience: "luxora-otp", algorithms: ["HS256"] });
    if (payload.purpose !== "login-otp" || typeof payload.email !== "string") return null;
    return { email: payload.email, force: payload.force === true };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  sameSite: "strict" as const,
  secure: isProd(),
  path: "/",
  ...(maxAge ? { maxAge } : {}),
});

// ---------------------------------------------------------------- users
export interface AdminUserRecord {
  name?: string;
  email: string;
  passwordHash?: string;
  password?: string; // legacy plaintext, migrated on first successful login
  role?: string;
  active?: boolean;
  avatar?: string;
  phone?: string;
  failedLogins?: number;
  lockedUntil?: number;
  createdAt?: string;
  updatedAt?: string;
}

const users = () => collection("admin_users", { unique: ["email"] });
const sessions = () => collection("admin_sessions", { unique: ["sid"], indexes: ["email"], ttl: "expiresAt" });

export const normalizeRole = (r: unknown): Role => (r === "superadmin" ? "superadmin" : "admin");

let bootstrapped = false;
/**
 * Creates the first super admin from ADMIN_EMAIL / ADMIN_PASSWORD when no admin exists yet.
 * There is deliberately NO built-in default credential: without these variables nobody can sign in.
 */
export async function ensureDefaultAdmin() {
  if (bootstrapped) return;
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const pw = process.env.ADMIN_PASSWORD;
  if (!email || !pw) {
    if (!bootstrapped) console.error("[auth] ADMIN_EMAIL / ADMIN_PASSWORD are not set: no initial admin can be created.");
    return;
  }
  if ((await users().count()) === 0) {
    try {
      await users().insertOne({
        name: "Super Admin", email, passwordHash: await hashPassword(pw), role: "superadmin", active: true, createdAt: new Date().toISOString(),
      });
      console.log("[auth] Initial super admin created for", email);
    } catch (e) {
      if (!(e instanceof DuplicateKeyError)) throw e;
    }
  }
  bootstrapped = true;
}

export async function findAdminUser(email: string): Promise<AdminUserRecord | null> {
  if (!email) return null;
  await ensureDefaultAdmin();
  return (await users().findOne({ email: email.toLowerCase().trim() })) as AdminUserRecord | null;
}

/** Never returns hashes. */
export async function listAdminUsers() {
  await ensureDefaultAdmin();
  const rows = await users().find({}, { sort: { createdAt: 1 } });
  return rows.map((u) => ({
    id: String(u.email),
    name: u.name || "Admin",
    email: u.email as string,
    role: normalizeRole(u.role),
    active: u.active !== false,
    createdAt: u.createdAt || "",
  }));
}

export async function createAdminUser(input: { name?: string; email: string; password: string; role?: unknown }) {
  const email = input.email.toLowerCase().trim();
  const bad = passwordPolicyError(input.password);
  if (bad) throw new Error(bad);
  const doc = {
    name: (input.name || "").trim().slice(0, 80) || "Admin User",
    email,
    passwordHash: await hashPassword(input.password),
    role: normalizeRole(input.role),
    active: true,
    createdAt: new Date().toISOString(),
  };
  try {
    await users().insertOne(doc);
  } catch (e) {
    if (e instanceof DuplicateKeyError) throw new Error("A management user with this email already exists");
    throw e;
  }
  return { name: doc.name, email: doc.email, role: doc.role, active: doc.active };
}

export async function deleteAdminUser(email: string, actorEmail: string) {
  const em = email.toLowerCase().trim();
  if (em === actorEmail.toLowerCase()) throw new Error("You cannot delete your own account.");
  const target = await findAdminUser(em);
  if (!target) throw new Error("User not found.");
  if (normalizeRole(target.role) === "superadmin") {
    const supers = (await users().find({ role: "superadmin" })).filter((u) => u.active !== false);
    if (supers.length <= 1) throw new Error("Cannot delete the last super admin.");
  }
  await users().deleteOne({ email: em });
  await terminateActiveSession(em);
}

const AVATAR_OK = /^(\/[A-Za-z0-9_\-./]+|https:\/\/[^\s"'<>]+|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/;

export async function updateAdminProfile(
  email: string,
  updates: { name?: string; phone?: string; avatar?: string; newPassword?: string }
): Promise<AdminUserRecord | null> {
  const em = email.toLowerCase().trim();
  const $set: Record<string, any> = { updatedAt: new Date().toISOString() };
  if (updates.name !== undefined) $set.name = String(updates.name).trim().slice(0, 80);
  if (updates.phone !== undefined) {
    const p = String(updates.phone).trim();
    if (p && !/^[0-9+()\-\s]{6,20}$/.test(p)) throw new Error("Enter a valid phone number.");
    $set.phone = p;
  }
  if (updates.avatar !== undefined) {
    const a = String(updates.avatar);
    if (a && (a.length > 600_000 || !AVATAR_OK.test(a))) throw new Error("Avatar must be an image upload or an https URL.");
    $set.avatar = a;
  }
  const $unset: Record<string, 1> = {};
  if (updates.newPassword) {
    const bad = passwordPolicyError(updates.newPassword);
    if (bad) throw new Error(bad);
    $set.passwordHash = await hashPassword(updates.newPassword);
    $unset.password = 1;
    $set.failedLogins = 0;
  }
  await users().updateOne({ email: em }, Object.keys($unset).length ? { $set, $unset } : { $set });
  return findAdminUser(em);
}

// ---------------------------------------------------------------- login throttling per account
const getMaxFails = () => {
  if (process.env.DISABLE_RATE_LIMIT === "true" || process.env.RATE_LIMIT_DISABLED === "true") return 99999;
  const v = Number(process.env.ACCOUNT_LOCK_MAX_FAILS);
  return !isNaN(v) && v > 0 ? v : 8;
};

const getLockMs = () => {
  const v = Number(process.env.ACCOUNT_LOCK_DURATION_MIN);
  return !isNaN(v) && v > 0 ? v * 60_000 : 15 * 60_000;
};

export async function isLocked(user: AdminUserRecord) {
  if (process.env.DISABLE_RATE_LIMIT === "true" || process.env.RATE_LIMIT_DISABLED === "true") return false;
  return !!user.lockedUntil && user.lockedUntil > Date.now();
}

export async function recordLoginFailure(email: string) {
  const u = await users().updateOne({ email }, { $inc: { failedLogins: 1 } });
  if (u && Number(u.failedLogins) >= getMaxFails()) {
    await users().updateOne({ email }, { $set: { lockedUntil: Date.now() + getLockMs(), failedLogins: 0 } });
  }
}

export async function recordLoginSuccess(email: string) {
  await users().updateOne({ email }, { $set: { failedLogins: 0 }, $unset: { lockedUntil: 1 } });
}

/** Checks the password and silently upgrades legacy hashes to scrypt. */
export async function checkPassword(user: AdminUserRecord, input: string) {
  const check = await verifyPassword(input, user.passwordHash || user.password);
  if (check.ok && check.needsRehash) {
    await users().updateOne({ email: user.email }, { $set: { passwordHash: await hashPassword(input) }, $unset: { password: 1 } });
  }
  return check.ok;
}

// ---------------------------------------------------------------- sessions (server-side, revocable)
export async function registerActiveSession(email: string, sid: string, ip: string) {
  const em = email.toLowerCase().trim();
  await sessions().deleteMany({ email: em }); // single active session per account
  const now = Date.now();
  await sessions().insertOne({ sid, email: em, ip, createdAt: now, lastActive: now, expiresAt: new Date(now + SESSION_MAX_AGE_SEC * 1000) });
}

export async function terminateActiveSession(email: string) {
  await sessions().deleteMany({ email: email.toLowerCase().trim() });
}

export async function terminateSessionById(sid: string) {
  await sessions().deleteOne({ sid });
}

export async function hasActiveSession(email: string): Promise<{ active: boolean; ip?: string; since?: string }> {
  const rows = await sessions().find({ email: email.toLowerCase().trim(), expiresAt: { $gt: new Date() }, lastActive: { $gt: Date.now() - SESSION_IDLE_MS } });
  const s = rows[0];
  if (!s) return { active: false };
  return { active: true, ip: s.ip, since: new Date(s.createdAt).toISOString() };
}

export async function getSessionRecord(email: string) {
  return sessions().findOne({ email: email.toLowerCase().trim() });
}

/** Fail-closed: a token without a live server-side record is not a session. */
export async function isSessionActive(email: string, sid: string): Promise<boolean> {
  const rec = await sessions().findOne({ sid, email: email.toLowerCase().trim() });
  if (!rec) return false;
  const now = Date.now();
  if (new Date(rec.expiresAt).getTime() <= now || now - Number(rec.lastActive) > SESSION_IDLE_MS) {
    await sessions().deleteOne({ sid });
    return false;
  }
  if (now - Number(rec.lastActive) > 60_000) await sessions().updateOne({ sid }, { $set: { lastActive: now } });
  return true;
}

/** Full server-side session lookup. Role, name, status all come from the database, never from the token. */
/** De-duplicated per request: layout + page + handlers share one lookup. */
export const getSession = cache(async (): Promise<AdminSession | null> => {
  const token = cookies().get(COOKIE)?.value;
  return sessionFromToken(token);
});

export async function sessionFromToken(token?: string): Promise<AdminSession | null> {
  const decoded = await verifyToken(token);
  if (!decoded) return null;
  if (!(await isSessionActive(decoded.email, decoded.sid))) return null;
  const user = await findAdminUser(decoded.email);
  if (!user || user.active === false) return null;
  return {
    email: user.email,
    role: normalizeRole(user.role),
    sid: decoded.sid,
    name: user.name || "Admin",
    avatar: user.avatar || "",
    phone: user.phone || "",
  };
}

export function newSid() {
  return crypto.randomUUID();
}
