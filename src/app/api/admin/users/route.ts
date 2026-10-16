import { NextResponse } from "next/server";
import { getSession, listAdminUsers, createAdminUser, deleteAdminUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await listAdminUsers();
    return NextResponse.json({ ok: true, data: users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load management users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const created = await createAdminUser({ name, email, password, role });
    return NextResponse.json({ ok: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create user" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
    }
    await deleteAdminUser(email);
    return NextResponse.json({ ok: true, message: "User deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete user" }, { status: 400 });
  }
}
