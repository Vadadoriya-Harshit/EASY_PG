import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { propertySchema } from "@/lib/validators";
import { saveProperty } from "@/lib/repo";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = propertySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return NextResponse.json({ error: `${i.path.join(".")}: ${i.message}` }, { status: 400 });
  }
  const saved = await saveProperty({ ...parsed.data, updatedAt: "" } as any);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, property: saved });
}
