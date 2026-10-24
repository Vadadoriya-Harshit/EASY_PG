import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  subscribe, confirmSubscription, unsubscribe, makeToken, checkToken, detectNewlyAvailable, subscriberMatches,
  recordAvailabilityChange, processQueue, retryFailed, listEvents, listSubscribers, patchSubscriber, MAX_ATTEMPTS, type Subscriber,
} from "@/lib/vacancy";
import { __setMailSender, type MailInput } from "@/lib/email";
import { __resetMemoryStore, collection } from "@/lib/db";
import { sampleProperties } from "@/lib/sample-data";
import type { Property } from "@/lib/types";

const outbox: MailInput[] = [];
let failNext = 0;
beforeEach(() => {
  __resetMemoryStore();
  outbox.length = 0;
  failNext = 0;
  __setMailSender(async (m) => {
    if (failNext > 0) { failNext--; return { success: false, error: "SMTP 451 temporary failure" }; }
    outbox.push(m);
    return { success: true, messageId: `t${outbox.length}` };
  });
});

const clone = <T,>(x: T): T => structuredClone(x);
function propPair(): { before: Property; after: Property; roomId: string } {
  const before = clone(sampleProperties.find((p) => p.rooms.length > 0)!);
  before.status = "active";
  before.rooms[0].availability = "unknown";
  const after = clone(before);
  after.rooms[0].availability = "now";
  after.updatedAt = new Date().toISOString();
  return { before, after, roomId: before.rooms[0].id };
}

const idFromConfirmMail = (m: MailInput) => m.text.match(/id=(vs_[a-f0-9]+)&t=([\w-]+)/)!;

async function activeSub(email: string, extra: Record<string, unknown> = {}) {
  const out = await subscribe({ email, consent: true, ...extra });
  assert.ok(out.ok);
  const m = outbox.at(-1)!;
  const [, id, t] = idFromConfirmMail(m);
  assert.equal(await confirmSubscription(id, t), "ok");
  return id;
}

test("subscribe validates email server-side and requires consent", async () => {
  assert.equal((await subscribe({ email: "not-an-email", consent: true })).ok, false);
  assert.equal((await subscribe({ email: "a@b", consent: true })).ok, false);
  assert.equal((await subscribe({ email: "x@example.test", consent: false })).ok, false);
  assert.equal((await subscribe({ email: "x@example.test" })).ok, false);
  assert.equal(outbox.length, 0);
});

test("double opt-in: pending until confirmed; confirmation mail contains confirm and unsubscribe links", async () => {
  const r = await subscribe({ email: "  Student@Example.TEST ", consent: true });
  assert.ok(r.ok && r.status === "pending" && r.created);
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0].to, "student@example.test", "address is normalised");
  assert.match(outbox[0].text, /vacancy\/confirm\?id=vs_/);
  assert.match(outbox[0].headers?.["List-Unsubscribe"] || "", /api\/vacancies\/unsubscribe/);
  assert.equal((await listSubscribers())[0].status, "pending");
  const [, id, t] = idFromConfirmMail(outbox[0]);
  assert.equal(await confirmSubscription(id, t), "ok");
  assert.equal((await listSubscribers())[0].status, "active");
});

test("duplicate subscriptions are prevented (case/whitespace insensitive)", async () => {
  await activeSub("dup@example.test");
  const again = await subscribe({ email: "DUP@example.test ", consent: true, preferredArea: "satellite" });
  assert.ok(again.ok && again.created === false);
  const all = await listSubscribers();
  assert.equal(all.length, 1);
  assert.equal(all[0].preferredArea, "satellite", "re-subscribing refreshes preferences instead of duplicating");
});

test("concurrent identical subscriptions create exactly one record", async () => {
  await Promise.all(Array.from({ length: 8 }, () => subscribe({ email: "race@example.test", consent: true })));
  assert.equal((await listSubscribers()).length, 1);
});

test("tokens are bound to the subscriber and kind", async () => {
  const t = makeToken("unsub", "vs_aaaaaaaaaaaaaaaaaa");
  assert.equal(checkToken("unsub", "vs_aaaaaaaaaaaaaaaaaa", t), true);
  assert.equal(checkToken("confirm", "vs_aaaaaaaaaaaaaaaaaa", t), false);
  assert.equal(checkToken("unsub", "vs_bbbbbbbbbbbbbbbbbb", t), false);
  assert.equal(checkToken("unsub", "vs_aaaaaaaaaaaaaaaaaa", t + "x"), false);
  assert.equal(await confirmSubscription("vs_aaaaaaaaaaaaaaaaaa", "forged"), "invalid");
  assert.equal(await unsubscribe("vs_aaaaaaaaaaaaaaaaaa", "forged"), "invalid");
});

test("an unconfirmed address never receives alerts", async () => {
  await subscribe({ email: "pending@example.test", consent: true });
  outbox.length = 0;
  const { before, after } = propPair();
  const r = await recordAvailabilityChange(before, after, "admin@example.test");
  assert.equal(r.events, 1);
  assert.equal(r.queued, 0);
});

test("detectNewlyAvailable: only genuine unavailable -> available transitions on existing rooms", () => {
  const { before, after, roomId } = propPair();
  assert.deepEqual(detectNewlyAvailable(before, after).map((r) => r.id), [roomId]);
  // already available -> still available: nothing
  assert.equal(detectNewlyAvailable(after, after).length, 0);
  // available -> unavailable: nothing
  assert.equal(detectNewlyAvailable(after, before).length, 0);
  // brand new property / brand-new room: nothing
  assert.equal(detectNewlyAvailable(null, after).length, 0);
  const withNew = clone(before);
  withNew.rooms.push({ ...clone(after.rooms[0]), id: "brand-new-room" });
  assert.equal(detectNewlyAvailable(before, withNew).length, 0);
  // draft properties never alert
  const draft = clone(after); draft.status = "draft";
  assert.equal(detectNewlyAvailable(before, draft).length, 0);
  // from-date -> now counts
  const fd = clone(before); fd.rooms[0].availability = "from-date";
  assert.equal(detectNewlyAvailable(fd, after).length, 1);
});

test("subscriberMatches honours property, area and room-type preferences", () => {
  const s = (o: Partial<Subscriber>): Subscriber => ({
    id: "x", email: "x@example.test", preferredArea: "all", preferredProperty: "all", sharingType: "any", status: "active", consentAt: "", createdAt: "", updatedAt: "", ...o,
  });
  const ev = { propertySlug: "p1", areaSlug: "satellite", roomType: "double" };
  assert.equal(subscriberMatches(s({}), ev), true);
  assert.equal(subscriberMatches(s({ preferredArea: "satellite" }), ev), true);
  assert.equal(subscriberMatches(s({ preferredArea: "vastrapur" }), ev), false);
  assert.equal(subscriberMatches(s({ preferredProperty: "p2" }), ev), false);
  assert.equal(subscriberMatches(s({ sharingType: "single" }), ev), false);
  assert.equal(subscriberMatches(s({ sharingType: "double" }), ev), true);
  assert.equal(subscriberMatches(s({ status: "unsubscribed" }), ev), false);
  assert.equal(subscriberMatches(s({ status: "pending" }), ev), false);
});

test("END-TO-END: subscribe -> confirm -> availability flips -> exactly one email -> status recorded", async () => {
  const id = await activeSub("student@example.test", { preferredArea: "all" });
  await activeSub("other-area@example.test", { preferredArea: "no-such-area" });
  outbox.length = 0;

  const { before, after, roomId } = propPair();
  const rec = await recordAvailabilityChange(before, after, "admin@example.test");
  assert.deepEqual(rec, { events: 1, queued: 1 });

  const deps = { getProperty: async () => after, areaName: async () => "Satellite" };
  const run = await processQueue(deps);
  assert.equal(run.sent, 1);
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0].to, "student@example.test");
  assert.match(outbox[0].subject, /Bed available/);
  assert.match(outbox[0].html, /Satellite/);
  assert.match(outbox[0].text, /Unsubscribe: https:\/\/example\.test\/api\/vacancies\/unsubscribe\?id=/);
  assert.ok(outbox[0].html.includes(after.name.replace(/&/g, "&amp;")) || outbox[0].html.includes(after.name));

  // idempotent: re-running the queue or re-recording the same transition sends nothing more
  assert.equal((await processQueue(deps)).processed, 0);
  await recordAvailabilityChange(before, after, "admin@example.test");
  assert.equal((await processQueue(deps)).processed, 0);
  assert.equal(outbox.length, 1);

  const [ev] = await listEvents();
  assert.equal(ev.roomId, roomId);
  assert.equal(ev.totals.sent, 1);
  assert.equal(ev.notifications[0].status, "sent");
  assert.ok(id);
});

test("a second availability event later sends again, but a repeat save of the same state does not", async () => {
  await activeSub("student@example.test");
  outbox.length = 0;
  const { before, after } = propPair();
  const deps = { getProperty: async () => after };
  await recordAvailabilityChange(before, after, "a");
  await processQueue(deps);
  // admin re-saves while still available -> no transition -> no new event
  const resave = clone(after); resave.updatedAt = new Date(Date.now() + 5000).toISOString();
  assert.deepEqual(await recordAvailabilityChange(after, resave, "a"), { events: 0, queued: 0 });
  // room goes full and later opens again -> genuinely new event
  const full = clone(after); full.rooms[0].availability = "unknown";
  const reopened = clone(after); reopened.updatedAt = new Date(Date.now() + 60_000).toISOString();
  assert.equal((await recordAvailabilityChange(full, reopened, "a")).queued, 1);
  await processQueue({ getProperty: async () => reopened });
  assert.equal(outbox.length, 2);
});

test("delivery failure is recorded, retried with back-off, and gives up after the maximum attempts", async () => {
  await activeSub("flaky@example.test");
  outbox.length = 0;
  const { before, after } = propPair();
  await recordAvailabilityChange(before, after, "a");
  const deps = { getProperty: async () => after };

  failNext = 1;
  const r1 = await processQueue(deps);
  assert.equal(r1.failed, 1);
  let [ev] = await listEvents();
  assert.equal(ev.notifications[0].status, "failed");
  assert.match(ev.notifications[0].lastError || "", /451/);

  // not due yet (back-off): nothing happens
  assert.equal((await processQueue(deps)).processed, 0);

  // admin presses "retry" -> delivered
  assert.equal(await retryFailed(), 1);
  const r2 = await processQueue(deps);
  assert.equal(r2.sent, 1);
  [ev] = await listEvents();
  assert.equal(ev.notifications[0].status, "sent");

  // permanent failure stops after MAX_ATTEMPTS
  __resetMemoryStore(); outbox.length = 0;
  await activeSub("dead@example.test"); outbox.length = 0;
  await recordAvailabilityChange(before, after, "a");
  failNext = 999;
  for (let i = 0; i < MAX_ATTEMPTS + 2; i++) {
    await collection("vacancy_notifications").updateOne({}, { $set: { nextAttemptAt: 0 } });
    await processQueue(deps);
  }
  const n = (await collection("vacancy_notifications").find({}))[0];
  assert.equal(n.status, "failed");
  assert.equal(n.attempts, MAX_ATTEMPTS);
  assert.equal(outbox.length, 0);
});

test("unsubscribe stops pending notifications and future alerts; resubscribing needs fresh confirmation", async () => {
  const id = await activeSub("leaving@example.test");
  outbox.length = 0;
  const { before, after } = propPair();
  await recordAvailabilityChange(before, after, "a");           // queued
  assert.equal(await unsubscribe(id, makeToken("unsub", id)), "ok");
  assert.equal((await processQueue({ getProperty: async () => after })).sent, 0);
  assert.equal(outbox.length, 0);
  assert.equal((await listSubscribers())[0].status, "unsubscribed");

  const again = await subscribe({ email: "leaving@example.test", consent: true });
  assert.ok(again.ok && again.status === "pending");
  assert.equal((await listSubscribers())[0].status, "pending");
});

test("no alert is sent for a bed that is no longer available by delivery time", async () => {
  await activeSub("late@example.test");
  outbox.length = 0;
  const { before, after } = propPair();
  await recordAvailabilityChange(before, after, "a");
  const reverted = clone(after); reverted.rooms[0].availability = "unknown";
  const r = await processQueue({ getProperty: async () => reverted });
  assert.equal(r.skipped, 1);
  assert.equal(outbox.length, 0);
});

test("admin patch is allow-listed (no mass assignment) and cannot force-confirm an address", async () => {
  const out = await subscribe({ email: "p@example.test", consent: true });
  assert.ok(out.ok);
  const [s] = await listSubscribers();
  const patched = await patchSubscriber(s.id, { status: "active", email: "evil@example.test", id: "hijack", consentAt: "1970", name: "Renamed", preferredArea: "<script>" });
  assert.equal(patched?.status, "pending", "admins can not mark an unconfirmed address as consenting");
  assert.equal(patched?.email, "p@example.test");
  assert.equal(patched?.id, s.id);
  assert.equal(patched?.name, "Renamed");
  assert.equal(patched?.preferredArea, "all", "invalid slugs are normalised");
});

test("email templates escape user-controlled text", async () => {
  await subscribe({ email: "xss@example.test", name: `<img src=x onerror=alert(1)>`, consent: true });
  assert.ok(!outbox[0].html.includes("<img src=x"));
  assert.ok(outbox[0].html.includes("&lt;img"));
});
