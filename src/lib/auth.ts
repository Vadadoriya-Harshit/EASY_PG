import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const COOKIE = "sorath_admin";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "sorath-pg-secure-auth-secret-key-32chars-min!");

import crypto from "crypto";
import { AdminUserModel, connect } from "./models";

export interface ActiveSessionRecord {
  sessionId: string;
  ip: string;
  loginTime: number;
  lastActive: number;
}

const gGlobal = globalThis as any;
const activeSessionMap: Map<string, ActiveSessionRecord> = (gGlobal.__sorathActiveSessions ??= new Map());

export interface AdminSession {
  email: string;
  role: string;
  sid?: string;
  name?: string;
  avatar?: string;
  phone?: string;
}

export async function signSession(
  email: string,
  sessionId?: string,
  extra?: { name?: string; role?: string; avatar?: string }
) {
  const sid = sessionId || crypto.randomUUID();
  return new SignJWT({
    email,
    role: extra?.role || "admin",
    name: extra?.name || "Admin",
    avatar: extra?.avatar || "",
    sid,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("4h")
    .sign(secret());
}

export async function verifyToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as { email: string; role: string; sid?: string; name?: string; avatar?: string };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminSession | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const decoded = await verifyToken(token);
  if (!decoded) return null;

  // Single-session validation: verify if this session is still the active one
  if (decoded.sid) {
    const isValid = await isSessionActive(decoded.email, decoded.sid);
    if (!isValid) return null;
  }

  // Fetch full user details from DB or memory
  const user = await findAdminUser(decoded.email);
  return {
    email: decoded.email,
    role: user?.role || decoded.role || "admin",
    sid: decoded.sid,
    name: user?.name || decoded.name || "Admin",
    avatar: user?.avatar || decoded.avatar || "",
    phone: user?.phone || "",
  };
}

export async function isSessionActive(email: string, sid: string): Promise<boolean> {
  const em = email.toLowerCase().trim();
  const memSess = activeSessionMap.get(em);
  if (memSess) {
    if (memSess.sessionId === sid) {
      memSess.lastActive = Date.now();
      return true;
    }
    return false;
  }

  if (process.env.MONGODB_URI) {
    try {
      await connect();
      const user = await AdminUserModel().findOne({ email: em }).lean() as any;
      if (user && user.activeSessionId) {
        if (user.activeSessionId === sid) {
          activeSessionMap.set(em, {
            sessionId: sid,
            ip: user.activeSessionIp || "local",
            loginTime: user.activeSessionAt || Date.now(),
            lastActive: Date.now(),
          });
          return true;
        }
        return false;
      }
    } catch (e) {
      console.warn("isSessionActive error:", e);
    }
  }
  return true;
}

export async function hasActiveSession(email: string, clientSid?: string): Promise<{ active: boolean; ip?: string; since?: string; sessionId?: string }> {
  const em = email.toLowerCase().trim();
  const memSess = activeSessionMap.get(em);
  const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

  if (memSess && (Date.now() - memSess.lastActive) < SESSION_MAX_AGE_MS) {
    if (clientSid && clientSid === memSess.sessionId) {
      return { active: false };
    }
    return {
      active: true,
      ip: memSess.ip,
      since: new Date(memSess.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sessionId: memSess.sessionId,
    };
  }

  if (process.env.MONGODB_URI) {
    try {
      await connect();
      const user = await AdminUserModel().findOne({ email: em }).lean() as any;
      if (user && user.activeSessionId && user.activeSessionAt) {
        if (Date.now() - Number(user.activeSessionAt) < SESSION_MAX_AGE_MS) {
          if (clientSid && clientSid === user.activeSessionId) {
            return { active: false };
          }
          return {
            active: true,
            ip: user.activeSessionIp || "Active Device",
            since: new Date(user.activeSessionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sessionId: user.activeSessionId,
          };
        }
      }
    } catch (e) {
      console.warn("hasActiveSession db error:", e);
    }
  }

  return { active: false };
}

export async function registerActiveSession(email: string, sessionId: string, ip: string) {
  const em = email.toLowerCase().trim();
  const now = Date.now();
  activeSessionMap.set(em, {
    sessionId,
    ip,
    loginTime: now,
    lastActive: now,
  });

  if (process.env.MONGODB_URI) {
    try {
      await connect();
      await AdminUserModel().updateOne(
        { email: em },
        {
          $set: {
            activeSessionId: sessionId,
            activeSessionIp: ip,
            activeSessionAt: now,
          },
        }
      );
    } catch (e) {
      console.warn("registerActiveSession DB error:", e);
    }
  }
}

export async function terminateActiveSession(email: string) {
  const em = email.toLowerCase().trim();
  activeSessionMap.delete(em);
  if (process.env.MONGODB_URI) {
    try {
      await connect();
      await AdminUserModel().updateOne(
        { email: em },
        {
          $unset: {
            activeSessionId: 1,
            activeSessionIp: 1,
            activeSessionAt: 1,
          },
        }
      );
    } catch (e) {
      console.warn("terminateActiveSession DB error:", e);
    }
  }
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@luxorapg.com";
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sorath2026";

export function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw + "sorath-pg-salt-2026").digest("hex");
}

export function verifyPassword(input: string, stored: string): boolean {
  if (!input || !stored) return false;
  return safeEqual(input, stored) || safeEqual(hashPassword(input), stored);
}

export async function ensureDefaultAdmin() {
  try {
    if (!process.env.MONGODB_URI) return null;
    await connect();
    const count = await AdminUserModel().countDocuments();
    if (count === 0) {
      await AdminUserModel().create({
        name: "Super Admin",
        email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
        passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
        role: "superadmin",
        active: true,
        createdAt: new Date().toISOString(),
      });
      console.log("👑 Initial default admin created in database:", DEFAULT_ADMIN_EMAIL);
    }
  } catch (err) {
    console.error("ensureDefaultAdmin error:", err);
  }
}

export interface AdminUserRecord {
  _id?: any;
  name?: string;
  email: string;
  passwordHash?: string;
  password?: string;
  role?: string;
  active?: boolean;
  avatar?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function findAdminUser(email: string): Promise<AdminUserRecord | null> {
  if (!email) return null;
  const em = email.toLowerCase().trim();
  if (process.env.MONGODB_URI) {
    try {
      await connect();
      await ensureDefaultAdmin();
      const user = await AdminUserModel().findOne({ email: em }).lean();
      if (user) return user as unknown as AdminUserRecord;
    } catch (e) {
      console.error("findAdminUser error:", e);
    }
  }
  // Fallback if DB offline or initial bootstrap
  if (em === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
    return {
      name: "Default Admin",
      email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
      passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
      role: "superadmin",
      active: true,
    };
  }
  return null;
}

export async function listAdminUsers() {
  if (process.env.MONGODB_URI) {
    try {
      await connect();
      await ensureDefaultAdmin();
      const users = await AdminUserModel().find({}, { passwordHash: 0, password: 0 }).lean();
      return users.map((u: any) => ({
        id: String(u._id || u.email),
        name: u.name || "Admin",
        email: u.email,
        role: u.role || "admin",
        active: u.active !== false,
        createdAt: u.createdAt || new Date().toISOString(),
      }));
    } catch (e) {
      console.error("listAdminUsers error:", e);
    }
  }
  return [
    {
      id: "default",
      name: "Super Admin",
      email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
      role: "superadmin",
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function createAdminUser({ name, email, password, role = "admin" }: { name: string; email: string; password: string; role?: string }) {
  if (!email || !password) throw new Error("Email and password are required");
  const em = email.toLowerCase().trim();
  if (!process.env.MONGODB_URI) throw new Error("Database not connected");
  await connect();
  const existing = await AdminUserModel().findOne({ email: em });
  if (existing) throw new Error("A management user with this email already exists");

  const doc = {
    name: name.trim() || "Admin User",
    email: em,
    passwordHash: hashPassword(password),
    role,
    active: true,
    createdAt: new Date().toISOString(),
  };
  await AdminUserModel().create(doc);
  return { name: doc.name, email: doc.email, role: doc.role, active: doc.active };
}

export async function deleteAdminUser(email: string) {
  const em = email.toLowerCase().trim();
  if (em === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
    throw new Error("Cannot delete master superadmin account");
  }
  if (!process.env.MONGODB_URI) throw new Error("Database not connected");
  await connect();
  await AdminUserModel().deleteOne({ email: em });
  return { ok: true };
}

export async function updateAdminProfile(
  email: string,
  updates: { name?: string; phone?: string; avatar?: string; newPassword?: string }
): Promise<AdminUserRecord | null> {
  const em = email.toLowerCase().trim();
  if (!process.env.MONGODB_URI) throw new Error("Database not connected");
  await connect();

  const updateFields: any = { updatedAt: new Date().toISOString() };
  if (updates.name !== undefined) updateFields.name = updates.name.trim();
  if (updates.phone !== undefined) updateFields.phone = updates.phone.trim();
  if (updates.avatar !== undefined) updateFields.avatar = updates.avatar;
  if (updates.newPassword) {
    updateFields.passwordHash = hashPassword(updates.newPassword);
  }

  await AdminUserModel().updateOne({ email: em }, { $set: updateFields });
  return await findAdminUser(em);
}


// In-memory OTP storage for admin verification
interface OtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
}

const g = globalThis as any;
const otpStore: Map<string, OtpRecord> = (g.__sorathOtpStore ??= new Map());

export function issueOtp(email: string): string {
  // Generate 6 digit numeric code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email.toLowerCase(), {
    otp: code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    attempts: 0,
  });
  return code;
}

export const generateAndSaveOtp = issueOtp;

export function getPendingOtp(email: string): string | null {
  const record = otpStore.get(email.toLowerCase());
  if (!record || Date.now() > record.expiresAt) return null;
  return record.otp;
}

export function verifyOtp(email: string, code: string): { valid: boolean; error?: string } {
  const record = otpStore.get(email.toLowerCase());
  if (!record) {
    return { valid: false, error: "No pending OTP for this email or OTP has expired. Please sign in again." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: "OTP expired. Please request a new code." };
  }

  if (record.attempts >= 3) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: "Too many failed attempts. For security, please sign in again." };
  }

  record.attempts += 1;

  // Strict cryptographic safe equality check against issued OTP
  if (safeEqual(code.trim(), record.otp)) {
    otpStore.delete(email.toLowerCase());
    return { valid: true };
  }

  if (record.attempts >= 3) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: "Maximum attempts exceeded. This verification code has been permanently invalidated." };
  }

  return { valid: false, error: `Incorrect code. ${3 - record.attempts} attempt(s) remaining.` };
}
