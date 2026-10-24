import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  blankField, formDefSchema, isVisible, sanitizeValues, validateFileMeta, validateValues, type FormDef, type FormField,
} from "@/lib/form-schema";
import { buildTemplate, FORM_TEMPLATES } from "@/lib/form-templates";
import { getForm, saveForm, submitForm, sniffFileType, listSubmissions, deleteForm, resolveOptionSets } from "@/lib/forms";
import { __resetMemoryStore } from "@/lib/db";

beforeEach(() => __resetMemoryStore());

const field = (p: Partial<FormField> & Pick<FormField, "type">): FormField => ({ id: "f_" + Math.random().toString(36).slice(2, 8), label: "L", required: false, enabled: true, ...p });
const def = (fields: FormField[]): FormDef => ({ slug: "t-form", title: "T", status: "published", submitLabel: "Go", successMessage: "Thanks", fields, version: 1, createdAt: "", updatedAt: "" });

test("required / optional rules for every text-like type", () => {
  const f = [field({ type: "text", required: true }), field({ type: "email", required: true }), field({ type: "phone", required: true }), field({ type: "number", required: true }), field({ type: "date", required: true })];
  const e = validateValues(def(f), {});
  for (const x of f) assert.ok(e[x.id], `${x.type} required`);
  const opt = [field({ type: "text" }), field({ type: "email" }), field({ type: "phone" })];
  assert.deepEqual(validateValues(def(opt), {}), {});
});

test("email, phone, number, date validation", () => {
  const email = field({ type: "email" }), phone = field({ type: "phone" }), n = field({ type: "number", min: 10, max: 20 }), d = field({ type: "date", dateRule: "future" });
  const fd = def([email, phone, n, d]);
  assert.ok(validateValues(fd, { [email.id]: "bad@" })[email.id]);
  assert.equal(validateValues(fd, { [email.id]: "ok@example.com" })[email.id], undefined);
  assert.ok(validateValues(fd, { [phone.id]: "12345" })[phone.id]);
  assert.ok(validateValues(fd, { [phone.id]: "5876543210" })[phone.id], "must start with 6-9");
  assert.equal(validateValues(fd, { [phone.id]: "+91 98765-43210" })[phone.id], undefined);
  assert.ok(validateValues(fd, { [n.id]: "abc" })[n.id]);
  assert.ok(validateValues(fd, { [n.id]: "9" })[n.id]);
  assert.ok(validateValues(fd, { [n.id]: "21" })[n.id]);
  assert.equal(validateValues(fd, { [n.id]: "15" })[n.id], undefined);
  const now = new Date("2026-06-15T10:00:00Z");
  assert.ok(validateValues(fd, { [d.id]: "2026-06-14" }, {}, {}, now)[d.id], "past not allowed");
  assert.equal(validateValues(fd, { [d.id]: "2026-06-15" }, {}, {}, now)[d.id], undefined);
  assert.ok(validateValues(fd, { [d.id]: "2026-02-30" }, {}, {}, now)[d.id], "impossible date");
});

test("length limits and option membership", () => {
  const t = field({ type: "text", minLength: 3, maxLength: 5 });
  const s = field({ type: "select", options: [{ label: "A", value: "a" }] });
  const c = field({ type: "checkboxes", options: [{ label: "A", value: "a" }, { label: "B", value: "b" }], maxChoices: 1 });
  const fd = def([t, s, c]);
  assert.ok(validateValues(fd, { [t.id]: "ab" })[t.id]);
  assert.ok(validateValues(fd, { [t.id]: "abcdef" })[t.id]);
  assert.equal(validateValues(fd, { [t.id]: "abcd" })[t.id], undefined);
  assert.ok(validateValues(fd, { [s.id]: "zzz" })[s.id], "value outside the list is rejected server-side too");
  assert.ok(validateValues(fd, { [c.id]: ["a", "b"] })[c.id]);
  assert.ok(validateValues(fd, { [c.id]: ["x"] })[c.id]);
});

test("conditional fields: hidden fields are neither required nor accepted; hidden parents hide children", () => {
  const q = field({ type: "radio", options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }] });
  const g = field({ type: "text", required: true, condition: { fieldId: q.id, op: "equals", value: "yes" } });
  const gg = field({ type: "text", required: true, condition: { fieldId: g.id, op: "filled" } });
  const fd = def([q, g, gg]);
  assert.deepEqual(validateValues(fd, { [q.id]: "no" }), {});
  assert.ok(validateValues(fd, { [q.id]: "yes" })[g.id]);
  assert.equal(validateValues(fd, { [q.id]: "yes", [g.id]: "Anil" })[gg.id] !== undefined, true);
  assert.equal(isVisible(gg, { [q.id]: "no", [g.id]: "x" }, fd.fields), false);
  // sanitize drops answers to hidden fields
  assert.deepEqual(sanitizeValues(fd, { [q.id]: "no", [g.id]: "sneaky" }), { [q.id]: "no" });
  // disabled fields never validate or store
  const off = field({ type: "text", required: true, enabled: false });
  assert.deepEqual(validateValues(def([off]), {}), {});
});

test("sanitizeValues drops unknown keys (no mass assignment) and normalises phone", () => {
  const p = field({ type: "phone" });
  assert.deepEqual(sanitizeValues(def([p]), { [p.id]: " +91 98765 43210 ", injected: "x", __proto__: "y" } as any), { [p.id]: "9876543210" });
});

test("file metadata rules", () => {
  const f = field({ type: "file", accept: ["pdf", "png"], maxSizeMB: 1 });
  assert.equal(validateFileMeta(f, { name: "a.pdf", size: 1000, type: "application/pdf" }), null);
  assert.ok(validateFileMeta(f, { name: "a.exe", size: 1000, type: "application/x-msdownload" }));
  assert.ok(validateFileMeta(f, { name: "a.jpg", size: 1000, type: "image/jpeg" }), "jpg not accepted");
  assert.ok(validateFileMeta(f, { name: "a.pdf", size: 2 * 1024 * 1024, type: "application/pdf" }));
  assert.ok(validateFileMeta(f, { name: "a.pdf", size: 0, type: "application/pdf" }));
  assert.ok(validateFileMeta(f, { name: "a.pdf", size: 10, type: "image/png" }), "declared type must match extension");
  assert.ok(validateFileMeta(field({ type: "file", maxSizeMB: 50 }), { name: "a.pdf", size: 3 * 1024 * 1024, type: "application/pdf" }), "global 2 MB cap cannot be raised by a form");
});

test("form definition schema rejects bad builder output", () => {
  const ok = { slug: "my-form", title: "Hi", status: "draft", submitLabel: "Go", successMessage: "Ok", fields: [] };
  assert.ok(formDefSchema.safeParse(ok).success);
  assert.equal(formDefSchema.safeParse({ ...ok, slug: "Bad Slug" }).success, false);
  assert.equal(formDefSchema.safeParse({ ...ok, slug: "new" }).success, false);
  const s = blankField("select"); s.options = [];
  assert.equal(formDefSchema.safeParse({ ...ok, fields: [s] }).success, false, "dropdown without options");
  const a = blankField("text"), b = { ...blankField("text"), condition: { fieldId: "f_later", op: "filled" as const } };
  assert.equal(formDefSchema.safeParse({ ...ok, fields: [b, a] }).success, false, "condition must reference an earlier field");
  const dupe = blankField("select"); dupe.options = [{ label: "A", value: "x" }, { label: "B", value: "x" }];
  assert.equal(formDefSchema.safeParse({ ...ok, fields: [dupe] }).success, false);
  assert.equal(formDefSchema.safeParse({ ...ok, fields: [{ ...a, label: "" }] }).success, false);
  assert.equal(formDefSchema.safeParse({ ...ok, fields: [{ ...a, evil: 1 }] }).success, true, "unknown keys are stripped, not stored");
  assert.ok(!("evil" in (formDefSchema.parse({ ...ok, fields: [{ ...a, evil: 1 }] }).fields[0] as any)));
});

test("every shipped template is a valid form definition", () => {
  for (const t of FORM_TEMPLATES) {
    const d = buildTemplate(t.id);
    const r = formDefSchema.safeParse({ ...d, slug: "tpl-" + t.id });
    assert.ok(r.success, `${t.id}: ${r.success ? "" : JSON.stringify(r.error.issues[0])}`);
  }
});

// ------------------------------------------------------------------ server pipeline
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
const pdf = Buffer.from("%PDF-1.4\n" + "x".repeat(50));

test("sniffFileType checks magic bytes", () => {
  assert.equal(sniffFileType(png), "png");
  assert.equal(sniffFileType(pdf), "pdf");
  assert.equal(sniffFileType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])), "jpg");
  assert.equal(sniffFileType(Buffer.from("<script>alert(1)</script>")), null);
  assert.equal(sniffFileType(Buffer.from("MZ\x90\x00")), null);
});

async function publish(fields: FormField[], slug = "sub-form") {
  const r = await saveForm({ slug, title: "Sub", status: "published", submitLabel: "Go", successMessage: "Thanks", fields }, true);
  assert.ok(r.ok, JSON.stringify(r));
  return (r as any).form as FormDef;
}

test("save: create, duplicate slug refused, update bumps version, unpublished form is hidden from the public", async () => {
  const f = await publish([field({ type: "text" })]);
  assert.equal(f.version, 1);
  const dup = await saveForm({ ...f, fields: [] }, true);
  assert.equal(dup.ok === false && dup.status, 409);
  const up = await saveForm({ ...f, fields: [], title: "Renamed" }, false);
  assert.ok(up.ok && up.form.version === 2 && up.form.createdAt === f.createdAt);
  assert.equal((await saveForm({ ...f, slug: "ghost" }, false)).ok, false);
  await saveForm({ ...f, status: "draft" }, false);
  assert.equal(await getForm("sub-form", { publishedOnly: true }), null);
  assert.ok(await getForm("sub-form"));
});

test("submit: server-side validation, success storage, duplicate blocking, hidden-field and unknown-key stripping", async () => {
  const name = field({ type: "text", required: true, minLength: 2 });
  const phone = field({ type: "phone", required: true });
  const d = await publish([name, phone]);
  const bad = await submitForm(d, { [name.id]: "A", [phone.id]: "123" }, [], { ipHash: "x" });
  assert.ok(!bad.ok && bad.status === 422 && bad.fieldErrors![name.id] && bad.fieldErrors![phone.id]);
  assert.equal((await listSubmissions(d.slug)).length, 0, "nothing stored for an invalid submission");

  const vals = { [name.id]: " Riya ", [phone.id]: "98765 43210", admin: true };
  const ok = await submitForm(d, vals, [], { ipHash: "x" });
  assert.ok(ok.ok);
  const [row] = await listSubmissions(d.slug);
  assert.deepEqual(row.values, { [name.id]: "Riya", [phone.id]: "9876543210" });
  assert.equal(row.labels[name.id], "L");

  const again = await submitForm(d, vals, [], { ipHash: "x" });
  assert.ok(!again.ok && again.status === 409 && again.duplicate);
  assert.equal((await listSubmissions(d.slug)).length, 1);
  // a different answer is not a duplicate
  assert.ok((await submitForm(d, { ...vals, [name.id]: "Other" }, [], { ipHash: "x" })).ok);

  assert.equal((await submitForm(d, null, [], { ipHash: "x" })).ok, false);
  assert.equal((await submitForm(d, [1, 2], [], { ipHash: "x" })).ok, false);
});

test("submit: uploads are validated by real content, type allow-list, count and size", async () => {
  const doc = field({ type: "file", required: true, accept: ["pdf", "png"], maxFiles: 1, maxSizeMB: 1 });
  const d = await publish([doc], "upl");
  const need = await submitForm(d, {}, [], { ipHash: "x" });
  assert.ok(!need.ok && need.fieldErrors![doc.id]);

  const fake = await submitForm(d, {}, [{ fieldId: doc.id, name: "evil.pdf", type: "application/pdf", data: Buffer.from("<script>alert(1)</script>") }], { ipHash: "x" });
  assert.ok(!fake.ok && fake.fieldErrors![doc.id], "HTML renamed to .pdf is rejected");
  const wrongKind = await submitForm(d, {}, [{ fieldId: doc.id, name: "x.png", type: "image/png", data: pdf }], { ipHash: "x" });
  assert.ok(!wrongKind.ok, "PDF bytes under a .png name are rejected");
  const notAccepted = await submitForm(d, {}, [{ fieldId: doc.id, name: "x.jpg", type: "image/jpeg", data: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]) }], { ipHash: "x" });
  assert.ok(!notAccepted.ok, "jpg not in this field's allow-list");
  const tooMany = await submitForm(d, {}, [{ fieldId: doc.id, name: "a.png", type: "image/png", data: png }, { fieldId: doc.id, name: "b.png", type: "image/png", data: Buffer.concat([png, Buffer.from("1")]) }], { ipHash: "x" });
  assert.ok(!tooMany.ok);
  const big = await submitForm(d, {}, [{ fieldId: doc.id, name: "a.pdf", type: "application/pdf", data: Buffer.concat([pdf, Buffer.alloc(1.5 * 1024 * 1024)]) }], { ipHash: "x" });
  assert.ok(!big.ok);
  const unknownField = await submitForm(d, {}, [{ fieldId: "nope", name: "a.png", type: "image/png", data: png }], { ipHash: "x" });
  assert.ok(!unknownField.ok && unknownField.status === 400);

  const good = await submitForm(d, {}, [{ fieldId: doc.id, name: "../../my id.png", type: "image/png", data: png }], { ipHash: "x" });
  assert.ok(good.ok);
  const [row] = await listSubmissions("upl");
  assert.equal(row.files.length, 1);
  assert.ok(!/[\\/]/.test(row.files[0].name), "stored name is sanitised");
});

test("a file field hidden by a condition cannot receive files", async () => {
  const q = field({ type: "checkbox" });
  const doc = field({ type: "file", condition: { fieldId: q.id, op: "equals", value: "true" } });
  const d = await publish([q, doc], "cond-upl");
  const r = await submitForm(d, {}, [{ fieldId: doc.id, name: "a.png", type: "image/png", data: png }], { ipHash: "x" });
  assert.ok(!r.ok && r.status === 400);
});

test("dynamic option sets come from live data and are enforced on submit", async () => {
  const area = field({ type: "select", required: true, optionsSource: "areas" });
  const d = await publish([area], "live");
  const sets = await resolveOptionSets(d);
  assert.ok(sets.areas && sets.areas.length > 0);
  const good = sets.areas![0].value;
  assert.ok((await submitForm(d, { [area.id]: good }, [], { ipHash: "x" })).ok);
  const bad = await submitForm(d, { [area.id]: "not-a-real-area" }, [], { ipHash: "x" });
  assert.ok(!bad.ok && bad.fieldErrors![area.id]);
});

test("deleting a form removes its submissions", async () => {
  const t = field({ type: "text", required: true });
  const d = await publish([t], "gone");
  await submitForm(d, { [t.id]: "hello" }, [], { ipHash: "x" });
  assert.ok(await deleteForm("gone"));
  assert.equal((await listSubmissions("gone")).length, 0);
  assert.equal(await getForm("gone"), null);
});
