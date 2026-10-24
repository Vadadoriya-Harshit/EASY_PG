import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { listAreas, listProperties } from "@/lib/repo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [props, areas] = await Promise.all([listProperties(), listAreas()]);
  const base = ["", "/pg-in-ahmedabad", "/pg-in-ahmedabad/single-sharing", "/pg-in-ahmedabad/double-sharing", "/pg-in-ahmedabad/triple-sharing", "/pgs", "/pgs/boys", "/pgs/girls", "/areas", "/facilities", "/nearby", "/gallery", "/about", "/contact", "/faq", "/match", "/privacy", "/terms"];
  return [
    ...base.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...areas.map((a) => ({ url: `${SITE.url}/areas/${a.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...props.map((p) => ({ url: `${SITE.url}/pg/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
