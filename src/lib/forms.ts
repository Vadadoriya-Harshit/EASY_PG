import crypto from "crypto";
import { collection, DuplicateKeyError } from "./db";
import { listAreas, listProperties } from "./repo";
import { ROOM_LABEL } from "./site";
import {
  FILE_TYPES, MAX_FILES_PER_FIELD, MAX_FILE_MB, formDefSchema, isVisible, sanitizeValues, validateFileMeta, validateValues,
  type FieldErrors, type FileMeta, type FormDef, type FormField, type FormValues, type OptionSets,
} from "./form-schema";

const forms = () => collection("forms", { unique: ["slug"] });
const submissions = () => collection("form_submissions", { unique: ["id"], indexes: ["formSlug", "createdAt"] });
const files = () => collection("form_files", { unique: ["id"], indexes: ["submissionId"] });

export async function listForms(): Promise<(FormDef & { submissionCount: number })[]> {
  const rows = (await forms().find({}, { sort: { updatedAt: -1 } })) as FormDef[];
  const out = [];
  for (const f of rows) out.push({ ...f, submissionCount: await submissions().count({ formSlug: f.slug }) });
  return out;
}

export async function getForm(slug: string, opts: { publishedOnly?: boolean } = {}): Promise<FormDef | null> {
  const f = (await forms().findOne({ slug })) as FormDef | null;
  if (!f) return null;
  if (opts.publishedOnly && f.status !== "published") return null;
  return f;
}

export async function saveForm(input: unknown, isNew: boolean): Promise<{ ok: true; form: FormDef } | { ok: false; error: string; status: number }> {
  const parsed = formDefSchema.safeParse(input);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { ok: false, error: `${i.path.join(".") || "form"}: ${i.message}`, status: 400 };
  }
  const d = parsed.data;
  const existing = (await forms().findOne({ slug: d.slug })) as FormDef | null;
  if (isNew && existing) return { ok: false, error: "A form with this web address already exists.", status: 409 };
  if (!isNew && !existing) return { ok: false, error: "Form not found.", status: 404 };
  const now = new Date().toISOString();
  const form: FormDef = {
    ...(d as unknown as FormDef),
    version: (existing?.version || 0) + 1,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  if (existing) await forms().updateOne({ slug: d.slug }, { $set: form as any });
  else {
    try { await forms().insertOne(form as any); }
    catch (e) { if (e instanceof DuplicateKeyError) return { ok: false, error: "A form with this web address already exists.", status: 409 }; throw e; }
  }
  return { ok: true, form };
}

export async function deleteForm(slug: string) {
  const subs = (await submissions().find({ formSlug: slug })) as any[];
  for (const s of subs) await files().deleteMany({ submissionId: s.id });
  await submissions().deleteMany({ formSlug: slug });
  return (await forms().deleteOne({ slug })) > 0;
}

/** Live option lists ("dynamic options"): always read from the current Areas / Properties / room types. */
export async function resolveOptionSets(def: Pick<FormDef, "fields">): Promise<OptionSets> {
  const sets: OptionSets = {};
  const used = new Set(def.fields.map((f) => f.optionsSource).filter(Boolean));
  if (used.has("areas")) sets.areas = (await listAreas()).map((a) => ({ label: a.name, value: a.slug }));
  if (used.has("properties")) sets.properties = (await listProperties()).map((p) => ({ label: p.name, value: p.slug }));
  if (used.has("roomTypes")) sets.roomTypes = Object.entries(ROOM_LABEL).map(([value, label]) => ({ value, label }));
  return sets;
}

// ---------------------------------------------------------------- uploads
/** Checks the real bytes, not just the name or the browser-declared type. */
export function sniffFileType(buf: Buffer): "pdf" | "jpg" | "png" | "webp" | null {
  if (buf.length >= 5 && buf.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  return null;
}

export interface IncomingFile { fieldId: string; name: string; type: string; data: Buffer }

const safeName = (n: string) => n.replace(/[^\w.\- ]+/g, "_").slice(0, 80) || "file";

export type SubmitResult =
  | { ok: true; id: string }
  | { ok: false; status: number; error: string; fieldErrors?: FieldErrors; duplicate?: boolean };

export async function submitForm(def: FormDef, rawValues: unknown, incoming: IncomingFile[], meta: { ipHash: string }): Promise<SubmitResult> {
  if (!rawValues || typeof rawValues !== "object" || Array.isArray(rawValues)) return { ok: false, status: 400, error: "Invalid submission." };
  const values = rawValues as FormValues;
  const sets = await resolveOptionSets(def);
  const fieldById = new Map(def.fields.map((f) => [f.id, f]));

  // files: only for visible file fields, checked by name, size, declared type AND real content
  const fileMeta: Record<string, FileMeta[]> = {};
  const accepted: IncomingFile[] = [];
  const fieldErrors: FieldErrors = {};
  for (const f of incoming) {
    const field = fieldById.get(f.fieldId);
    if (!field || field.type !== "file" || !isVisible(field, values, def.fields)) return { ok: false, status: 400, error: "Unexpected file in submission." };
    (fileMeta[f.fieldId] ||= []).push({ name: f.name, size: f.data.length, type: f.type });
    const sniff = sniffFileType(f.data);
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    const norm = (e: string) => (e === "jpeg" ? "jpg" : e);
    if (!sniff || norm(ext) !== sniff) fieldErrors[f.fieldId] = `${f.name}: the file content does not match its type.`;
    else if (field.accept?.length && !field.accept.map(norm).includes(sniff)) fieldErrors[f.fieldId] = `${f.name}: this file type is not accepted here.`;
    accepted.push(f);
  }

  const errors = { ...validateValues(def, values, sets, fileMeta), ...fieldErrors };
  if (Object.keys(errors).length) return { ok: false, status: 422, error: "Please fix the highlighted fields.", fieldErrors: errors };

  const clean = sanitizeValues(def, values);
  const fp = crypto
    .createHash("sha256")
    .update(JSON.stringify([def.slug, clean, accepted.map((a) => crypto.createHash("sha256").update(a.data).digest("hex"))]))
    .digest("hex");
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const dup = await submissions().findOne({ formSlug: def.slug, fp, createdAt: { $gte: since } });
  if (dup) return { ok: false, status: 409, duplicate: true, error: "We already received this exact submission a moment ago. No need to send it again." };

  const id = `sub_${crypto.randomBytes(8).toString("hex")}`;
  const stored = [];
  for (const f of accepted) {
    const fid = `file_${crypto.randomBytes(8).toString("hex")}`;
    await files().insertOne({ id: fid, submissionId: id, fieldId: f.fieldId, name: safeName(f.name), type: FILE_TYPES[sniffFileType(f.data)!]?.mime[0] || "application/octet-stream", size: f.data.length, data: f.data.toString("base64"), createdAt: new Date().toISOString() });
    stored.push({ id: fid, fieldId: f.fieldId, name: safeName(f.name), size: f.data.length });
  }
  const labels: Record<string, string> = {};
  for (const f of def.fields) labels[f.id] = f.label;
  await submissions().insertOne({
    id, formSlug: def.slug, formVersion: def.version, values: clean, labels, files: stored, fp, ipHash: meta.ipHash, createdAt: new Date().toISOString(),
  });
  return { ok: true, id };
}

export async function listSubmissions(slug: string, limit = 200) {
  return (await submissions().find({ formSlug: slug }, { sort: { createdAt: -1 }, limit })) as any[];
}

export async function deleteSubmission(slug: string, id: string) {
  await files().deleteMany({ submissionId: id });
  return (await submissions().deleteOne({ id, formSlug: slug })) > 0;
}

export async function getStoredFile(id: string) {
  const f = (await files().findOne({ id })) as any;
  if (!f) return null;
  return { name: f.name as string, type: f.type as string, buffer: Buffer.from(f.data, "base64") };
}

export const UPLOAD_LIMITS = { maxFileMB: MAX_FILE_MB, maxFilesPerField: MAX_FILES_PER_FIELD };
export { validateFileMeta };
export type { FormField };
