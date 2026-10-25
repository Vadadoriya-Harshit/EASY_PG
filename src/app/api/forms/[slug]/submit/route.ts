import { NextResponse } from "next/server";
import crypto from "crypto";
import { getForm, submitForm, type IncomingFile } from "@/lib/forms";
import { rateLimitShared } from "@/lib/rate-limit";
import { clientIp, jsonError, noStore } from "@/lib/http";
import { MAX_FILES_PER_FIELD, MAX_FILE_MB } from "@/lib/form-schema";

export const runtime = "nodejs";

const MAX_BODY = 12 * 1024 * 1024;

/**
 * Public submission endpoint. multipart/form-data:
 *   data            JSON object { [fieldId]: value }
 *   file:<fieldId>  one part per attached file
 * Everything is validated again here from the stored form definition; nothing the browser claims is trusted.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ip = clientIp(req);
  try {
    const lim = await rateLimitShared(`form-submit:${ip}`, 12, 10 * 60_000);
    if (!lim.allowed) return jsonError("Too many submissions. Please wait a few minutes and try again.", 429, { retryAfterSec: lim.retryAfterSec });

    if (!/^[a-z0-9-]{2,60}$/.test(slug)) return jsonError("This form does not exist.", 404);
    const def = await getForm(slug, { publishedOnly: true });
    if (!def) return jsonError("This form is not available right now.", 404);

    const len = Number(req.headers.get("content-length") || 0);
    if (len > MAX_BODY) return jsonError("The submission is too large. Please attach smaller files.", 413);

    let data: unknown = null;
    const incoming: IncomingFile[] = [];
    const ctype = req.headers.get("content-type") || "";
    if (ctype.includes("multipart/form-data")) {
      const fd = await req.formData().catch(() => null);
      if (!fd) return jsonError("Could not read the submission.", 400);
      try { data = JSON.parse(String(fd.get("data") || "null")); } catch { return jsonError("Could not read the submission.", 400); }
      const perField: Record<string, number> = {};
      for (const [key, v] of fd.entries()) {
        if (!key.startsWith("file:") || typeof v === "string") continue;
        const fieldId = key.slice(5);
        perField[fieldId] = (perField[fieldId] || 0) + 1;
        if (perField[fieldId] > MAX_FILES_PER_FIELD) return jsonError("Too many files attached.", 400);
        if (v.size > MAX_FILE_MB * 1024 * 1024) return jsonError(`Each file must be ${MAX_FILE_MB} MB or smaller.`, 413);
        incoming.push({ fieldId, name: v.name || "file", type: v.type || "", data: Buffer.from(await v.arrayBuffer()) });
      }
    } else {
      data = await req.json().catch(() => null);
    }

    if (data && typeof data === "object" && !Array.isArray(data)) {
      // honeypot: bots fill every input; people never see this one. Pretend success.
      if (String((data as any)._hp || "").length > 0) return noStore(NextResponse.json({ ok: true, message: def.successMessage }));
      delete (data as any)._hp;
    }

    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
    const r = await submitForm(def, data, incoming, { ipHash });
    if (!r.ok) return jsonError(r.error, r.status, { fieldErrors: r.fieldErrors, duplicate: r.duplicate });
    return noStore(NextResponse.json({ ok: true, id: r.id, message: def.successMessage }));
  } catch (e: any) {
    console.error("[forms] submit failed:", e?.message);
    return jsonError("We could not save your submission. Please try again.", 500);
  }
}
