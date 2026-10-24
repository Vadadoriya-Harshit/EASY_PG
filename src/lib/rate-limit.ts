import { collection } from "./db";

const hits = new Map<string, number[]>();

export interface LimitResult {
  allowed: boolean;
  retryAfterSec: number;
  remaining: number;
}

/**
 * Resolves dynamic rate-limiting thresholds and window durations from environment variables.
 * Enables zero-downtime tuning for testing, production high traffic, or staging environments.
 */
function resolveDynamicConfig(key: string, defaultLimit: number, defaultWindowMs: number) {
  // Option to completely disable rate limits (e.g. for testing / debugging)
  const disabled =
    process.env.DISABLE_RATE_LIMIT === "true" ||
    process.env.RATE_LIMIT_DISABLED === "true";

  if (disabled) {
    return { limit: 999999, windowMs: defaultWindowMs, disabled: true };
  }

  const isAuth =
    key.startsWith("login-") ||
    key.startsWith("verify-otp-") ||
    key.startsWith("resend-otp-") ||
    key.startsWith("forgot-") ||
    key.startsWith("reset-") ||
    key.startsWith("otp-send-");

  let limit = defaultLimit;
  let windowMs = defaultWindowMs;

  if (isAuth) {
    const envAuthMax = Number(process.env.AUTH_RATE_LIMIT_MAX || process.env.RATE_LIMIT_AUTH_MAX);
    if (!isNaN(envAuthMax) && envAuthMax > 0) {
      limit = envAuthMax;
    }
    const envAuthWindowSec = Number(process.env.AUTH_RATE_LIMIT_WINDOW_SEC || process.env.RATE_LIMIT_AUTH_WINDOW_SEC);
    if (!isNaN(envAuthWindowSec) && envAuthWindowSec > 0) {
      windowMs = envAuthWindowSec * 1000;
    }
  } else {
    const envMax = Number(process.env.RATE_LIMIT_MAX);
    if (!isNaN(envMax) && envMax > 0) {
      limit = envMax;
    }
    const envWindowSec = Number(process.env.RATE_LIMIT_WINDOW_SEC);
    if (!isNaN(envWindowSec) && envWindowSec > 0) {
      windowMs = envWindowSec * 1000;
    }
  }

  const multiplier = Number(process.env.RATE_LIMIT_MULTIPLIER);
  if (!isNaN(multiplier) && multiplier > 0) {
    limit = Math.max(1, Math.round(limit * multiplier));
  }

  return { limit, windowMs, disabled: false };
}

/**
 * Cheap per-instance sliding-window limiter for low-risk public endpoints.
 * For anything security sensitive use `rateLimitShared`, which is stored in the database so the limit
 * holds across serverless instances and restarts.
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const cfg = resolveDynamicConfig(key, limit, windowMs);
  if (cfg.disabled) return true;

  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < cfg.windowMs);
  if (arr.length >= cfg.limit) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < cfg.windowMs)) hits.delete(k);
    if (hits.size > 5000) hits.clear();
  }
  return true;
}

const limits = () => collection("rate_limits", { unique: ["key"], ttl: "expiresAt" });

/** Fixed-window counter shared through the database. Counts the attempt, then reports whether it is allowed. */
export async function rateLimitShared(key: string, limit: number, windowMs: number): Promise<LimitResult> {
  const cfg = resolveDynamicConfig(key, limit, windowMs);
  if (cfg.disabled) {
    return { allowed: true, retryAfterSec: 0, remaining: 999 };
  }

  const col = limits();
  const now = Date.now();
  const cur = await col.findOne({ key });
  if (!cur || new Date(cur.expiresAt).getTime() <= now) {
    const expiresAt = new Date(now + cfg.windowMs);
    await col.updateOne({ key }, { $set: { key, count: 1, expiresAt } }, { upsert: true });
    return { allowed: true, retryAfterSec: 0, remaining: cfg.limit - 1 };
  }
  const next = await col.updateOne({ key }, { $inc: { count: 1 } });
  const count = Number(next?.count ?? cur.count + 1);
  const retryAfterSec = Math.max(1, Math.ceil((new Date(cur.expiresAt).getTime() - now) / 1000));
  return { allowed: count <= cfg.limit, retryAfterSec, remaining: Math.max(0, cfg.limit - count) };
}

/** Clears a shared counter (e.g. after a successful login). */
export async function rateLimitReset(key: string) {
  await limits().deleteOne({ key });
}
