import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteProperty } from "@/lib/repo";

export const runtime = "nodejs";

export async function DELETE(_: Request, { params }: { params: { slug: string } }) {
  await deleteProperty(params.slug);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
