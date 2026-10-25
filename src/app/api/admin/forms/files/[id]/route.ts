import { getStoredFile } from "@/lib/forms";
import { requireAdmin } from "@/lib/guard";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

/** Uploaded files are private: admin-only, always downloaded (never rendered inline), never sniffed by the browser. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await requireAdmin();
  if ("res" in a) return a.res;
  if (!/^file_[a-f0-9]{16}$/.test(id)) return jsonError("Invalid file.", 400);
  const f = await getStoredFile(id);
  if (!f) return jsonError("File not found.", 404);
  return new Response(new Uint8Array(f.buffer), {
    headers: {
      "Content-Type": f.type,
      "Content-Disposition": `attachment; filename="${f.name.replace(/"/g, "")}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
