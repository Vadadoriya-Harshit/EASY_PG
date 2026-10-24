import { NextResponse } from "next/server";

/** Best-effort client IP. Only platform-set headers are trusted; the raw first X-Forwarded-For hop is the last resort. */
export function clientIp(req: Request): string {
  const h = req.headers;
  const ip =
    h.get("x-vercel-forwarded-for") ||
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0] ||
    "local";
  return ip.trim().slice(0, 64);
}

export function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/** JSON-LD safe serialisation: stops `</script>` or `<!--` inside stored content from breaking out of the tag. */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

/** Generic JSON error that never leaks internals. */
export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

export function noStore<T extends NextResponse>(res: T): T {
  res.headers.set("Cache-Control", "no-store");
  return res;
}

/** Reads a JSON body with a size cap. Returns null on any problem. */
export async function readJson(req: Request, maxBytes = 200_000): Promise<any | null> {
  try {
    const len = Number(req.headers.get("content-length") || 0);
    if (len > maxBytes) return null;
    const text = await req.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

export function normalizeEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  if (e.length > 254 || !EMAIL_RE.test(e)) return null;
  return e;
}
