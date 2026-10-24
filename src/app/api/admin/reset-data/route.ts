import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connect, PropertyModel, AreaModel, InquiryModel, EventModel, VacancyModel } from "@/lib/models";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const hasDb = !!process.env.MONGODB_URI;
    if (hasDb) {
      await connect();
      // Wipe properties, areas, inquiries, events, vacancies cleanly
      await Promise.all([
        PropertyModel().deleteMany({}),
        AreaModel().deleteMany({}),
        InquiryModel().deleteMany({}),
        EventModel().deleteMany({}),
        VacancyModel().deleteMany({}),
      ]);
    }

    // Also clear in-memory store if active
    const g = globalThis as any;
    g.__sorathMem = {
      properties: [],
      areas: [],
      inquiries: [],
      events: {},
    };

    return NextResponse.json({
      ok: true,
      message: "All property, room, area, inquiry and analytics data has been wiped clean. Database is ready for fresh setup.",
    });
  } catch (err: any) {
    console.error("[Reset Data Error]:", err);
    return NextResponse.json({ error: err.message || "Reset failed" }, { status: 500 });
  }
}
