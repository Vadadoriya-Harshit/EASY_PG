import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { areaSchema } from "@/lib/validators";
import { deleteArea, saveArea } from "@/lib/repo";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = areaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid area" }, { status: 400 });
  await saveArea(parsed.data);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  await deleteArea(slug);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
