import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, keylen: number, opts: crypto.ScryptOptions) => Promise<Buffer>;

const N = 16384, R = 8, P = 1, KEYLEN = 64;

/** Constant-time string comparison that does not leak length via early return on equal-length inputs. */
export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // still burn comparable time, then fail
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

/** scrypt$N$r$p$salt$hash (base64). */
export async function hashPassword(pw: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(pw, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

/** Legacy hash used by earlier versions: unsalted-per-user SHA-256 with a static salt. Verified only to migrate. */
const legacyHash = (pw: string) => crypto.createHash("sha256").update(pw + "sorath-pg-salt-2026").digest("hex");
const isLegacyHash = (s: string) => /^[a-f0-9]{64}$/i.test(s);

export interface PasswordCheck { ok: boolean; needsRehash: boolean }

/**
 * Verifies `input` against a stored credential.
 * The old implementation also accepted `input === stored`, which let anyone who obtained the stored hash
 * sign in by submitting the hash itself. That branch now only applies to legacy plaintext values
 * (anything that is not a recognisable hash) and those are flagged for re-hashing.
 */
export async function verifyPassword(input: string, stored: string | undefined | null): Promise<PasswordCheck> {
  if (!input || !stored) return { ok: false, needsRehash: false };
  if (stored.startsWith("scrypt$")) {
    const [, n, r, p, saltB64, hashB64] = stored.split("$");
    try {
      const expected = Buffer.from(hashB64, "base64");
      const actual = await scrypt(input, Buffer.from(saltB64, "base64"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
      const ok = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
      return { ok, needsRehash: ok && (Number(n) !== N || Number(r) !== R || Number(p) !== P) };
    } catch {
      return { ok: false, needsRehash: false };
    }
  }
  if (isLegacyHash(stored)) {
    const ok = safeEqual(legacyHash(input).toLowerCase(), stored.toLowerCase());
    return { ok, needsRehash: ok };
  }
  // legacy plaintext record
  const ok = safeEqual(input, stored);
  return { ok, needsRehash: ok };
}

/** Burns roughly the same time as a real verification so unknown accounts are not distinguishable by timing. */
let dummy: Promise<string> | null = null;
export async function dummyVerify(input: string) {
  dummy ??= hashPassword("dummy-password-for-timing");
  await verifyPassword(input || "x", await dummy);
}

export function passwordPolicyError(pw: unknown): string | null {
  if (typeof pw !== "string") return "Password is required.";
  if (pw.length < 10) return "Password must be at least 10 characters long.";
  if (pw.length > 128) return "Password must be at most 128 characters long.";
  if (!/[a-z]/i.test(pw) || !/\d/.test(pw)) return "Password must contain both letters and numbers.";
  return null;
}
