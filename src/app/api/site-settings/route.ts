import { NextResponse } from "next/server";
import { fetchCmsData } from "@/lib/cms-store";
import { listAreas, listProperties } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [cms, areas, properties] = await Promise.all([
      fetchCmsData(),
      listAreas(),
      listProperties(),
    ]);

    // Real availability: rooms that admins have marked "Available now", grouped by locality.
    const names = new Map(areas.map((a) => [a.slug, a.name]));
    const openBeds = [...properties.reduce((m, p) => {
      const n = p.rooms.filter((r) => r.availability === "now").length;
      if (n) {
        const cur = m.get(p.area) || { area: p.area, areaName: names.get(p.area) || p.area, properties: 0, rooms: 0 };
        cur.properties += 1; cur.rooms += n; m.set(p.area, cur);
      }
      return m;
    }, new Map<string, { area: string; areaName: string; properties: number; rooms: number }>()).values()].slice(0, 6);

    return NextResponse.json({
      ok: true,
      data: {
        // Only what the shared header/hero/footer need; about/faq/amenities are rendered server-side on their own pages.
        hero: cms.hero,
        navigation: cms.navigation,
        contact: cms.contact,
        footer: cms.footer,
        announcement: cms.navigation?.announcement || cms.contact?.announcement,
        areas: areas.map((a) => ({ name: a.name, slug: a.slug })),
        propertyCount: properties.length,
        openBeds,
        boysCount: properties.filter((p) => p.gender === "boys").length,
        girlsCount: properties.filter((p) => p.gender === "girls").length,
      },
    }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch (err: any) {
    console.error("[site-settings] failed:", err?.message);
    return NextResponse.json({ ok: false, error: "Settings are temporarily unavailable." }, { status: 503 });
  }
}
