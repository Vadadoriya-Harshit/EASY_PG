import type { Area, Inquiry, Property } from "./types";
import { sampleAreas, sampleProperties } from "./sample-data";
import { AreaModel, EventModel, InquiryModel, PropertyModel, connect } from "./models";

/**
 * Repository: MongoDB when MONGODB_URI is set, otherwise an in-memory store seeded with
 * demo data so the project runs with zero setup. The in-memory store resets on restart.
 */
const hasDb = () => !!process.env.MONGODB_URI;

interface Mem { properties: Property[]; areas: Area[]; inquiries: Inquiry[]; events: Record<string, number> }
const g = globalThis as any;
const mem = (): Mem =>
  (g.__sorathMem ??= {
    properties: structuredClone(sampleProperties),
    areas: structuredClone(sampleAreas),
    inquiries: [],
    events: {},
  });

const clean = <T>(d: any): T => {
  if (!d) return d;
  const { _id, ...rest } = d;
  return JSON.parse(JSON.stringify(rest));
};

let loggedInMemoryNotice = false;

async function safeDbOp<T>(dbFn: () => Promise<T>, fallbackFn: () => T | Promise<T>): Promise<T> {
  // No database configured: local demo mode with the in-memory store.
  if (!hasDb()) {
    if (!loggedInMemoryNotice) {
      loggedInMemoryNotice = true;
      console.log("ℹ️  [Repo] MONGODB_URI not configured. Operating in In-Memory Demo Mode with sample data.");
    }
    return fallbackFn();
  }
  // A database IS configured: never silently switch to demo data or write to memory. That would hide outages,
  // show fake listings to visitors and lose admin edits on the next restart. Let the error surface instead.
  await connect();
  return dbFn();
}

// ---------- Properties ----------
export async function listProperties(opts: { includeDraft?: boolean } = {}): Promise<Property[]> {
  const rows = await safeDbOp(
    async () => (await PropertyModel().find().lean()).map((d) => clean<Property>(d)),
    () => mem().properties
  );
  return opts.includeDraft ? rows : rows.filter((p) => p.status === "active");
}

export async function getProperty(slug: string, includeDraft = false) {
  const normSlug = slug.replace("sorath-", "luxora-");
  return await safeDbOp(
    async () => {
      const d = await PropertyModel().findOne({ $or: [{ slug }, { slug: normSlug }] }).lean();
      const p = clean<Property | null>(d);
      return p && (includeDraft || p.status === "active") ? p : null;
    },
    () => {
      const p = mem().properties.find((x) => x.slug === slug || x.slug === normSlug || x.slug.replace("luxora-", "sorath-") === slug);
      return p && (includeDraft || p.status === "active") ? p : null;
    }
  );
}

export async function saveProperty(p: Property) {
  const doc = { ...p, updatedAt: new Date().toISOString() };
  return await safeDbOp(
    async () => {
      await PropertyModel().findOneAndUpdate({ slug: p.slug }, doc, { upsert: true });
      return doc;
    },
    () => {
      const m = mem();
      const i = m.properties.findIndex((x) => x.slug === p.slug);
      if (i >= 0) m.properties[i] = doc; else m.properties.push(doc);
      return doc;
    }
  );
}

export async function deleteProperty(slug: string) {
  await safeDbOp(
    async () => { await PropertyModel().deleteOne({ slug }); },
    () => { const m = mem(); m.properties = m.properties.filter((x) => x.slug !== slug); }
  );
}

// ---------- Areas ----------
export async function listAreas(opts: { includeInactive?: boolean } = {}): Promise<Area[]> {
  let rows = await safeDbOp(
    async () => (await AreaModel().find().lean()).map((d) => clean<Area>(d)),
    () => mem().areas
  );
  rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
  return opts.includeInactive ? rows : rows.filter((a) => a.active);
}

export async function getArea(slug: string) {
  return (await listAreas()).find((a) => a.slug === slug) ?? null;
}

export async function saveArea(a: Area) {
  await safeDbOp(
    async () => { await AreaModel().findOneAndUpdate({ slug: a.slug }, a, { upsert: true }); },
    () => {
      const m = mem();
      const i = m.areas.findIndex((x) => x.slug === a.slug);
      if (i >= 0) m.areas[i] = a; else m.areas.push(a);
    }
  );
}

export async function deleteArea(slug: string) {
  await safeDbOp(
    async () => { await AreaModel().deleteOne({ slug }); },
    () => { const m = mem(); m.areas = m.areas.filter((x) => x.slug !== slug); }
  );
}

// ---------- Inquiries ----------
export async function createInquiry(i: Inquiry) {
  await safeDbOp(
    async () => { await InquiryModel().create(i); },
    () => { mem().inquiries.unshift(i); }
  );
  return i;
}

export async function listInquiries(): Promise<Inquiry[]> {
  return await safeDbOp(
    async () => (await InquiryModel().find().sort({ createdAt: -1 }).limit(500).lean()).map((d) => clean<Inquiry>(d)),
    () => mem().inquiries
  );
}

export async function updateInquiry(id: string, patch: Partial<Inquiry>) {
  const updatedAt = new Date().toISOString();
  return await safeDbOp(
    async () => {
      const cur = clean<Inquiry | null>(await InquiryModel().findOne({ id }).lean());
      if (!cur) return null;
      const next = { ...cur, ...patch, visit: patch.visit ? ({ ...cur.visit, ...patch.visit } as Inquiry["visit"]) : cur.visit, updatedAt };
      await InquiryModel().replaceOne({ id }, next);
      return next;
    },
    () => {
      const m = mem();
      const i = m.inquiries.findIndex((x) => x.id === id);
      if (i < 0) return null;
      const cur = m.inquiries[i];
      m.inquiries[i] = { ...cur, ...patch, visit: patch.visit ? ({ ...cur.visit, ...patch.visit } as Inquiry["visit"]) : cur.visit, updatedAt };
      return m.inquiries[i];
    }
  );
}

// ---------- Events (privacy-aware counters, no PII) ----------
const ALLOWED_EVENTS = ["search", "cta_call", "cta_whatsapp", "inquiry_submit", "visit_submit", "compare_open", "smart_match"];
export async function trackEvent(name: string) {
  if (!ALLOWED_EVENTS.includes(name)) return;
  await safeDbOp(
    async () => { await EventModel().updateOne({ name }, { $inc: { count: 1 } }, { upsert: true }); },
    () => { const m = mem(); m.events[name] = (m.events[name] || 0) + 1; }
  );
}

export async function eventCounts(): Promise<Record<string, number>> {
  return await safeDbOp(
    async () => {
      const rows = await EventModel().find().lean();
      return Object.fromEntries(rows.map((r: any) => [r.name, r.count]));
    },
    () => mem().events
  );
}

export const isDemoStore = () => !hasDb();
