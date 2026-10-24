import { NextResponse } from "next/server";
import { listProperties } from "@/lib/repo";
import { fetchCmsData } from "@/lib/cms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [properties, cms] = await Promise.all([
      listProperties(),
      fetchCmsData(),
    ]);

    const items: Array<{
      id: string;
      category: "all" | "bedroom" | "study" | "dining" | "rooftop" | "washroom";
      title: string;
      property: string;
      image: string;
      description: string;
      tag: string;
      specs: string[];
    }> = [];

    // 1. Add all property photos from database
    properties.forEach((p, pIdx) => {
      (p.media || []).forEach((m, mIdx) => {
        if (!m.url) return;
        const tagLower = (m.tag || "").toLowerCase();
        let cat: any = "bedroom";
        if (tagLower.includes("study") || tagLower.includes("lounge")) cat = "study";
        else if (tagLower.includes("dining") || tagLower.includes("cafe")) cat = "dining";
        else if (tagLower.includes("roof") || tagLower.includes("terrace")) cat = "rooftop";
        else if (tagLower.includes("bath") || tagLower.includes("wash")) cat = "washroom";

        items.push({
          id: `prop-${p.slug}-${mIdx}`,
          category: cat,
          title: m.alt || `${p.name} - ${m.tag || "Room Space"}`,
          property: p.name,
          image: m.url,
          description: p.description || "Verified resident accommodation in Ahmedabad.",
          tag: m.tag || (p.gender === "boys" ? "Boys Stay" : "Girls Stay"),
          specs: [
            p.gender === "boys" ? "Boys Residence" : "Girls Residence",
            p.area ? p.area.toUpperCase() : "Ahmedabad",
            p.metro?.station ? `Near ${p.metro.station}` : "Central Transit",
            p.verified ? "100% Verified" : "Direct Owner",
          ],
        });
      });
    });

    // 2. Add CMS lifestyle amenities photos from database
    (cms.amenities || []).forEach((a, aIdx) => {
      if (!a.image) return;
      const t = (a.tag || a.title || "").toLowerCase();
      let cat: any = "study";
      if (t.includes("dining") || t.includes("food")) cat = "dining";
      else if (t.includes("terrace") || t.includes("roof")) cat = "rooftop";
      else if (t.includes("washroom") || t.includes("hygiene") || t.includes("bath")) cat = "washroom";

      items.push({
        id: `cms-amenity-${a.id || aIdx}`,
        category: cat,
        title: a.title,
        property: "All Verified Residences",
        image: a.image,
        description: a.description,
        tag: a.tag || "Facility",
        specs: a.features || ["24/7 Access", "Fully Maintained"],
      });
    });

    return NextResponse.json({ ok: true, data: items }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (err: any) {
    console.error("[gallery] failed:", err?.message);
    return NextResponse.json({ ok: false, error: "The gallery is temporarily unavailable." }, { status: 503 });
  }
}
