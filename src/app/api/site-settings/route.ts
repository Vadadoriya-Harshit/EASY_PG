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

    return NextResponse.json({
      ok: true,
      data: {
        ...cms,
        hero: cms.hero,
        navigation: cms.navigation,
        contact: cms.contact,
        about: cms.about,
        faq: cms.faq,
        footer: cms.footer,
        announcement: cms.navigation?.announcement || cms.contact?.announcement,
        areas: areas.map((a) => ({ name: a.name, slug: a.slug })),
        propertyCount: properties.length,
        boysCount: properties.filter((p) => p.gender === "boys").length,
        girlsCount: properties.filter((p) => p.gender === "girls").length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
