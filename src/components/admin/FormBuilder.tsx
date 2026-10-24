"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle, AlignLeft, AtSign, Calendar, CheckSquare, ChevronDown, Copy, ExternalLink, EyeOff, FileUp, Hash, Heading, ListChecks,
  ListOrdered, Phone, Plus, Save, Trash2, Type, Download, CircleDot, X,
} from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import DynamicForm from "@/components/forms/DynamicForm";
import { SortableList, SortableItem, ReorderControls } from "./Sortable";
import { cn, slugify } from "@/lib/utils";
import {
  FIELD_META, FIELD_TYPES, FILE_TYPES, MAX_FILES_PER_FIELD, MAX_FILE_MB, OPTION_SOURCES, OPTION_SOURCE_LABEL, blankField, formDefSchema,
  optionsFor, type FieldType, type FormDef, type FormField, type OptionSets,
} from "@/lib/form-schema";

const ICONS: Record<FieldType, any> = {
  text: Type, textarea: AlignLeft, email: AtSign, phone: Phone, number: Hash, date: Calendar, select: ChevronDown,
  radio: CircleDot, checkbox: CheckSquare, checkboxes: ListChecks, file: FileUp, section: Heading,
};

type Tab = "build" | "preview" | "responses";

interface Props { initial: FormDef; optionSets: OptionSets; isNew: boolean }

export default function FormBuilder({ initial, optionSets, isNew: isNewProp }: Props) {
  const router = useRouter();
  // flips to false the moment the first save succeeds, so a second click never tries to "create" again
  const [isNew, setIsNew] = useState(isNewProp);
  const [form, setForm] = useState<FormDef>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [sets, setSets] = useState<OptionSets>(optionSets);
  const [selected, setSelected] = useState<string | null>(initial.fields[0]?.id ?? null);
  const [tab, setTab] = useState<Tab>("build");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [previewKey, setPreviewKey] = useState(0);

  const dirty = JSON.stringify(form) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const patch = (p: Partial<FormDef>) => setForm((f) => ({ ...f, ...p }));
  const setField = (id: string, p: Partial<FormField>) => setForm((f) => ({ ...f, fields: f.fields.map((x) => (x.id === id ? { ...x, ...p } : x)) }));

  const addField = (type: FieldType) => {
    const nf = blankField(type);
    setForm((f) => ({ ...f, fields: [...f.fields, nf] }));
    setSelected(nf.id);
    setTimeout(() => document.getElementById(`field-${nf.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
  };

  const duplicate = (id: string) =>
    setForm((f) => {
      const i = f.fields.findIndex((x) => x.id === id);
      const copy = { ...structuredClone(f.fields[i]), id: blankField("text").id, label: `${f.fields[i].label} (copy)` };
      const fields = [...f.fields];
      fields.splice(i + 1, 0, copy);
      setSelected(copy.id);
      return { ...f, fields };
    });

  const remove = (id: string) => {
    const field = form.fields.find((x) => x.id === id)!;
    const dependants = form.fields.filter((x) => x.condition?.fieldId === id);
    if (!confirm(`Delete "${field.label}"?${dependants.length ? ` ${dependants.length} field(s) show only when this one has a value; their conditions will be cleared.` : ""}`)) return;
    setForm((f) => ({ ...f, fields: f.fields.filter((x) => x.id !== id).map((x) => (x.condition?.fieldId === id ? { ...x, condition: null } : x)) }));
    if (selected === id) setSelected(null);
  };

  const save = async (status?: FormDef["status"]) => {
    if (saving) return;
    setErr(""); setOk("");
    const draft = { ...form, status: status || form.status };
    const parsed = formDefSchema.safeParse(draft);
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      setErr(`${i.message}`);
      const fi = i.path[0] === "fields" ? form.fields[Number(i.path[1])] : null;
      if (fi) { setSelected(fi.id); setTab("build"); }
      return;
    }
    if (isNew && !form.slug) { setErr("Choose a web address for the form."); return; }
    setSaving(true);
    try {
      const res = await fetch(isNew ? "/api/admin/forms" : `/api/admin/forms/${form.slug}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      if (!res.ok) throw new Error(data.error || "Could not save the form.");
      setForm(data.form);
      setSaved(JSON.stringify(data.form));
      if (data.optionSets) setSets(data.optionSets);
      setOk(data.form.status === "published" ? "Saved and published. The live form is updated." : "Saved as a draft. Visitors can not see it yet.");
      if (isNew) {
        setIsNew(false);
        router.replace(`/admin/forms/${data.form.slug}`);
      }
    } catch (e: any) {
      setErr(e?.message || "Could not save the form.");
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!confirm(`Delete the form "${form.title}" and ALL of its responses? This can not be undone.`)) return;
    const res = await fetch(`/api/admin/forms/${form.slug}`, { method: "DELETE" });
    if (res.ok) router.replace("/admin/forms");
    else setErr((await res.json().catch(() => ({}))).error || "Could not delete.");
  };

  const previewDef = useMemo(() => ({ ...form, status: "published" as const }), [form]);

  return (
    <div className="space-y-5 pb-20">
      {/* header */}
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Link href="/admin/forms" className="text-xs font-semibold text-mute hover:text-ink">← All forms</Link>
          <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{form.title || "Untitled form"}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-mute">
            <span className={cn("rounded-full px-2.5 py-0.5 font-bold", form.status === "published" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300")}>{form.status === "published" ? "Published" : "Draft"}</span>
            {dirty ? <span className="font-semibold text-amber-600">● Unsaved changes</span> : <span>All changes saved</span>}
            {!isNew && form.status === "published" && <Link href={`/forms/${form.slug}`} target="_blank" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">/forms/{form.slug} <ExternalLink size={11} /></Link>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && <button type="button" onClick={del} className="btn btn-ghost min-h-[44px] gap-1.5 border border-red-500/20 text-xs text-red-500"><Trash2 size={14} /> Delete</button>}
          {form.status === "published"
            ? <button type="button" onClick={() => save("draft")} disabled={saving} className="btn btn-ghost min-h-[44px] border border-ink/15 text-xs">Unpublish</button>
            : <button type="button" onClick={() => save("published")} disabled={saving || (isNew && !form.slug)} className="btn btn-ghost min-h-[44px] border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300">Save & publish</button>}
          <button type="button" onClick={() => save()} disabled={saving || !dirty} className="btn btn-primary min-h-[44px] gap-2 px-5 text-xs">
            {saving ? <><ProgressRing size={16} label="Saving" /> Saving…</> : <><Save size={15} /> Save</>}
          </button>
        </div>
      </div>

      {err && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold text-red-700 dark:text-red-300"><AlertCircle size={16} className="mt-0.5 shrink-0" />{err}</div>}
      {ok && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{ok}</div>}

      {/* tabs */}
      <div role="tablist" aria-label="Form builder" className="flex gap-1 rounded-xl bg-ink/5 p-1 sm:w-fit">
        {([["build", "Build"], ["preview", "Live preview"], ["responses", "Responses"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} disabled={k === "responses" && isNew}
            className={cn("min-h-[40px] flex-1 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-40 sm:flex-none", tab === k ? "bg-surface text-ink shadow-sm" : "text-mute hover:text-ink")}>{l}</button>
        ))}
      </div>

      {tab === "build" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            {/* settings */}
            <section className="card space-y-4 border-ink/10 p-5" aria-labelledby="fs-title">
              <h2 id="fs-title" className="text-sm font-bold text-ink">Form settings</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Labeled label="Form title" required><input className="input text-sm" value={form.title} maxLength={120} onChange={(e) => { patch({ title: e.target.value }); if (isNew && (!form.slug || form.slug === slugify(form.title))) patch({ title: e.target.value, slug: slugify(e.target.value).slice(0, 60) }); }} /></Labeled>
                <Labeled label="Web address" required hint={isNew ? "Letters, numbers and dashes. Cannot be changed later." : "Cannot be changed after creation."}>
                  <div className="flex items-center gap-1 text-sm"><span className="text-mute">/forms/</span><input className="input flex-1 font-mono text-sm" value={form.slug} readOnly={!isNew} maxLength={60} onChange={(e) => patch({ slug: slugify(e.target.value).slice(0, 60) })} /></div>
                </Labeled>
                <Labeled label="Intro text" hint="Shown above the form" className="sm:col-span-2"><textarea className="input text-sm" rows={2} maxLength={500} value={form.description || ""} onChange={(e) => patch({ description: e.target.value })} /></Labeled>
                <Labeled label="Submit button text" required><input className="input text-sm" maxLength={40} value={form.submitLabel} onChange={(e) => patch({ submitLabel: e.target.value })} /></Labeled>
                <Labeled label="Message after sending" required><input className="input text-sm" maxLength={300} value={form.successMessage} onChange={(e) => patch({ successMessage: e.target.value })} /></Labeled>
                <Labeled label="Consent / privacy note" hint="Shown above the submit button (optional)" className="sm:col-span-2"><input className="input text-sm" maxLength={300} value={form.consentText || ""} onChange={(e) => patch({ consentText: e.target.value })} /></Labeled>
              </div>
            </section>

            {/* palette */}
            <section className="card border-ink/10 p-5" aria-labelledby="fp-title">
              <h2 id="fp-title" className="text-sm font-bold text-ink">Add a field</h2>
              <p className="mb-3 text-xs text-mute">Choose a type. It is added at the end; drag it into place afterwards.</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {FIELD_TYPES.map((t) => {
                  const Icon = ICONS[t];
                  return (
                    <button key={t} type="button" onClick={() => addField(t)} className="group flex min-h-[56px] items-center gap-2.5 rounded-xl border border-ink/10 bg-surface px-3 py-2 text-left transition hover:border-brand/50 hover:bg-brand/5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white"><Icon size={17} /></span>
                      <span className="min-w-0"><span className="block truncate text-xs font-bold text-ink">{FIELD_META[t].label}</span><span className="block truncate text-[10px] text-mute">{FIELD_META[t].hint}</span></span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* fields */}
            <section aria-labelledby="ff-title" className="space-y-3">
              <h2 id="ff-title" className="text-sm font-bold text-ink">Fields ({form.fields.length})</h2>
              {form.fields.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-ink/15 p-10 text-center text-sm text-mute">No fields yet. Pick a field type above to get started.</div>
              ) : (
                <SortableList label="form fields" items={form.fields} onChange={(fields) => setForm((f) => ({ ...f, fields }))} itemLabel={(x) => x.label} className="space-y-2.5">
                  {form.fields.map((f, i) => {
                    const Icon = ICONS[f.type];
                    const open = selected === f.id;
                    return (
                      <SortableItem key={f.id} index={i} className={cn("rounded-2xl border bg-surface", open ? "border-brand/50 shadow-md" : "border-ink/10", !f.enabled && "opacity-70")}>
                        <div id={`field-${f.id}`} className="flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3">
                          <ReorderControls />
                          <button type="button" onClick={() => setSelected(open ? null : f.id)} aria-expanded={open} className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 text-left">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Icon size={15} /></span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink">{f.label || "(no label)"}</span>
                              <span className="flex flex-wrap items-center gap-1.5 text-[10px] text-mute">
                                {FIELD_META[f.type].label}
                                {FIELD_META[f.type].input && <span className={cn("rounded px-1.5 py-px font-bold", f.required ? "bg-red-500/10 text-red-600" : "bg-ink/5")}>{f.required ? "Required" : "Optional"}</span>}
                                {f.condition && <span className="rounded bg-accent/10 px-1.5 py-px font-bold text-accent">Conditional</span>}
                                {!f.enabled && <span className="inline-flex items-center gap-0.5"><EyeOff size={10} /> Hidden</span>}
                              </span>
                            </span>
                            <ChevronDown size={16} className={cn("shrink-0 text-mute transition", open && "rotate-180")} />
                          </button>
                          <button type="button" role="switch" aria-checked={f.enabled} aria-label={`${f.enabled ? "Disable" : "Enable"} ${f.label}`} onClick={() => setField(f.id, { enabled: !f.enabled })} className={cn("hidden min-h-[36px] shrink-0 rounded-full px-3 text-[11px] font-bold sm:block", f.enabled ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-ink/10 text-mute")}>{f.enabled ? "On" : "Off"}</button>
                        </div>
                        {open && <FieldEditor field={f} index={i} all={form.fields} sets={sets} onChange={(p) => setField(f.id, p)} onDuplicate={() => duplicate(f.id)} onRemove={() => remove(f.id)} />}
                      </SortableItem>
                    );
                  })}
                </SortableList>
              )}
            </section>
          </div>

          {/* sticky preview on wide screens */}
          <aside className="hidden xl:block">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-ink/10 bg-surface p-5">
              <PreviewHeader onReset={() => setPreviewKey((k) => k + 1)} />
              <FormShell def={form}><DynamicForm key={previewKey} def={previewDef} optionSets={sets} preview /></FormShell>
            </div>
          </aside>
        </div>
      )}

      {tab === "preview" && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-ink/10 bg-surface p-5 sm:p-8">
          <PreviewHeader onReset={() => setPreviewKey((k) => k + 1)} />
          <FormShell def={form}><DynamicForm key={previewKey} def={previewDef} optionSets={sets} preview /></FormShell>
        </div>
      )}

      {tab === "responses" && !isNew && <Responses slug={form.slug} />}
    </div>
  );
}

function PreviewHeader({ onReset }: { onReset: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-mute">Live preview</span>
      <button type="button" onClick={onReset} className="text-xs font-semibold text-brand hover:underline">Reset preview</button>
    </div>
  );
}

export function FormShell({ def, children }: { def: Pick<FormDef, "title" | "description">; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight text-ink">{def.title || "Untitled form"}</h2>
      {def.description && <p className="mt-1.5 text-sm text-mute">{def.description}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Labeled({ label, hint, required, children, className }: { label: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="flex items-baseline justify-between gap-2 text-xs font-bold text-ink"><span>{label}{required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}</span>{hint && <span className="text-[10px] font-normal text-mute">{hint}</span>}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-brand" /> {label}
    </label>
  );
}

const num = (v: string) => (v === "" ? undefined : Number(v));

function FieldEditor({ field: f, index, all, sets, onChange, onDuplicate, onRemove }: { field: FormField; index: number; all: FormField[]; sets: OptionSets; onChange: (p: Partial<FormField>) => void; onDuplicate: () => void; onRemove: () => void }) {
  const meta = FIELD_META[f.type];
  const earlier = all.slice(0, index).filter((x) => x.type !== "section");
  const cond = f.condition;
  const src = cond ? all.find((x) => x.id === cond.fieldId) : null;
  const srcOptions = src ? optionsFor(src, sets) : [];

  return (
    <div className="space-y-4 border-t border-ink/10 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label={f.type === "section" ? "Heading" : "Label"} required className="sm:col-span-2"><input className="input text-sm" maxLength={120} value={f.label} onChange={(e) => onChange({ label: e.target.value })} /></Labeled>

        {meta.input && f.type !== "checkbox" && f.type !== "file" && f.type !== "radio" && f.type !== "checkboxes" && (
          <Labeled label="Placeholder" hint="Example text inside the box"><input className="input text-sm" maxLength={120} value={f.placeholder || ""} onChange={(e) => onChange({ placeholder: e.target.value })} /></Labeled>
        )}
        <Labeled label="Help text" hint="Small note under the field"><input className="input text-sm" maxLength={240} value={f.helpText || ""} onChange={(e) => onChange({ helpText: e.target.value })} /></Labeled>
        {meta.input && f.type !== "file" && (
          <Labeled label="Default value" hint={f.type === "checkbox" ? "true to pre-tick" : f.type === "checkboxes" ? "comma-separated option values" : undefined}>
            <input className="input text-sm" maxLength={200} value={f.defaultValue || ""} onChange={(e) => onChange({ defaultValue: e.target.value })} />
          </Labeled>
        )}
      </div>

      {meta.input && (
        <div className="flex flex-wrap gap-x-6">
          <Toggle checked={f.required} onChange={(v) => onChange({ required: v })} label="Required" />
          <Toggle checked={f.enabled} onChange={(v) => onChange({ enabled: v })} label="Shown on the form" />
        </div>
      )}
      {!meta.input && <Toggle checked={f.enabled} onChange={(v) => onChange({ enabled: v })} label="Shown on the form" />}

      {meta.hasOptions && <OptionsEditor f={f} onChange={onChange} />}

      {(f.type === "text" || f.type === "textarea") && (
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="Minimum characters"><input type="number" min={0} className="input text-sm" value={f.minLength ?? ""} onChange={(e) => onChange({ minLength: num(e.target.value) })} /></Labeled>
          <Labeled label="Maximum characters"><input type="number" min={1} max={2000} className="input text-sm" value={f.maxLength ?? ""} onChange={(e) => onChange({ maxLength: num(e.target.value) })} /></Labeled>
        </div>
      )}
      {f.type === "number" && (
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="Minimum value"><input type="number" className="input text-sm" value={f.min ?? ""} onChange={(e) => onChange({ min: num(e.target.value) })} /></Labeled>
          <Labeled label="Maximum value"><input type="number" className="input text-sm" value={f.max ?? ""} onChange={(e) => onChange({ max: num(e.target.value) })} /></Labeled>
        </div>
      )}
      {f.type === "date" && (
        <Labeled label="Allowed dates">
          <select className="input text-sm" value={f.dateRule || "any"} onChange={(e) => onChange({ dateRule: e.target.value as any })}>
            <option value="any">Any date</option><option value="future">Today or later</option><option value="past">Today or earlier</option>
          </select>
        </Labeled>
      )}
      {f.type === "checkboxes" && <Labeled label="Maximum choices" hint="Empty = no limit"><input type="number" min={1} className="input text-sm" value={f.maxChoices ?? ""} onChange={(e) => onChange({ maxChoices: num(e.target.value) })} /></Labeled>}
      {f.type === "file" && (
        <div className="space-y-3">
          <fieldset><legend className="mb-1 text-xs font-bold text-ink">Accepted file types</legend>
            <div className="flex flex-wrap gap-x-5">
              {(["pdf", "jpg", "png", "webp"] as const).map((t) => {
                const cur = f.accept || [];
                const on = cur.includes(t) || (t === "jpg" && cur.includes("jpeg"));
                return <Toggle key={t} checked={on} label={FILE_TYPES[t].label} onChange={(v) => onChange({ accept: v ? [...cur.filter((x) => x !== t), t] : cur.filter((x) => x !== t && !(t === "jpg" && x === "jpeg")) })} />;
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-4">
            <Labeled label={`Max size (MB, up to ${MAX_FILE_MB})`}><input type="number" min={0.1} max={MAX_FILE_MB} step={0.1} className="input text-sm" value={f.maxSizeMB ?? ""} onChange={(e) => onChange({ maxSizeMB: num(e.target.value) })} /></Labeled>
            <Labeled label={`Max files (up to ${MAX_FILES_PER_FIELD})`}><input type="number" min={1} max={MAX_FILES_PER_FIELD} className="input text-sm" value={f.maxFiles ?? ""} onChange={(e) => onChange({ maxFiles: num(e.target.value) })} /></Labeled>
          </div>
          <p className="text-[11px] text-mute">Uploads are checked on the server by their real content, stored privately and visible only to admins.</p>
        </div>
      )}

      {/* conditional logic */}
      <div className="rounded-xl bg-ink/[0.03] p-3">
        <Toggle checked={!!cond} label="Show this field only when…" onChange={(v) => onChange({ condition: v ? { fieldId: earlier[earlier.length - 1]?.id || "", op: "filled" } : null })} />
        {cond && (
          earlier.length === 0 ? <p className="text-xs text-mute">Add a field above this one first.</p> : (
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <select aria-label="Depends on field" className="input text-sm" value={cond.fieldId} onChange={(e) => onChange({ condition: { ...cond, fieldId: e.target.value, value: "" } })}>
                {earlier.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
              <select aria-label="Condition" className="input text-sm" value={cond.op} onChange={(e) => onChange({ condition: { ...cond, op: e.target.value as any } })}>
                <option value="filled">has an answer</option><option value="empty">is empty</option><option value="equals">equals</option><option value="notEquals">does not equal</option>
              </select>
              {(cond.op === "equals" || cond.op === "notEquals") && (srcOptions.length ? (
                <select aria-label="Value" className="input text-sm" value={cond.value || ""} onChange={(e) => onChange({ condition: { ...cond, value: e.target.value } })}>
                  <option value="">Choose…</option>
                  {srcOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : <input aria-label="Value" className="input text-sm" placeholder="value" value={cond.value || ""} onChange={(e) => onChange({ condition: { ...cond, value: e.target.value } })} />)}
            </div>
          )
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-ink/10 pt-3">
        <button type="button" onClick={onDuplicate} className="btn btn-ghost min-h-[40px] gap-1.5 border border-ink/10 text-xs"><Copy size={13} /> Duplicate</button>
        <button type="button" onClick={onRemove} className="btn btn-ghost min-h-[40px] gap-1.5 border border-red-500/20 text-xs text-red-500"><Trash2 size={13} /> Delete field</button>
      </div>
    </div>
  );
}

function OptionsEditor({ f, onChange }: { f: FormField; onChange: (p: Partial<FormField>) => void }) {
  const live = !!f.optionsSource;
  const options = f.options || [];
  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-1 text-xs font-bold text-ink">Where do the choices come from?</legend>
        <div className="flex flex-wrap gap-x-5">
          <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="radio" name={`src-${f.id}`} checked={!live} onChange={() => onChange({ optionsSource: undefined, options: options.length ? options : [{ label: "Option 1", value: "option-1" }] })} className="accent-brand" /> I will type them</label>
          <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="radio" name={`src-${f.id}`} checked={live} onChange={() => onChange({ optionsSource: "areas" })} className="accent-brand" /> Live from the website</label>
        </div>
      </fieldset>
      {live ? (
        <select aria-label="Live source" className="input text-sm" value={f.optionsSource} onChange={(e) => onChange({ optionsSource: e.target.value as any })}>
          {OPTION_SOURCES.map((s) => <option key={s} value={s}>{OPTION_SOURCE_LABEL[s]}</option>)}
        </select>
      ) : (
        <div className="space-y-2">
          <SortableList label="options" items={options} onChange={(o) => onChange({ options: o })} itemLabel={(o) => o.label} className="space-y-2">
            {options.map((o, i) => (
              <SortableItem key={i} index={i} className="flex items-center gap-2">
                <ReorderControls />
                <input aria-label={`Option ${i + 1}`} className="input min-w-0 flex-1 text-sm" value={o.label} maxLength={80}
                  onChange={(e) => {
                    const label = e.target.value;
                    const next = options.map((x, k) => {
                      if (k !== i) return x;
                      // keep the stored value stable once saved; derive it from the label while it is still the auto value
                      const auto = slugify(x.label) === x.value || x.value.startsWith("option-");
                      const base = slugify(label) || `option-${i + 1}`;
                      const taken = new Set(options.filter((_, kk) => kk !== i).map((y) => y.value));
                      let v = auto ? base : x.value; let n = 2;
                      while (taken.has(v)) v = `${base}-${n++}`;
                      return { label, value: v };
                    });
                    onChange({ options: next });
                  }} />
                <button type="button" onClick={() => onChange({ options: options.filter((_, k) => k !== i) })} aria-label={`Remove option ${o.label}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ink/10 text-mute hover:text-red-500"><X size={14} /></button>
              </SortableItem>
            ))}
          </SortableList>
          <button type="button" onClick={() => { const n = options.length + 1; onChange({ options: [...options, { label: `Option ${n}`, value: `option-${n}` }] }); }} className="btn btn-ghost min-h-[40px] gap-1.5 border border-brand/20 text-xs text-brand"><Plus size={13} /> Add option</button>
        </div>
      )}
    </div>
  );
}

function Responses({ slug }: { slug: string }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch(`/api/admin/forms/${slug}/submissions`).then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Could not load responses."); setRows(d.submissions); }).catch((e) => setErr(e.message));
  }, [slug]);
  const del = async (id: string) => {
    if (!confirm("Delete this response and its files permanently?")) return;
    const r = await fetch(`/api/admin/forms/${slug}/submissions?id=${id}`, { method: "DELETE" });
    if (r.ok) setRows((p) => (p || []).filter((x) => x.id !== id));
  };
  const csv = () => {
    if (!rows?.length) return;
    const labelSet = [...new Set(rows.flatMap((r) => Object.keys(r.values)))];
    const head = ["Received", ...labelSet.map((k) => rows.find((r) => r.labels?.[k])?.labels[k] || k)];
    const esc = (v: unknown) => { let s = Array.isArray(v) ? v.join("; ") : String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
    const body = rows.map((r) => [r.createdAt, ...labelSet.map((k) => r.values[k])].map(esc).join(","));
    const url = URL.createObjectURL(new Blob([[head.map(esc).join(","), ...body].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `${slug}-responses.csv`; a.click(); URL.revokeObjectURL(url);
  };
  if (err) return <p role="alert" className="text-sm font-semibold text-red-600">{err}</p>;
  if (!rows) return <div className="p-10 text-center text-sm text-mute"><ProgressRing size={22} className="mx-auto mb-2 text-brand" /> Loading responses…</div>;
  if (!rows.length) return <div className="rounded-2xl border border-ink/10 bg-surface/80 p-12 text-center text-sm text-mute"><ListOrdered className="mx-auto mb-2 text-mute/50" size={28} />No responses yet. Publish the form and share <span className="font-mono">/forms/{slug}</span>.</div>;
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><button type="button" onClick={csv} className="btn btn-ghost min-h-[40px] gap-1.5 border border-ink/10 text-xs"><Download size={14} /> Export CSV</button></div>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-ink/10 bg-surface p-4">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs text-mute"><span>{new Date(r.createdAt).toLocaleString("en-IN")}</span><button onClick={() => del(r.id)} className="font-semibold text-red-500 hover:underline" aria-label="Delete response">Delete</button></div>
            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {Object.entries(r.values).map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-[11px] font-bold uppercase tracking-wide text-mute">{r.labels?.[k] || k}</dt><dd className="break-words text-ink">{Array.isArray(v) ? v.join(", ") : v === true ? "Yes" : String(v)}</dd></div>)}
              {(r.files || []).map((f: any) => <div key={f.id}><dt className="text-[11px] font-bold uppercase tracking-wide text-mute">{r.labels?.[f.fieldId] || "File"}</dt><dd><a className="font-semibold text-brand hover:underline" href={`/api/admin/forms/files/${f.id}`}>{f.name}</a> <span className="text-xs text-mute">({Math.round(f.size / 1024)} KB)</span></dd></div>)}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
