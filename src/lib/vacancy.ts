import crypto from "crypto";
import { collection, DuplicateKeyError } from "./db";
import { authSecret } from "./secret";
import { normalizeEmail } from "./http";
import { sendVacancyAlertEmail, sendVacancyConfirmEmail, type MailResult } from "./email";
import type { Property, Room } from "./types";
import { ROOM_LABEL, getSiteUrl } from "./site";

/**
 * Vacancy alert subscriptions + notification pipeline.
 *
 *  subscribe (double opt-in) -> confirm -> [admin marks a room available] -> event -> queued notifications -> delivery (retries)
 *
 * Collections:
 *  vacancy_subscriptions : one doc per normalised e-mail (unique)
 *  vacancy_events        : one doc per genuine "unavailable -> available" transition
 *  vacancy_notifications : one doc per (event, subscriber). Unique `key` makes sending idempotent.
 */
export type SubStatus = "pending" | "active" | "unsubscribed";

export interface Subscriber {
  id: string;
  email: string; // normalised
  name?: string;
  phone?: string;
  preferredArea: string; // area slug | "all"
  preferredProperty: string; // property slug | "all"
  sharingType: string; // room type | "any"
  status: SubStatus;
  consentAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
  source?: string;
  notes?: string;
  lastConfirmSentAt?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VacancyEvent {
  id: string;
  propertySlug: string;
  propertyName: string;
  roomId: string;
  roomType: string;
  areaSlug: string;
  createdAt: string;
  createdBy: string;
}

export type NotifStatus = "queued" | "sent" | "failed" | "skipped";
export interface Notification {
  key: string; // `${eventId}:${subscriberId}`
  eventId: string;
  subscriberId: string;
  email: string;
  status: NotifStatus;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [0, 60_000, 5 * 60_000, 30 * 60_000, 2 * 3600_000];

const subs = () => collection("vacancy_subscriptions", { unique: ["email", "id"], indexes: ["status"] });
const events = () => collection("vacancy_events", { unique: ["id"], indexes: ["createdAt"] });
const notifs = () => collection("vacancy_notifications", { unique: ["key"], indexes: ["status", "eventId"] });

const siteUrl = getSiteUrl;
const sub_id = () => `vs_${crypto.randomBytes(9).toString("hex")}`;

// ---------------------------------------------------------------- tokens
/** Stateless HMAC tokens: unsubscribe/confirm links need no stored secret and can not be guessed. */
export function makeToken(kind: "confirm" | "unsub", subscriberId: string): string {
  return crypto.createHmac("sha256", authSecret()).update(`${kind}:${subscriberId}`).digest("base64url");
}
export function checkToken(kind: "confirm" | "unsub", subscriberId: string, token: string): boolean {
  const a = Buffer.from(makeToken(kind, subscriberId)), b = Buffer.from(String(token || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export const confirmUrl = (id: string) => `${siteUrl()}/vacancy/confirm?id=${encodeURIComponent(id)}&t=${makeToken("confirm", id)}`;
export const unsubscribeUrl = (id: string) => `${siteUrl()}/vacancy/unsubscribe?id=${encodeURIComponent(id)}&t=${makeToken("unsub", id)}`;
export const oneClickUnsubscribeUrl = (id: string) => `${siteUrl()}/api/vacancies/unsubscribe?id=${encodeURIComponent(id)}&t=${makeToken("unsub", id)}`;

// ---------------------------------------------------------------- subscribe / confirm / unsubscribe
export interface SubscribeInput {
  email: unknown;
  name?: unknown;
  phone?: unknown;
  preferredArea?: unknown;
  preferredProperty?: unknown;
  sharingType?: unknown;
  consent?: unknown;
  source?: unknown;
  notes?: unknown;
}

const slug = (v: unknown, fallback: string) => (typeof v === "string" && /^[a-z0-9-]{1,120}$/.test(v) ? v : fallback);
const ROOM_TYPES = ["single", "double", "triple", "dormitory"];
const clip = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : undefined);

export type SubscribeOutcome =
  | { ok: true; status: "pending" | "active"; created: boolean; mail?: MailResult }
  | { ok: false; error: string };

export async function subscribe(input: SubscribeInput, opts: { byAdmin?: boolean } = {}): Promise<SubscribeOutcome> {
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, error: "Please enter a valid email address." };
  if (input.consent !== true && !opts.byAdmin) return { ok: false, error: "Please tick the box to agree to receive vacancy emails." };

  const phoneRaw = clip(input.phone, 20);
  if (phoneRaw && !/^[0-9+()\-\s]{6,20}$/.test(phoneRaw)) return { ok: false, error: "Enter a valid phone number or leave it empty." };

  const now = new Date().toISOString();
  const sharing = typeof input.sharingType === "string" && (ROOM_TYPES.includes(input.sharingType) || input.sharingType === "any") ? input.sharingType : "any";
  const prefs = {
    name: clip(input.name, 80),
    phone: phoneRaw,
    preferredArea: slug(input.preferredArea, "all"),
    preferredProperty: slug(input.preferredProperty, "all"),
    sharingType: sharing,
  };

  const existing = (await subs().findOne({ email })) as Subscriber | null;
  if (existing) {
    // Idempotent: re-submitting never creates a second record, it refreshes preferences.
    if (existing.status === "active") {
      await subs().updateOne({ email }, { $set: { ...stripUndef(prefs), updatedAt: now } });
      return { ok: true, status: "active", created: false };
    }
    // pending / previously unsubscribed: (re)start double opt-in, but not more than once a minute
    const recentlySent = existing.lastConfirmSentAt && Date.now() - existing.lastConfirmSentAt < 60_000;
    await subs().updateOne({ email }, { $set: { ...stripUndef(prefs), status: "pending", consentAt: now, updatedAt: now }, $unset: { unsubscribedAt: 1 } });
    const mail = recentlySent ? undefined : await sendConfirm(existing.id, email, prefs.name);
    return { ok: true, status: "pending", created: false, mail };
  }

  const doc: Subscriber = {
    id: sub_id(),
    email,
    ...stripUndef(prefs),
    preferredArea: prefs.preferredArea, preferredProperty: prefs.preferredProperty, sharingType: prefs.sharingType,
    status: opts.byAdmin ? "active" : "pending",
    consentAt: now,
    confirmedAt: opts.byAdmin ? now : undefined,
    source: clip(input.source, 40) || "public",
    notes: clip(input.notes, 500),
    createdAt: now,
    updatedAt: now,
  };
  try {
    await subs().insertOne(stripUndef(doc));
  } catch (e) {
    if (e instanceof DuplicateKeyError) return { ok: true, status: "pending", created: false }; // concurrent duplicate
    throw e;
  }
  if (opts.byAdmin) return { ok: true, status: "active", created: true };
  const mail = await sendConfirm(doc.id, email, doc.name);
  return { ok: true, status: "pending", created: true, mail };
}

function stripUndef<T extends Record<string, any>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

async function sendConfirm(id: string, email: string, name?: string) {
  const mail = await sendVacancyConfirmEmail({ to: email, name, confirmUrl: confirmUrl(id), unsubscribeUrl: oneClickUnsubscribeUrl(id) });
  await subs().updateOne({ id }, { $set: { lastConfirmSentAt: Date.now() } });
  return mail;
}

export async function confirmSubscription(id: string, token: string): Promise<"ok" | "invalid" | "gone"> {
  if (!checkToken("confirm", id, token)) return "invalid";
  const cur = (await subs().findOne({ id })) as Subscriber | null;
  if (!cur) return "gone";
  if (cur.status === "active") return "ok";
  const now = new Date().toISOString();
  await subs().updateOne({ id }, { $set: { status: "active", confirmedAt: now, updatedAt: now }, $unset: { unsubscribedAt: 1 } });
  return "ok";
}

export async function unsubscribe(id: string, token: string): Promise<"ok" | "invalid" | "gone"> {
  if (!checkToken("unsub", id, token)) return "invalid";
  const cur = (await subs().findOne({ id })) as Subscriber | null;
  if (!cur) return "gone";
  const now = new Date().toISOString();
  await subs().updateOne({ id }, { $set: { status: "unsubscribed", unsubscribedAt: now, updatedAt: now } });
  // anything still queued for this person must not go out
  const pending = await notifs().find({ subscriberId: id, status: { $in: ["queued", "failed"] } });
  for (const n of pending) await notifs().updateOne({ key: n.key }, { $set: { status: "skipped", lastError: "unsubscribed", updatedAt: now } });
  return "ok";
}

// ---------------------------------------------------------------- admin helpers
export async function listSubscribers(limit = 500): Promise<Subscriber[]> {
  return (await subs().find({}, { sort: { createdAt: -1 }, limit })) as Subscriber[];
}

const PATCHABLE = new Set(["name", "phone", "preferredArea", "preferredProperty", "sharingType", "notes", "status"]);
export async function patchSubscriber(id: string, patch: Record<string, unknown>) {
  const $set: Record<string, any> = { updatedAt: new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) {
    if (!PATCHABLE.has(k)) continue; // allow-list: no mass assignment
    if (k === "status") {
      // Admins may deactivate or reactivate a *confirmed* person; they can not mark an unconfirmed address as consenting.
      if (v === "unsubscribed") { $set.status = "unsubscribed"; $set.unsubscribedAt = $set.updatedAt; }
      continue;
    }
    if (k === "preferredArea" || k === "preferredProperty") $set[k] = slug(v, "all");
    else if (k === "sharingType") $set[k] = typeof v === "string" && (ROOM_TYPES.includes(v) || v === "any") ? v : "any";
    else $set[k] = clip(v, k === "notes" ? 500 : 80) ?? "";
  }
  return (await subs().updateOne({ id }, { $set })) as Subscriber | null;
}

export async function deleteSubscriber(id: string) {
  await notifs().deleteMany({ subscriberId: id });
  return (await subs().deleteOne({ id })) > 0;
}

// ---------------------------------------------------------------- transitions
/**
 * Rooms that went from NOT available to available between two versions of a property.
 * A room counts only if it existed before (so brand-new listings do not blast every subscriber)
 * and was not already "now".
 */
export function detectNewlyAvailable(before: Property | null, after: Property): Room[] {
  if (!before || after.status !== "active") return [];
  const prev = new Map(before.rooms.map((r) => [r.id, r]));
  return after.rooms.filter((r) => {
    const p = prev.get(r.id);
    return !!p && p.availability !== "now" && r.availability === "now";
  });
}

export function subscriberMatches(s: Subscriber, ev: { propertySlug: string; areaSlug: string; roomType: string }) {
  if (s.status !== "active") return false;
  if (s.preferredProperty && s.preferredProperty !== "all" && s.preferredProperty !== ev.propertySlug) return false;
  if (s.preferredArea && s.preferredArea !== "all" && s.preferredArea !== ev.areaSlug) return false;
  if (s.sharingType && s.sharingType !== "any" && s.sharingType !== ev.roomType) return false;
  return true;
}

/**
 * Records events for newly available rooms and queues one notification per matching confirmed subscriber.
 * Safe to call more than once for the same transition: the unique notification key prevents duplicates.
 */
export async function recordAvailabilityChange(before: Property | null, after: Property, actor: string): Promise<{ events: number; queued: number }> {
  const rooms = detectNewlyAvailable(before, after);
  if (!rooms.length) return { events: 0, queued: 0 };
  const active = ((await subs().find({ status: "active" })) as Subscriber[]);
  let queued = 0;
  for (const room of rooms) {
    // Event identity = property + room + the moment the property version changed. A later unavailable->available flip is a new event.
    const id = `ev_${after.slug}_${room.id}_${Date.parse(after.updatedAt) || Date.now()}`.slice(0, 200);
    const ev: VacancyEvent = {
      id, propertySlug: after.slug, propertyName: after.name, roomId: room.id, roomType: room.type, areaSlug: after.area,
      createdAt: new Date().toISOString(), createdBy: actor,
    };
    try { await events().insertOne(ev); } catch (e) { if (e instanceof DuplicateKeyError) continue; throw e; }
    const now = new Date().toISOString();
    for (const s of active) {
      if (!subscriberMatches(s, ev)) continue;
      try {
        await notifs().insertOne({
          key: `${id}:${s.id}`, eventId: id, subscriberId: s.id, email: s.email, status: "queued", attempts: 0, nextAttemptAt: 0, createdAt: now, updatedAt: now,
        } satisfies Notification);
        queued++;
      } catch (e) { if (!(e instanceof DuplicateKeyError)) throw e; }
    }
  }
  return { events: rooms.length, queued };
}

// ---------------------------------------------------------------- delivery
export interface DeliveryDeps {
  getProperty: (slug: string) => Promise<Property | null>;
  areaName?: (slug: string) => Promise<string | undefined>;
}

function rentText(r?: Room) {
  if (!r || typeof r.rent !== "number") return undefined;
  return `₹${r.rent.toLocaleString("en-IN")}/${r.rentUnit === "per-bed" ? "bed" : "room"}/month`;
}

/** Sends due notifications. Bounded per call so it fits in a request; the cron endpoint drains any remainder. */
export async function processQueue(deps: DeliveryDeps, opts: { max?: number; deadlineMs?: number } = {}) {
  const max = opts.max ?? 50;
  const deadline = Date.now() + (opts.deadlineMs ?? 20_000);
  const now = Date.now();
  const due = ((await notifs().find({ status: { $in: ["queued", "failed"] } }, { sort: { createdAt: 1 }, limit: max * 2 })) as Notification[])
    .filter((n) => n.attempts < MAX_ATTEMPTS && n.nextAttemptAt <= now)
    .slice(0, max);
  let sent = 0, failed = 0, skipped = 0;
  const propCache = new Map<string, Property | null>();

  for (const n of due) {
    if (Date.now() > deadline) break;
    // claim: only one worker may move a notification into an attempt
    const claimed = await notifs().updateOne(
      { key: n.key, status: n.status, attempts: n.attempts },
      { $inc: { attempts: 1 }, $set: { nextAttemptAt: Date.now() + 5 * 60_000, updatedAt: new Date().toISOString() } }
    );
    if (!claimed) continue;
    const upd = (set: Record<string, any>) => notifs().updateOne({ key: n.key }, { $set: { ...set, updatedAt: new Date().toISOString() } });

    const sub = (await subs().findOne({ id: n.subscriberId })) as Subscriber | null;
    if (!sub || sub.status !== "active") { await upd({ status: "skipped", lastError: "subscriber inactive" }); skipped++; continue; }
    const ev = (await events().findOne({ id: n.eventId })) as VacancyEvent | null;
    if (!ev) { await upd({ status: "skipped", lastError: "event missing" }); skipped++; continue; }

    if (!propCache.has(ev.propertySlug)) propCache.set(ev.propertySlug, await deps.getProperty(ev.propertySlug));
    const prop = propCache.get(ev.propertySlug);
    const room = prop?.rooms.find((r) => r.id === ev.roomId);
    // Availability may have been reverted before delivery: do not announce a bed that is gone.
    if (!prop || prop.status !== "active" || !room || room.availability !== "now") {
      await upd({ status: "skipped", lastError: "no longer available" }); skipped++; continue;
    }

    let res: MailResult;
    try {
      res = await sendVacancyAlertEmail({
        to: sub.email, name: sub.name, propertyName: prop.name, propertyUrl: `${siteUrl()}/pg/${prop.slug}`,
        roomLabel: ROOM_LABEL[room.type] || room.type, areaName: await deps.areaName?.(prop.area), rentText: rentText(room),
        unsubscribeUrl: oneClickUnsubscribeUrl(sub.id),
      });
    } catch (e: any) {
      res = { success: false, error: e?.message || "send error" };
    }
    if (res.success) { await upd({ status: "sent", sentAt: new Date().toISOString(), lastError: undefined }); sent++; }
    else {
      const attempts = n.attempts + 1;
      const exhausted = attempts >= MAX_ATTEMPTS;
      await upd({ status: "failed", lastError: String(res.error || "delivery failed").slice(0, 300), nextAttemptAt: exhausted ? Number.MAX_SAFE_INTEGER : Date.now() + BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length - 1)] });
      failed++;
    }
  }
  return { processed: sent + failed + skipped, sent, failed, skipped, remaining: Math.max(0, due.length - (sent + failed + skipped)) };
}

/** Admin "retry": makes failed (and exhausted) notifications due again. */
export async function retryFailed(eventId?: string) {
  const rows = (await notifs().find({ status: "failed", ...(eventId ? { eventId } : {}) })) as Notification[];
  for (const n of rows) {
    await notifs().updateOne({ key: n.key }, { $set: { status: "queued", attempts: 0, nextAttemptAt: 0, updatedAt: new Date().toISOString() } });
  }
  return rows.length;
}

export async function listEvents(limit = 50) {
  const evs = (await events().find({}, { sort: { createdAt: -1 }, limit })) as VacancyEvent[];
  const out = [];
  for (const ev of evs) {
    const ns = (await notifs().find({ eventId: ev.id })) as Notification[];
    out.push({
      ...ev,
      totals: {
        queued: ns.filter((n) => n.status === "queued").length,
        sent: ns.filter((n) => n.status === "sent").length,
        failed: ns.filter((n) => n.status === "failed").length,
        skipped: ns.filter((n) => n.status === "skipped").length,
      },
      notifications: ns.map((n) => ({ key: n.key, email: n.email, status: n.status, attempts: n.attempts, lastError: n.lastError, sentAt: n.sentAt, updatedAt: n.updatedAt })),
    });
  }
  return out;
}
