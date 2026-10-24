import { z } from "zod";

/**
 * Dynamic form definitions and validation. Pure TypeScript with no server-only imports, so the SAME rules run in the
 * browser (inline feedback, builder preview) and on the server (the only place that is trusted).
 */
export const FIELD_TYPES = [
  "text", "textarea", "email", "phone", "number", "date", "select", "radio", "checkbox", "checkboxes", "file", "section",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_META: Record<FieldType, { label: string; hint: string; hasOptions?: boolean; input: boolean }> = {
  text: { label: "Short text", hint: "One line, e.g. a name", input: true },
  textarea: { label: "Long text", hint: "Several lines, e.g. a message", input: true },
  email: { label: "Email", hint: "Checked for a valid address", input: true },
  phone: { label: "Phone number", hint: "10-digit Indian mobile", input: true },
  number: { label: "Number", hint: "With optional min / max", input: true },
  date: { label: "Date", hint: "Calendar picker", input: true },
  select: { label: "Dropdown", hint: "Pick one from a list", hasOptions: true, input: true },
  radio: { label: "Radio buttons", hint: "Pick one, all options visible", hasOptions: true, input: true },
  checkbox: { label: "Single checkbox", hint: "Yes / no or consent", input: true },
  checkboxes: { label: "Multiple choice", hint: "Pick several", hasOptions: true, input: true },
  file: { label: "File upload", hint: "Drag & drop or browse", input: true },
  section: { label: "Section heading", hint: "Group related fields", input: false },
};

export const OPTION_SOURCES = ["areas", "properties", "roomTypes"] as const;
export type OptionSource = (typeof OPTION_SOURCES)[number];
export const OPTION_SOURCE_LABEL: Record<OptionSource, string> = {
  areas: "Localities (live from Areas)",
  properties: "Properties (live from Properties)",
  roomTypes: "Room types",
};

export interface FieldOption { label: string; value: string }
export interface FieldCondition { fieldId: string; op: "equals" | "notEquals" | "filled" | "empty"; value?: string }

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  enabled: boolean;
  defaultValue?: string;
  options?: FieldOption[];
  optionsSource?: OptionSource;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  dateRule?: "any" | "future" | "past";
  maxChoices?: number;
  accept?: string[]; // file extensions without dot
  maxSizeMB?: number;
  maxFiles?: number;
  condition?: FieldCondition | null;
}

export interface FormDef {
  slug: string;
  title: string;
  description?: string;
  status: "draft" | "published";
  submitLabel: string;
  successMessage: string;
  consentText?: string;
  fields: FormField[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type FormValues = Record<string, string | boolean | string[] | undefined>;
export type OptionSets = Partial<Record<OptionSource, FieldOption[]>>;

export const FILE_TYPES: Record<string, { mime: string[]; label: string }> = {
  pdf: { mime: ["application/pdf"], label: "PDF" },
  jpg: { mime: ["image/jpeg"], label: "JPG" },
  jpeg: { mime: ["image/jpeg"], label: "JPEG" },
  png: { mime: ["image/png"], label: "PNG" },
  webp: { mime: ["image/webp"], label: "WebP" },
};
export const MAX_FILE_MB = 2;
export const MAX_FILES_PER_FIELD = 3;

const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const normalizePhone = (v: string) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");

export function optionsFor(f: FormField, sets: OptionSets): FieldOption[] {
  if (f.optionsSource) return sets[f.optionsSource] || [];
  return f.options || [];
}

export function isFilled(v: unknown) {
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "boolean") return v;
  return typeof v === "string" && v.trim() !== "";
}

/** A field is shown when it is enabled and its condition (if any) is met. */
export function isVisible(f: FormField, values: FormValues, all: FormField[]): boolean {
  if (!f.enabled) return false;
  const c = f.condition;
  if (!c) return true;
  const src = all.find((x) => x.id === c.fieldId);
  if (!src || !isVisible(src, values, all)) return false; // hidden parents hide their children
  const v = values[c.fieldId];
  switch (c.op) {
    case "filled": return isFilled(v);
    case "empty": return !isFilled(v);
    case "equals": return Array.isArray(v) ? v.includes(c.value || "") : String(v ?? "") === (c.value ?? "");
    case "notEquals": return Array.isArray(v) ? !v.includes(c.value || "") : String(v ?? "") !== (c.value ?? "");
  }
}

export interface FileMeta { name: string; size: number; type: string }

export function validateFileMeta(f: FormField, file: FileMeta): string | null {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const allowed = (f.accept && f.accept.length ? f.accept : Object.keys(FILE_TYPES)).map((x) => x.toLowerCase());
  if (!allowed.includes(ext) || !FILE_TYPES[ext]) return `Allowed file types: ${allowed.map((x) => x.toUpperCase()).join(", ")}.`;
  const max = Math.min(f.maxSizeMB || MAX_FILE_MB, MAX_FILE_MB);
  if (file.size > max * 1024 * 1024) return `Each file must be ${max} MB or smaller.`;
  if (file.size === 0) return "This file is empty.";
  if (file.type && !FILE_TYPES[ext].mime.includes(file.type)) return "The file type does not match its extension.";
  return null;
}

function todayISO(now = new Date()) {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export type FieldErrors = Record<string, string>;

/**
 * Validates visible fields only. `files` maps field id -> selected files (metadata only; contents are checked
 * separately on the server). Returns {} when everything is valid.
 */
export function validateValues(def: Pick<FormDef, "fields">, values: FormValues, sets: OptionSets = {}, files: Record<string, FileMeta[]> = {}, now = new Date()): FieldErrors {
  const errors: FieldErrors = {};
  for (const f of def.fields) {
    if (f.type === "section" || !isVisible(f, values, def.fields)) continue;
    const raw = values[f.id];
    const str = typeof raw === "string" ? raw.trim() : "";
    const req = (msg = "This field is required.") => { errors[f.id] = msg; };

    switch (f.type) {
      case "text":
      case "textarea": {
        const max = f.maxLength ?? (f.type === "text" ? 200 : 2000);
        if (!str) { if (f.required) req(); break; }
        if (f.minLength && str.length < f.minLength) errors[f.id] = `Enter at least ${f.minLength} characters.`;
        else if (str.length > max) errors[f.id] = `Use at most ${max} characters.`;
        break;
      }
      case "email":
        if (!str) { if (f.required) req("Enter your email address."); }
        else if (str.length > 254 || !EMAIL_RE.test(str)) errors[f.id] = "Enter a valid email address, like name@example.com.";
        break;
      case "phone":
        if (!str) { if (f.required) req("Enter your mobile number."); }
        else if (!PHONE_RE.test(normalizePhone(str))) errors[f.id] = "Enter a valid 10-digit mobile number.";
        break;
      case "number": {
        if (!str) { if (f.required) req(); break; }
        const n = Number(str);
        if (!Number.isFinite(n)) errors[f.id] = "Enter a number.";
        else if (f.min !== undefined && n < f.min) errors[f.id] = `Must be ${f.min} or more.`;
        else if (f.max !== undefined && n > f.max) errors[f.id] = `Must be ${f.max} or less.`;
        break;
      }
      case "date": {
        if (!str) { if (f.required) req("Choose a date."); break; }
        const d = new Date(str + "T00:00:00Z");
        if (!DATE_RE.test(str) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== str) { errors[f.id] = "Enter a valid date."; break; }
        const t = todayISO(now);
        if (f.dateRule === "future" && str < t) errors[f.id] = "Choose today or a future date.";
        else if (f.dateRule === "past" && str > t) errors[f.id] = "Choose today or an earlier date.";
        break;
      }
      case "select":
      case "radio": {
        if (!str) { if (f.required) req("Please choose an option."); break; }
        if (!optionsFor(f, sets).some((o) => o.value === str)) errors[f.id] = "Please choose one of the listed options.";
        break;
      }
      case "checkbox":
        if (f.required && raw !== true) req("Please tick this box to continue.");
        break;
      case "checkboxes": {
        const arr = Array.isArray(raw) ? raw : [];
        if (!arr.length) { if (f.required) req("Choose at least one option."); break; }
        const allowed = new Set(optionsFor(f, sets).map((o) => o.value));
        if (arr.some((v) => !allowed.has(v))) errors[f.id] = "Please choose only from the listed options.";
        else if (f.maxChoices && arr.length > f.maxChoices) errors[f.id] = `Choose at most ${f.maxChoices}.`;
        break;
      }
      case "file": {
        const list = files[f.id] || [];
        if (!list.length) { if (f.required) req("Please attach a file."); break; }
        const maxFiles = Math.min(f.maxFiles || 1, MAX_FILES_PER_FIELD);
        if (list.length > maxFiles) { errors[f.id] = `Attach at most ${maxFiles} file${maxFiles > 1 ? "s" : ""}.`; break; }
        for (const file of list) { const e = validateFileMeta(f, file); if (e) { errors[f.id] = `${file.name}: ${e}`; break; } }
        break;
      }
    }
  }
  return errors;
}

/** Clean values to only visible, known fields, trimmed. Unknown keys are dropped (no mass assignment). */
export function sanitizeValues(def: Pick<FormDef, "fields">, values: FormValues): FormValues {
  const out: FormValues = {};
  for (const f of def.fields) {
    if (f.type === "section" || f.type === "file" || !isVisible(f, values, def.fields)) continue;
    const v = values[f.id];
    if (f.type === "checkbox") out[f.id] = v === true;
    else if (f.type === "checkboxes") out[f.id] = Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
    else if (typeof v === "string" && v.trim()) out[f.id] = f.type === "phone" ? normalizePhone(v.trim()) : v.trim();
  }
  return out;
}

// ---------------------------------------------------------------- admin-side definition schema
const opt = z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(80) });
const cond = z.object({
  fieldId: z.string().min(1).max(40),
  op: z.enum(["equals", "notEquals", "filled", "empty"]),
  value: z.string().max(80).optional(),
});

export const fieldSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]{2,40}$/),
  type: z.enum(FIELD_TYPES),
  label: z.string().trim().min(1, "Every field needs a label").max(120),
  placeholder: z.string().trim().max(120).optional(),
  helpText: z.string().trim().max(240).optional(),
  required: z.boolean(),
  enabled: z.boolean(),
  defaultValue: z.string().max(200).optional(),
  options: z.array(opt).max(40).optional(),
  optionsSource: z.enum(OPTION_SOURCES).optional(),
  minLength: z.number().int().min(0).max(2000).optional(),
  maxLength: z.number().int().min(1).max(2000).optional(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  dateRule: z.enum(["any", "future", "past"]).optional(),
  maxChoices: z.number().int().min(1).max(40).optional(),
  accept: z.array(z.enum(["pdf", "jpg", "jpeg", "png", "webp"])).max(5).optional(),
  maxSizeMB: z.number().min(0.1).max(MAX_FILE_MB).optional(),
  maxFiles: z.number().int().min(1).max(MAX_FILES_PER_FIELD).optional(),
  condition: cond.nullable().optional(),
});

export const formDefSchema = z
  .object({
    slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes").refine((v) => !["new", "files"].includes(v), "This address is reserved"),
    title: z.string().trim().min(2, "Give the form a title").max(120),
    description: z.string().trim().max(500).optional(),
    status: z.enum(["draft", "published"]),
    submitLabel: z.string().trim().min(1).max(40),
    successMessage: z.string().trim().min(1).max(300),
    consentText: z.string().trim().max(300).optional(),
    fields: z.array(fieldSchema).max(60),
  })
  .superRefine((d, ctx) => {
    const seen = new Set<string>();
    d.fields.forEach((f, i) => {
      if (seen.has(f.id)) ctx.addIssue({ code: "custom", path: ["fields", i, "id"], message: "Duplicate field id" });
      const needsOptions = FIELD_META[f.type].hasOptions;
      if (needsOptions && !f.optionsSource && !(f.options && f.options.length >= 1)) ctx.addIssue({ code: "custom", path: ["fields", i, "options"], message: `"${f.label}" needs at least one option` });
      if (f.min !== undefined && f.max !== undefined && f.min > f.max) ctx.addIssue({ code: "custom", path: ["fields", i, "min"], message: `"${f.label}": minimum is above maximum` });
      if (f.minLength !== undefined && f.maxLength !== undefined && f.minLength > f.maxLength) ctx.addIssue({ code: "custom", path: ["fields", i, "minLength"], message: `"${f.label}": min length is above max length` });
      if (f.condition && !seen.has(f.condition.fieldId)) ctx.addIssue({ code: "custom", path: ["fields", i, "condition"], message: `"${f.label}": a condition can only depend on a field placed above it` });
      if (f.options) {
        const vals = new Set<string>();
        for (const o of f.options) { if (vals.has(o.value)) ctx.addIssue({ code: "custom", path: ["fields", i, "options"], message: `"${f.label}" has a repeated option value "${o.value}"` }); vals.add(o.value); }
      }
      seen.add(f.id);
    });
  });
export type FormDefInput = z.infer<typeof formDefSchema>;

export const newFieldId = () => `f_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

export function blankField(type: FieldType): FormField {
  const m = FIELD_META[type];
  const base: FormField = { id: newFieldId(), type, label: m.label, required: false, enabled: true };
  if (m.hasOptions) base.options = [{ label: "Option 1", value: "option-1" }, { label: "Option 2", value: "option-2" }];
  if (type === "file") { base.accept = ["pdf", "jpg", "png"]; base.maxSizeMB = 2; base.maxFiles = 1; }
  if (type === "section") base.label = "New section";
  if (type === "checkbox") base.label = "I agree";
  return base;
}
