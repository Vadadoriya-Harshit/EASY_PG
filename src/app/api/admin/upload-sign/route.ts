import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { requireAdmin } from "@/lib/guard";
import { jsonError, noStore } from "@/lib/http";

export const runtime = "nodejs";

/** Returns a signed Cloudinary upload payload so the browser can upload directly (secret never leaves the server). */
export async function POST() {
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME, key = process.env.CLOUDINARY_API_KEY, secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return jsonError("Cloudinary is not configured. Paste an image URL instead.", 501);
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "sorath-pg";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");
  return noStore(NextResponse.json({ cloud, key, timestamp, folder, signature }));
}
