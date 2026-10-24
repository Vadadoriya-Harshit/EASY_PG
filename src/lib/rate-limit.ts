import { collection } from "./db";

const hits = new Map<string, number[]>();

/**
 * Cheap per-instance sliding-window limiter for low-risk public endpoints.
 * For anything security sensitive use `rateLimitShared`, which is stored in the database so the limit
 * holds across serverless instances and restarts.
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    if (hits.size > 5000) hits.clear();
  }
  return true;
}

const limits = () => collection("rate_limits", { unique: ["key"], ttl: "expiresAt" });

export interface LimitResult { allowed: boolean; retryAfterSec: number; remaining: number }

/** Fixed-window counter shared through the database. Counts the attempt, then reports whether it is allowed. */
export async function rateLimitShared(key: string, limit: number, windowMs: number): Promise<LimitResult> {
  const col = limits();
  const now = Date.now();
  const cur = await col.findOne({ key });
  if (!cur || new Date(cur.expiresAt).getTime() <= now) {
    const expiresAt = new Date(now + windowMs);
    await col.updateOne({ key }, { $set: { key, count: 1, expiresAt } }, { upsert: true });
    return { allowed: true, retryAfterSec: 0, remaining: limit - 1 };
  }
  const next = await col.updateOne({ key }, { $inc: { count: 1 } });
  const count = Number(next?.count ?? cur.count + 1);
  const retryAfterSec = Math.max(1, Math.ceil((new Date(cur.expiresAt).getTime() - now) / 1000));
  return { allowed: count <= limit, retryAfterSec, remaining: Math.max(0, limit - count) };
}

/** Clears a shared counter (e.g. after a successful login). */
export async function rateLimitReset(key: string) {
  await limits().deleteOne({ key });
}
