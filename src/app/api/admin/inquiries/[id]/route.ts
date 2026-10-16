import { NextResponse } from "next/server";
import { inquiryPatchSchema } from "@/lib/validators";
import { updateInquiry } from "@/lib/repo";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const parsed = inquiryPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const next = await updateInquiry(params.id, parsed.data as any);
  if (!next) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, inquiry: next });
}
