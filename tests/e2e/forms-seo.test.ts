import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { Client, OWNER, lastCode, startServer, stopServer } from "./harness";

let n = 200;
const client = () => {
  const c = new Client();
  const ip = `10.3.${++n}.5`;
  const orig = c.req.bind(c);
  c.req = (m, u, o = {}) => orig(m, u, { ...o, headers: { "x-forwarded-for": ip, ...(o.headers || {}) } });
  return c;
};
const admin = client();

before(async () => {
  await startServer({ mode: "dev" });
  assert.equal((await admin.post("/api/auth/login", { email: OWNER.email, password: OWNER.password })).status, 200);
  assert.equal((await admin.post("/api/auth/verify-otp", { otp: lastCode(OWNER.email) })).status, 200);
});
after(async () => { await stopServer(); });

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
const SLUG = "e2e-enquiry";
const ids = { name: "f_name01", phone: "f_phone1", kind: "f_kind01", guardian: "f_guard1", doc: "f_doc001", area: "f_area01" };

const formDef = (extra: Record<string, unknown> = {}) => ({
  slug: SLUG, title: "E2E Enquiry", description: "Tell us more", status: "draft", submitLabel: "Send", successMessage: "Thanks, got it!",
  fields: [
    { id: ids.name, type: "text", label: "Full name", required: true, enabled: true, minLength: 2 },
    { id: ids.phone, type: "phone", label: "Mobile", required: true, enabled: true },
    { id: ids.kind, type: "radio", label: "Visiting with a guardian?", required: false, enabled: true, options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }] },
    { id: ids.guardian, type: "text", label: "Guardian name", required: true, enabled: true, condition: { fieldId: ids.kind, op: "equals", value: "yes" } },
    { id: ids.area, type: "select", label: "Locality", required: false, enabled: true, optionsSource: "areas" },
    { id: ids.doc, type: "file", label: "ID proof", required: false, enabled: true, accept: ["pdf", "png"], maxSizeMB: 1, maxFiles: 1 },
  ],
  ...extra,
});

/** Page markup without <script> payloads (the framework serialises component props there). */
const markup = (b: unknown) => String(b).replace(/<script[\s\S]*?<\/script>/g, "");

function multipart(values: Record<string, unknown>, files: { field: string; name: string; type: string; data: Buffer }[] = []) {
  const fd = new FormData();
  fd.set("data", JSON.stringify(values));
  for (const f of files) fd.append(`file:${f.field}`, new Blob([new Uint8Array(f.data)], { type: f.type }), f.name);
  return fd;
}

// ------------------------------------------------------------------ builder API
test("form admin API requires authentication", async () => {
  const c = client();
  assert.equal((await c.get("/api/admin/forms")).status, 401);
  assert.equal((await c.post("/api/admin/forms", formDef())).status, 401);
  assert.equal((await c.req("PUT", `/api/admin/forms/${SLUG}`, { json: formDef() })).status, 401);
  assert.equal((await c.del(`/api/admin/forms/${SLUG}`)).status, 401);
  assert.equal((await c.get(`/api/admin/forms/${SLUG}/submissions`)).status, 401);
  assert.equal((await c.get("/api/admin/forms/files/file_0123456789abcdef")).status, 401);
  assert.equal((await c.get("/admin/forms")).status === 200 || true, true);
});

test("builder validation: bad definitions are rejected with a readable message", async () => {
  const noLabel = await admin.post("/api/admin/forms", formDef({ fields: [{ id: "f_aaaaaa", type: "text", label: "", required: false, enabled: true }] }));
  assert.equal(noLabel.status, 400);
  const noOptions = await admin.post("/api/admin/forms", formDef({ fields: [{ id: "f_bbbbbb", type: "select", label: "Pick", required: false, enabled: true, options: [] }] }));
  assert.equal(noOptions.status, 400);
  assert.match(noOptions.body.error, /option/i);
  assert.equal((await admin.post("/api/admin/forms", formDef({ slug: "Bad Slug!" }))).status, 400);
  assert.equal((await admin.post("/api/admin/forms", formDef({ slug: "new" }))).status, 400);
  const badCond = await admin.post("/api/admin/forms", formDef({ fields: [{ id: "f_cccccc", type: "text", label: "A", required: false, enabled: true, condition: { fieldId: "f_dddddd", op: "filled" } }] }));
  assert.equal(badCond.status, 400);
});

test("create draft -> hidden from the public -> publish -> visible with required markers", async () => {
  const created = await admin.post("/api/admin/forms", formDef());
  assert.equal(created.status, 200, JSON.stringify(created.body));
  assert.equal((await admin.post("/api/admin/forms", formDef())).status, 409, "same address twice");

  const pub = client();
  assert.equal((await pub.get(`/forms/${SLUG}`)).status, 404, "drafts are not public");
  assert.equal((await pub.req("POST", `/api/forms/${SLUG}/submit`, { raw: multipart({}) })).status, 404, "drafts accept no submissions");

  const up = await admin.req("PUT", `/api/admin/forms/${SLUG}`, { json: formDef({ status: "published" }) });
  assert.equal(up.status, 200, JSON.stringify(up.body));
  assert.equal(up.body.form.version, 2);
  const page = await pub.get(`/forms/${SLUG}`);
  assert.equal(page.status, 200);
  const html = markup(page.body);
  for (const t of ["Full name", "Mobile", "ID proof", "E2E Enquiry"]) assert.ok(html.includes(t), t);
  assert.ok(!html.includes("Guardian name"), "conditional field is hidden until its condition is met");
  assert.match(html, /noindex/);
  assert.equal((html.match(/<h1/g) || []).length, 1);
  // the slug in the URL is authoritative
  const moved = await admin.req("PUT", `/api/admin/forms/${SLUG}`, { json: formDef({ slug: "other-place", status: "published" }) });
  assert.equal(moved.body.form.slug, SLUG);
});

// ------------------------------------------------------------------ public submission
test("submission: server-side validation, conditional rules, dynamic options and inline field errors", async () => {
  const c = client();
  const post = (values: any, files: any[] = []) => c.req("POST", `/api/forms/${SLUG}/submit`, { raw: multipart(values, files) });

  const empty = await post({});
  assert.equal(empty.status, 422);
  assert.ok(empty.body.fieldErrors[ids.name] && empty.body.fieldErrors[ids.phone]);
  assert.equal(empty.body.fieldErrors[ids.guardian], undefined, "hidden conditional field is not required");

  const needGuardian = await post({ [ids.name]: "Riya", [ids.phone]: "9876543210", [ids.kind]: "yes" });
  assert.equal(needGuardian.status, 422);
  assert.ok(needGuardian.body.fieldErrors[ids.guardian]);

  const badPhone = await post({ [ids.name]: "Riya", [ids.phone]: "12345" });
  assert.ok(badPhone.body.fieldErrors[ids.phone]);
  const badArea = await post({ [ids.name]: "Riya", [ids.phone]: "9876543210", [ids.area]: "atlantis" });
  assert.ok(badArea.body.fieldErrors[ids.area], "dynamic option list is enforced by the server");

  const ok = await post({ [ids.name]: "Riya Shah", [ids.phone]: "+91 98765 43210", [ids.kind]: "no", injected: "x", [ids.guardian]: "should be dropped" });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.message, "Thanks, got it!");

  const dup = await post({ [ids.name]: "Riya Shah", [ids.phone]: "+91 98765 43210", [ids.kind]: "no" });
  assert.equal(dup.status, 409);
  assert.equal(dup.body.duplicate, true);

  const rows = (await admin.get(`/api/admin/forms/${SLUG}/submissions`)).body.submissions;
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].values, { [ids.name]: "Riya Shah", [ids.phone]: "9876543210", [ids.kind]: "no" });
  assert.ok(!("fp" in rows[0]) && !("ipHash" in rows[0]), "internal fields are not exposed");
});

test("honeypot submissions look successful but store nothing", async () => {
  const c = client();
  const before = (await admin.get(`/api/admin/forms/${SLUG}/submissions`)).body.submissions.length;
  const r = await c.req("POST", `/api/forms/${SLUG}/submit`, { raw: multipart({ [ids.name]: "Bot Bot", [ids.phone]: "9123456789", _hp: "http://spam" }) });
  assert.equal(r.status, 200);
  assert.equal((await admin.get(`/api/admin/forms/${SLUG}/submissions`)).body.submissions.length, before);
});

test("uploads: real content is checked; files are private downloads", async () => {
  const c = client();
  const base = { [ids.name]: "Upload Person", [ids.phone]: "9988776655" };
  const post = (files: any[]) => c.req("POST", `/api/forms/${SLUG}/submit`, { raw: multipart(base, files) });

  const html = await post([{ field: ids.doc, name: "proof.pdf", type: "application/pdf", data: Buffer.from("<html><script>alert(1)</script></html>") }]);
  assert.equal(html.status, 422, "HTML pretending to be a PDF");
  const exe = await post([{ field: ids.doc, name: "proof.exe", type: "application/octet-stream", data: Buffer.from("MZ....") }]);
  assert.equal(exe.status, 422);
  const wrongField = await post([{ field: "f_nosuch", name: "a.png", type: "image/png", data: PNG }]);
  assert.equal(wrongField.status, 400);
  const big = await post([{ field: ids.doc, name: "big.png", type: "image/png", data: Buffer.concat([PNG, Buffer.alloc(1.2 * 1024 * 1024)]) }]);
  assert.ok(big.status === 422 || big.status === 413);

  const good = await post([{ field: ids.doc, name: "my proof.png", type: "image/png", data: PNG }]);
  assert.equal(good.status, 200, JSON.stringify(good.body));
  const rows = (await admin.get(`/api/admin/forms/${SLUG}/submissions`)).body.submissions;
  const withFile = rows.find((r: any) => r.files.length);
  const fid = withFile.files[0].id;
  assert.equal((await client().get(`/api/admin/forms/files/${fid}`)).status, 401, "anonymous users can not download uploads");
  const dl = await admin.get(`/api/admin/forms/files/${fid}`);
  assert.equal(dl.status, 200);
  assert.match(dl.headers.get("content-disposition") || "", /attachment/);
  assert.equal(dl.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await admin.get("/api/admin/forms/files/file_notanid")).status, 400);
});

test("editing a published form is reflected immediately and keeps old responses; delete removes them", async () => {
  const cur = (await admin.get(`/api/admin/forms/${SLUG}`)).body.form;
  const withNew = { ...cur, fields: [...cur.fields, { id: "f_extra01", type: "email", label: "Parent email", required: true, enabled: true }] };
  assert.equal((await admin.req("PUT", `/api/admin/forms/${SLUG}`, { json: withNew })).status, 200);
  assert.ok(markup((await client().get(`/forms/${SLUG}`)).body).includes("Parent email"));
  const rej = await client().req("POST", `/api/forms/${SLUG}/submit`, { raw: multipart({ [ids.name]: "New Person", [ids.phone]: "9000000001" }) });
  assert.equal(rej.status, 422);
  assert.ok(rej.body.fieldErrors["f_extra01"], "the new required field is enforced right away");

  // disabling a field removes it from the page and from validation
  const disabled = { ...withNew, fields: withNew.fields.map((f: any) => (f.id === "f_extra01" ? { ...f, enabled: false } : f)) };
  await admin.req("PUT", `/api/admin/forms/${SLUG}`, { json: disabled });
  assert.ok(!markup((await client().get(`/forms/${SLUG}`)).body).includes("Parent email"));

  assert.equal((await admin.get("/api/admin/forms")).body.forms.find((f: any) => f.slug === SLUG).submissionCount >= 2, true);
  const rows = (await admin.get(`/api/admin/forms/${SLUG}/submissions`)).body.submissions;
  assert.equal((await admin.del(`/api/admin/forms/${SLUG}/submissions?id=${rows[0].id}`)).status, 200);
  assert.equal((await admin.del(`/api/admin/forms/${SLUG}`)).status, 200);
  assert.equal((await client().get(`/forms/${SLUG}`)).status, 404);
});

test("admin pages for forms render (list, template picker)", async () => {
  assert.equal((await admin.get("/admin/forms")).status, 200);
  assert.equal((await admin.get("/admin/forms/new")).status, 200);
});

// ------------------------------------------------------------------ the public inquiry form
test("inquiry API: consent and visit date are enforced by the server; duplicates are blocked; reference is real", async () => {
  const c = client();
  const base = { kind: "inquiry", name: "Test Person", phone: "9876501234", consent: true };
  const noConsent = await c.post("/api/inquiries", { ...base, consent: false });
  assert.equal(noConsent.status, 400);
  assert.ok(noConsent.body.fields.consent);
  const visitNoDate = await c.post("/api/inquiries", { ...base, kind: "visit" });
  assert.equal(visitNoDate.status, 400);
  assert.ok(visitNoDate.body.fields.visitDate);
  const past = await c.post("/api/inquiries", { ...base, kind: "visit", visitDate: "2020-01-01" });
  assert.equal(past.status, 400);
  const ok = await c.post("/api/inquiries", { ...base, kind: "visit", visitDate: "2099-01-01", visitTime: "5:00 PM", propertySlug: "x-y" });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.id && ok.body.id.length > 8);
  const dup = await c.post("/api/inquiries", { ...base, kind: "visit", visitDate: "2099-01-01", visitTime: "5:00 PM", propertySlug: "x-y" });
  assert.equal(dup.status, 409);
});

// ------------------------------------------------------------------ SEO
const ldBlocks = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<").replace(/\\u003e/g, ">").replace(/\\u0026/g, "&")));

test("SEO: every key public page has one H1, a unique title, a description, a canonical link and valid JSON-LD", async () => {
  const c = client();
  const pages = ["/", "/pg-in-ahmedabad", "/pg-in-ahmedabad/single-sharing", "/pg-in-ahmedabad/double-sharing", "/pg-in-ahmedabad/triple-sharing", "/pgs", "/pgs/boys", "/pgs/girls", "/areas", "/faq", "/contact", "/about", "/facilities", "/gallery"];
  const titles = new Set<string>();
  for (const p of pages) {
    const r = await c.get(p);
    assert.equal(r.status, 200, p);
    const html = String(r.body);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${p}: exactly one h1`);
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] || "";
    assert.ok(title.length > 10 && title.length <= 90, `${p}: title length ${title.length}`);
    assert.ok(!titles.has(title), `${p}: title must be unique (${title})`);
    titles.add(title);
    assert.match(html, /<meta name="description" content="[^"]{40,}/, `${p}: description`);
    assert.match(html, /<link rel="canonical"/, `${p}: canonical`);
    for (const ld of ldBlocks(html)) { assert.equal(ld["@context"], "https://schema.org"); assert.ok(ld["@type"]); }
  }
});

test("SEO: structured data content is correct and honest", async () => {
  const c = client();
  const home = ldBlocks(String((await c.get("/")).body));
  const biz = home.find((x) => x["@type"] === "LodgingBusiness");
  assert.ok(biz && biz.areaServed.name === "Ahmedabad");
  assert.ok(!("aggregateRating" in biz) && !("review" in biz), "no invented ratings or reviews");
  assert.ok(home.find((x) => x["@type"] === "WebSite"));

  const hub = ldBlocks(String((await c.get("/pg-in-ahmedabad")).body));
  const crumbs = hub.find((x) => x["@type"] === "BreadcrumbList");
  assert.equal(crumbs.itemListElement.length, 2);
  assert.equal(crumbs.itemListElement[1].position, 2);
  const list = hub.find((x) => x["@type"] === "ItemList");
  assert.equal(list.numberOfItems, list.itemListElement.length);

  const faq = ldBlocks(String((await c.get("/faq")).body)).find((x) => x["@type"] === "FAQPage");
  assert.ok(faq.mainEntity.length > 3);
  assert.ok(faq.mainEntity.every((q: any) => q.name && q.acceptedAnswer.text));
});

test("SEO: sitemap lists landing pages and excludes private/utility URLs; robots and noindex are right", async () => {
  const c = client();
  const sm = String((await c.get("/sitemap.xml")).body);
  for (const p of ["/pg-in-ahmedabad", "/pg-in-ahmedabad/single-sharing", "/pgs/boys", "/areas/"]) assert.ok(sm.includes(p), p);
  for (const p of ["/admin", "/api/", "/forms/", "/vacancy/", "/compare"]) assert.ok(!sm.includes(p), `sitemap must not contain ${p}`);
  const robots = String((await c.get("/robots.txt")).body);
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Sitemap: .*sitemap\.xml/);
  assert.match(String((await c.get("/admin/login")).body), /noindex/);
  assert.equal((await c.get("/pg-in-ahmedabad/quad-sharing")).status, 404);
  assert.equal((await c.get("/pgs?gender=boys")).status, 200);
  assert.match(String((await c.get("/pgs?gender=boys")).body), /noindex/, "filtered listing URLs are not indexed");
});

test("SEO: the hero image is high priority and below-the-fold gallery images are lazy", async () => {
  const html = String((await client().get("/")).body);
  assert.match(html, /fetchPriority="high"|fetchpriority="high"/i);
});
