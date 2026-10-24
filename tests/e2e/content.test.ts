import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { BASE, Client, CRON_SECRET, OWNER, lastCode, mails, mailsTo, startServer, stopServer } from "./harness";
import { sampleProperties } from "../../src/lib/sample-data";

let n = 100;
const client = () => {
  const c = new Client();
  const ip = `10.2.${++n}.9`;
  const orig = c.req.bind(c);
  c.req = (m, u, o = {}) => orig(m, u, { ...o, headers: { "x-forwarded-for": ip, ...(o.headers || {}) } });
  return c;
};

const admin = client();

before(async () => {
  await startServer({ mode: "dev" });
  const login = await admin.post("/api/auth/login", { email: OWNER.email, password: OWNER.password });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  const v = await admin.post("/api/auth/verify-otp", { otp: lastCode(OWNER.email) });
  assert.equal(v.status, 200, JSON.stringify(v.body));
});
after(async () => { await stopServer(); });

const SLUG = "e2e-test-residence";
function testProperty(avail: "unknown" | "now", extra: Record<string, unknown> = {}) {
  const base = structuredClone(sampleProperties.find((p) => p.rooms.length >= 1)!) as any;
  return {
    ...base,
    slug: SLUG,
    name: "E2E Test Residence",
    status: "active",
    featured: false,
    rooms: [{ ...base.rooms[0], id: "room-e2e-1", type: "double", availability: avail }],
    ...extra,
  };
}

// ------------------------------------------------------------------ vacancy subscription (public)
test("public subscribe: server-side validation, consent, honeypot, uniform answers, no duplicates", async () => {
  const c = client();
  assert.equal((await c.post("/api/vacancies", { email: "nope", consent: true })).status, 400);
  assert.equal((await c.post("/api/vacancies", { email: "a@b.co" })).status, 400, "consent required");
  assert.equal((await c.post("/api/vacancies", "not json" as any)).status >= 400, true);
  const bot = await c.post("/api/vacancies", { email: "bot@example.test", consent: true, website: "http://spam" });
  assert.equal(bot.status, 400);

  const first = await c.post("/api/vacancies", { email: "Student@Example.test", consent: true, name: "Stu", preferredArea: "all", sharingType: "double" });
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.equal(mailsTo("student@example.test").length, 1, "one confirmation mail");
  assert.ok(!JSON.stringify(first.body).includes("student@example.test"), "response does not echo the address");

  const dup = await c.post("/api/vacancies", { email: "student@example.test ", consent: true });
  assert.equal(dup.status, 200);
  assert.equal(dup.body.message, first.body.message, "duplicate gets the same neutral answer");
  const list = await admin.get("/api/admin/vacancies");
  assert.equal(list.body.subscribers.filter((s: any) => s.email === "student@example.test").length, 1, "stored exactly once");
  assert.equal(list.body.subscribers.find((s: any) => s.email === "student@example.test").status, "pending");
});

test("a pending subscriber receives nothing until they confirm; confirm requires the signed token", async () => {
  const c = client();
  const conf = mailsTo("student@example.test")[0].text.match(/vacancy\/confirm\?id=(vs_[a-f0-9]+)&t=([\w-]+)/)!;
  const [, id, t] = conf;
  assert.equal((await c.post("/api/vacancies/confirm", { id, t: "forged" })).status, 400);
  assert.equal((await c.post("/api/vacancies/confirm", { id: "vs_000000000000000000", t })).status >= 400, true);
  assert.equal((await c.post("/api/vacancies/confirm", { id, t })).status, 200);
  const list = await admin.get("/api/admin/vacancies");
  assert.equal(list.body.subscribers.find((s: any) => s.id === id).status, "active");
});

// ------------------------------------------------------------------ admin availability -> automatic email
test("END-TO-END: admin marks a bed available -> subscriber emailed once -> log shows it; re-save does not re-send", async () => {
  // a second subscriber who only wants a different area must NOT be emailed
  const other = client();
  await other.post("/api/vacancies", { email: "elsewhere@example.test", consent: true, preferredArea: "thaltej-not-this-one" });
  const oc = mailsTo("elsewhere@example.test")[0].text.match(/id=(vs_[a-f0-9]+)&t=([\w-]+)/)!;
  await other.post("/api/vacancies/confirm", { id: oc[1], t: oc[2] });

  const create = await admin.post("/api/admin/properties", testProperty("unknown"));
  assert.equal(create.status, 200, JSON.stringify(create.body));
  assert.equal(create.body.alerts.queued, 0, "creating an unavailable room alerts nobody");

  const open = await admin.post("/api/admin/properties", testProperty("now"));
  assert.equal(open.status, 200, JSON.stringify(open.body));
  assert.equal(open.body.alerts.events, 1);
  assert.equal(open.body.alerts.queued, 1);
  assert.equal(open.body.alerts.sent, 1);

  const alerts = mailsTo("student@example.test").filter((m) => /Bed available/.test(m.subject));
  assert.equal(alerts.length, 1);
  assert.match(alerts[0].text, /E2E Test Residence/);
  assert.match(alerts[0].text, new RegExp(`${BASE.replace(/\./g, "\\.")}/api/vacancies/unsubscribe\\?id=vs_`));
  assert.equal(mailsTo("elsewhere@example.test").filter((m) => /Bed available/.test(m.subject)).length, 0, "non-matching preference is not emailed");

  // saving again while still available is not a new event
  const again = await admin.post("/api/admin/properties", testProperty("now", { description: "edited description" }));
  assert.equal(again.body.alerts.events, 0);
  assert.equal(mailsTo("student@example.test").filter((m) => /Bed available/.test(m.subject)).length, 1);

  const log = await admin.get("/api/admin/vacancy-notifications");
  assert.equal(log.status, 200);
  const ev = log.body.events.find((e: any) => e.propertySlug === SLUG);
  assert.ok(ev);
  assert.equal(ev.totals.sent, 1);
  assert.equal(ev.notifications[0].email, "student@example.test");
  assert.equal(ev.notifications[0].status, "sent");

  // the public site reflects availability immediately (no redeploy)
  const settings = await new Client().get("/api/site-settings");
  assert.ok(settings.body.data.openBeds.length >= 1);
});

test("a room that fills up and later reopens is a new event (and sends again)", async () => {
  assert.equal((await admin.post("/api/admin/properties", testProperty("unknown"))).body.alerts.events, 0);
  const reopen = await admin.post("/api/admin/properties", testProperty("now"));
  assert.equal(reopen.body.alerts.events, 1);
  assert.equal(reopen.body.alerts.sent, 1);
  assert.equal(mailsTo("student@example.test").filter((m) => /Bed available/.test(m.subject)).length, 2);
});

// ------------------------------------------------------------------ unsubscribe
test("unsubscribe: GET never changes state; POST with a valid token does; forged token fails; no more alerts", async () => {
  const c = client();
  const m = mailsTo("student@example.test").find((x) => /Bed available/.test(x.subject))!;
  const [, id, t] = m.text.match(/unsubscribe\?id=(vs_[a-f0-9]+)&t=([\w-]+)/)!;

  const get = await c.get(`/api/vacancies/unsubscribe?id=${id}&t=${t}`);
  assert.equal(get.status, 303);
  assert.match(get.headers.get("location") || "", /\/vacancy\/unsubscribe\?id=/);
  let sub = (await admin.get("/api/admin/vacancies")).body.subscribers.find((s: any) => s.id === id);
  assert.equal(sub.status, "active", "a GET (e.g. a mail scanner) must not unsubscribe anyone");

  assert.equal((await c.post(`/api/vacancies/unsubscribe?id=${id}&t=forged`)).status, 400);
  assert.equal((await c.post(`/api/vacancies/unsubscribe?id=${id}&t=${t}`)).status, 200, "one-click POST works");
  sub = (await admin.get("/api/admin/vacancies")).body.subscribers.find((s: any) => s.id === id);
  assert.equal(sub.status, "unsubscribed");

  await admin.post("/api/admin/properties", testProperty("unknown"));
  const r = await admin.post("/api/admin/properties", testProperty("now"));
  assert.equal(r.body.alerts.queued, 0, "unsubscribed addresses are never queued");
  assert.equal(mailsTo("student@example.test").filter((x) => /Bed available/.test(x.subject)).length, 2, "still only the two earlier alerts");
});

test("public pages render for the new vacancy routes and the home page", async () => {
  const c = client();
  for (const p of ["/", "/vacancy/confirm?id=vs_x&t=y", "/vacancy/unsubscribe?id=vs_x&t=y", "/pgs", "/faq", "/sitemap.xml", "/robots.txt"]) {
    const r = await c.get(p);
    assert.equal(r.status, 200, `${p} -> ${r.status}`);
  }
  const confirm = await c.get("/vacancy/confirm");
  assert.match(String(confirm.body), /noindex/, "confirm page is noindex");
  const robots = String((await c.get("/robots.txt")).body);
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Disallow: \/api\//);
});

// ------------------------------------------------------------------ dynamic CMS + drag-and-drop persistence
test("CMS: validation rejects unsafe/unknown input; valid edits appear publicly without redeploy", async () => {
  const bad = await admin.post("/api/admin/cms/content", { navigation: { ctaHref: "javascript:alert(1)" } });
  assert.equal(bad.status, 400);
  assert.equal((await admin.post("/api/admin/cms/content", { isAdmin: true })).status, 400, "unknown keys rejected");
  assert.equal((await admin.post("/api/admin/cms/content", { hero: { line1: "x".repeat(1000) } })).status, 400);

  const ok = await admin.post("/api/admin/cms/content", { hero: { line1: "E2E headline one" }, contact: { phone: "+91 90000 11111" } });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const pub = await new Client().get("/api/site-settings");
  assert.equal(pub.body.data.hero.line1, "E2E headline one");
  assert.equal(pub.body.data.contact.phone, "+91 90000 11111");
});

test("DRAG & DROP persistence: homepage section order/visibility, hero slide order and FAQ order survive reload", async () => {
  const cur = (await admin.get("/api/admin/cms/content")).body.data;
  const ids: string[] = cur.homeSections.map((s: any) => s.id);
  assert.equal(ids.length, 10);

  const reordered = [...ids].reverse().map((id) => ({ id, visible: id !== "testimonials" }));
  const slides = [...cur.hero.slides].reverse();
  const cats = [...cur.faq.categories].reverse();
  const save = await admin.post("/api/admin/cms/content", { homeSections: reordered, hero: { slides }, faq: { categories: cats } });
  assert.equal(save.status, 200, JSON.stringify(save.body));

  const reload = (await admin.get("/api/admin/cms/content")).body.data;
  assert.deepEqual(reload.homeSections.map((s: any) => s.id), reordered.map((s) => s.id));
  assert.equal(reload.homeSections.find((s: any) => s.id === "testimonials").visible, false);
  assert.deepEqual(reload.hero.slides.map((s: any) => s.label), slides.map((s: any) => s.label));
  assert.deepEqual(reload.faq.categories.map((c: any) => c.category), cats.map((c: any) => c.category));

  // the public homepage renders sections in the saved order and omits hidden ones
  const html = String((await new Client().get("/")).body);
  const pos = (needle: string) => html.indexOf(needle);
  assert.ok(pos('aria-labelledby="cta"') > -1, "contact section rendered");
  assert.ok(pos('aria-labelledby="featured"') > -1, "featured section rendered");
  assert.ok(pos('aria-labelledby="cta"') < pos('aria-labelledby="featured"'), "contact (last by default) now renders before featured (first by default)");
  assert.equal(html.includes("Auto-Rotating Resident Reviews"), false);

  // a malformed order is normalised, not trusted
  const weird = await admin.post("/api/admin/cms/content", { homeSections: [{ id: "areas", visible: true }, { id: "areas", visible: false }] });
  assert.equal(weird.status, 200);
  const norm = (await admin.get("/api/admin/cms/content")).body.data.homeSections;
  assert.equal(norm.length, 10, "duplicates dropped, missing sections appended");
  assert.equal(new Set(norm.map((s: any) => s.id)).size, 10);
});

// ------------------------------------------------------------------ misc hardening
test("inquiry form: server validation + honeypot; no internals leak in errors", async () => {
  const c = client();
  const bad = await c.post("/api/inquiries", { name: "A", phone: "123", consent: true });
  assert.equal(bad.status, 400);
  const ok = await c.post("/api/inquiries", { name: "Test Person", phone: "9876543210", consent: true, kind: "inquiry" });
  assert.equal(ok.status, 200);
  const e = await c.post("/api/events", { event: "<script>" });
  assert.equal(e.status, 200);
  for (const r of [bad, e]) assert.ok(!/stack|at .*\.ts|node_modules/i.test(JSON.stringify(r.body)));
});

test("cron endpoint requires its bearer secret", async () => {
  const c = client();
  assert.equal((await c.get("/api/cron/vacancy-notifications")).status, 401);
  assert.equal((await c.get("/api/cron/vacancy-notifications", { headers: { authorization: "Bearer wrong-wrong-wrong-wrong" } })).status, 401);
  const ok = await c.get("/api/cron/vacancy-notifications", { headers: { authorization: `Bearer ${CRON_SECRET}` } });
  assert.equal(ok.status, 200);
});

test("security headers on public and admin responses", async () => {
  const c = client();
  const home = await c.get("/");
  const csp = home.headers.get("content-security-policy") || "";
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'self'/);
  assert.equal(home.headers.get("x-content-type-options"), "nosniff");
  assert.ok(home.headers.get("referrer-policy"));
  assert.equal(home.headers.get("x-powered-by"), null);
  const login = await c.get("/admin/login");
  assert.match(login.headers.get("cache-control") || "", /no-store/);
  assert.match(login.headers.get("x-robots-tag") || "", /noindex/);
  const api = await c.post("/api/auth/login", { email: "x@y.co", password: "pppppppppp1" });
  assert.match(api.headers.get("cache-control") || "", /no-store/);
});

test("footer social links are CMS-managed: unsafe links rejected, https links published, empty hides", async () => {
  assert.equal((await admin.post("/api/admin/cms/content", { contact: { socials: { instagram: "javascript:alert(1)" } } })).status, 400);
  assert.equal((await admin.post("/api/admin/cms/content", { contact: { socials: { instagram: "http://insecure.example" } } })).status, 400);
  const ok = await admin.post("/api/admin/cms/content", { contact: { socials: { instagram: "https://instagram.com/luxora-e2e", youtube: "" } } });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const pub = await new Client().get("/api/site-settings");
  assert.equal(pub.body.data.contact.socials.instagram, "https://instagram.com/luxora-e2e");
  assert.equal(pub.body.data.contact.socials.youtube, "");
});
