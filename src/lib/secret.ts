/**
 * Edge-safe access to the signing secret. No Node-only imports here: middleware uses it too.
 *
 * Production REQUIRES AUTH_SECRET (>= 32 chars). The previous hard-coded fallback secret allowed anyone
 * who read the source to forge an admin session cookie, so it has been removed.
 * Outside production a fixed dev-only secret is used so the Edge middleware and the Node route handlers
 * (separate module graphs in `next dev`) agree on the same key.
 */
const DEV_ONLY_SECRET = "dev-only-insecure-secret-do-not-use-in-production-0123456789";

export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters. Set a long random value in the environment.");
  }
  return DEV_ONLY_SECRET;
}

export const authSecretBytes = () => new TextEncoder().encode(authSecret());

export const isProd = () => process.env.NODE_ENV === "production";
