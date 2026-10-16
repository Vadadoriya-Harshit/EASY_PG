import clsx, { type ClassValue } from "clsx";
import { SITE } from "./site";
import type { Property, Room } from "./types";

export const cn = (...v: ClassValue[]) => clsx(v);

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export function rentRange(rooms: Room[]): { min: number; max: number } | null {
  const r = rooms.map((x) => x.rent).filter((x): x is number => typeof x === "number");
  if (!r.length) return null;
  return { min: Math.min(...r), max: Math.max(...r) };
}

export const telHref = () => (SITE.phone ? `tel:${SITE.phone.replace(/[^\d+]/g, "")}` : "");

export function waHref(message: string) {
  if (!SITE.whatsapp) return "";
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const waMessage = (p?: Pick<Property, "name"> | null) =>
  p ? `Hi Luxora PG, I'm interested in ${p.name}. Could you share availability and a visit slot?` : "Hi Luxora PG, I'd like to know about available rooms.";

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export const uid = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
