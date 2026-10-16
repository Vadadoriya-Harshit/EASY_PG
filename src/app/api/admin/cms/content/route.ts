import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchCmsData, updateCmsData, resetCmsData } from "@/lib/cms-store";

export const runtime = "nodejs";

export async function GET() {
  const data = await fetchCmsData();
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateCmsData(body);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Failed to save CMS data" }, { status: 500 });
  }
}

export async function DELETE() {
  const reset = await resetCmsData();
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, data: reset });
}

