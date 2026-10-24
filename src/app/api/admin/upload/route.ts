import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const allFiles: File[] = [];
    if (singleFile && singleFile.size > 0) allFiles.push(singleFile);
    for (const f of files) {
      if (f && f.size > 0 && !allFiles.includes(f)) allFiles.push(f);
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const savedUrls: string[] = [];

    for (const file of allFiles) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { error: `Unsupported image format: ${file.type}. Please upload JPG, PNG, WebP, or AVIF.` },
          { status: 400 }
        );
      }

      // Max size: 25MB per file
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 25MB limit.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg");
      const safeBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeBase}${ext}`;

      const filePath = path.join(uploadsDir, uniqueName);
      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${uniqueName}`;
      savedUrls.push(publicUrl);
    }

    return NextResponse.json({
      ok: true,
      url: savedUrls[0],
      urls: savedUrls,
    });
  } catch (err: any) {
    console.error("[Upload Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to process image upload" }, { status: 500 });
  }
}
