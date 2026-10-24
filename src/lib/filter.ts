import type { Property, Room, RoomType } from "./types";

export interface Filters {
  gender: "all" | "boys" | "girls";
  areas: string[];
  min?: number;
  max?: number;
  sharing: RoomType[];
  ac: "any" | "ac" | "non-ac";
  facilities: string[];
  metroMax?: number;
  food: string[];
  availableNow: boolean;
  sort: "recommended" | "price-asc" | "price-desc" | "updated";
}

export const defaultFilters: Filters = {
  gender: "all", areas: [], sharing: [], ac: "any", facilities: [], food: [], availableNow: false, sort: "recommended",
};

type SP = Record<string, string | string[] | undefined>;
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(",") : v || "").split(",").map((s) => s.trim()).filter(Boolean);
const num = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function parseFilters(sp: SP, lock?: "boys" | "girls"): Filters {
  const g = (Array.isArray(sp.gender) ? sp.gender[0] : sp.gender) as Filters["gender"] | undefined;
  const sort = (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort) as Filters["sort"] | undefined;
  const ac = (Array.isArray(sp.ac) ? sp.ac[0] : sp.ac) as Filters["ac"] | undefined;
  return {
    gender: lock ?? (g === "boys" || g === "girls" ? g : "all"),
    areas: list(sp.area),
    min: num(sp.min),
    max: num(sp.max),
    sharing: list(sp.sharing) as RoomType[],
    ac: ac === "ac" || ac === "non-ac" ? ac : "any",
    facilities: list(sp.fac),
    metroMax: num(sp.metro),
    food: list(sp.food),
    availableNow: sp.now === "1",
    sort: ["price-asc", "price-desc", "updated"].includes(sort || "") ? (sort as Filters["sort"]) : "recommended",
  };
}

export function toQuery(f: Filters, omitGender = false) {
  const p = new URLSearchParams();
  if (!omitGender && f.gender !== "all") p.set("gender", f.gender);
  if (f.areas.length) p.set("area", f.areas.join(","));
  if (f.min) p.set("min", String(f.min));
  if (f.max) p.set("max", String(f.max));
  if (f.sharing.length) p.set("sharing", f.sharing.join(","));
  if (f.ac !== "any") p.set("ac", f.ac);
  if (f.facilities.length) p.set("fac", f.facilities.join(","));
  if (f.metroMax) p.set("metro", String(f.metroMax));
  if (f.food.length) p.set("food", f.food.join(","));
  if (f.availableNow) p.set("now", "1");
  if (f.sort !== "recommended") p.set("sort", f.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function roomMatches(r: Room, f: Filters) {
  if (f.sharing.length && !f.sharing.includes(r.type)) return false;
  if (f.ac === "ac" && !r.ac) return false;
  if (f.ac === "non-ac" && r.ac) return false;
  if ((f.min || f.max) && r.rent == null) return false;
  if (f.min && r.rent! < f.min) return false;
  if (f.max && r.rent! > f.max) return false;
  if (f.availableNow && r.availability !== "now") return false;
  return true;
}

export const matchingRooms = (p: Property, f: Filters) => p.rooms.filter((r) => roomMatches(r, f));

export function propertyMatches(p: Property, f: Filters) {
  if (f.gender !== "all" && p.gender !== f.gender) return false;
  if (f.areas.length && !f.areas.includes(p.area)) return false;
  if (!matchingRooms(p, f).length) return false;
  for (const k of f.facilities) {
    const fac = p.facilities.find((x) => x.key === k);
    if (!fac || fac.status === "not-available") return false;
  }
  if (f.metroMax && (!p.metro || p.metro.distanceKm > f.metroMax)) return false;
  for (const c of f.food) if (!p.nearby.some((n) => n.category === c)) return false;
  return true;
}

export function applyFilters(props: Property[], f: Filters) {
  const out = props.filter((p) => propertyMatches(p, f));
  const price = (p: Property) => {
    const r = matchingRooms(p, f).map((x) => x.rent).filter((x): x is number => x != null);
    return r.length ? Math.min(...r) : Infinity;
  };
  if (f.sort === "price-asc") out.sort((a, b) => price(a) - price(b));
  else if (f.sort === "price-desc") out.sort((a, b) => (price(b) === Infinity ? -1 : price(b)) - (price(a) === Infinity ? -1 : price(a)));
  else if (f.sort === "updated") out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  else out.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.verified) - Number(a.verified));
  return out;
}

export function activeChips(f: Filters, areaNames: Record<string, string>, lock?: string) {
  const c: { id: string; label: string }[] = [];
  if (!lock && f.gender !== "all") c.push({ id: "gender", label: f.gender === "boys" ? "Boys" : "Girls" });
  f.areas.forEach((a) => c.push({ id: `area:${a}`, label: areaNames[a] || a }));
  if (f.min || f.max) c.push({ id: "budget", label: `₹${f.min ?? 0} – ${f.max ? "₹" + f.max : "any"}` });
  f.sharing.forEach((s) => c.push({ id: `sharing:${s}`, label: s }));
  if (f.ac !== "any") c.push({ id: "ac", label: f.ac === "ac" ? "AC" : "Non-AC" });
  f.facilities.forEach((x) => c.push({ id: `fac:${x}`, label: x }));
  if (f.metroMax) c.push({ id: "metro", label: `Metro ≤ ${f.metroMax} km` });
  f.food.forEach((x) => c.push({ id: `food:${x}`, label: `${x} nearby` }));
  if (f.availableNow) c.push({ id: "now", label: "Available now" });
  return c;
}

export function removeChip(f: Filters, id: string): Filters {
  const [k, v] = id.split(":");
  switch (k) {
    case "gender": return { ...f, gender: "all" };
    case "area": return { ...f, areas: f.areas.filter((x) => x !== v) };
    case "budget": return { ...f, min: undefined, max: undefined };
    case "sharing": return { ...f, sharing: f.sharing.filter((x) => x !== v) };
    case "ac": return { ...f, ac: "any" };
    case "fac": return { ...f, facilities: f.facilities.filter((x) => x !== v) };
    case "metro": return { ...f, metroMax: undefined };
    case "food": return { ...f, food: f.food.filter((x) => x !== v) };
    case "now": return { ...f, availableNow: false };
  }
  return f;
}
