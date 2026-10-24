import { SITE } from "./site";
import type { Property } from "./types";
import { inr, rentRange } from "./utils";

/** Structured-data builders. Only facts that exist in the data are emitted: no ratings, no invented addresses. */
const abs = (path: string) => (path.startsWith("http") ? path : `${SITE.url.replace(/\/$/, "")}${path}`);

export interface Crumb { name: string; href: string }

export function breadcrumbLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.href) })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.filter((i) => i.q && i.a).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}

export function itemListLd(name: string, props: Pick<Property, "slug" | "name">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: props.length,
    itemListElement: props.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/pg/${p.slug}`), name: p.name })),
  };
}

export function websiteLd() {
  return { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: abs("/"), inLanguage: "en-IN" };
}

export interface BusinessInfo { phone?: string; email?: string; address?: string; description?: string; image?: string }

/** The business itself. Address is only emitted when one is configured; PG pages add their own verified addresses. */
export function businessLd(b: BusinessInfo) {
  const img = b.image && !b.image.startsWith("data:") ? abs(b.image) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": abs("/#business"),
    name: SITE.name,
    url: abs("/"),
    ...(b.description ? { description: b.description } : {}),
    ...(img ? { image: img } : {}),
    ...(b.phone ? { telephone: b.phone } : {}),
    ...(b.email ? { email: b.email } : {}),
    areaServed: { "@type": "City", name: "Ahmedabad" },
    ...(b.address
      ? { address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: "Ahmedabad", addressRegion: "Gujarat", addressCountry: "IN" } }
      : {}),
  };
}

export function rentSummary(props: Property[]): { min: number; max: number } | null {
  const all = props.map((p) => rentRange(p.rooms)).filter(Boolean) as { min: number; max: number }[];
  if (!all.length) return null;
  return { min: Math.min(...all.map((r) => r.min)), max: Math.max(...all.map((r) => r.max)) };
}

export const rentText = (r: { min: number; max: number } | null) => (r ? `${inr(r.min)} to ${inr(r.max)} per month` : "rent on request");

export const SHARING_PAGES = {
  "single-sharing": { type: "single", label: "Single", plural: "single-sharing (private) rooms" },
  "double-sharing": { type: "double", label: "Double", plural: "double-sharing (twin) rooms" },
  "triple-sharing": { type: "triple", label: "Triple", plural: "triple-sharing rooms" },
} as const;
export type SharingSlug = keyof typeof SHARING_PAGES;
