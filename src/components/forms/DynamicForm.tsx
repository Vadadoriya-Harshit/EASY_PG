"use client";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp, Send, X } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import { cn } from "@/lib/utils";
import {
  FILE_TYPES, MAX_FILE_MB, isVisible, optionsFor, validateFileMeta, validateValues,
  type FieldErrors, type FormDef, type FormField, type FormValues, type OptionSets,
} from "@/lib/form-schema";

interface Props {
  def: FormDef;
  optionSets?: OptionSets;
  /** Builder preview: everything works and validates, but nothing is sent. */
  preview?: boolean;
  onSubmitted?: () => void;
}

type Banner = { kind: "success" | "error" | "duplicate"; text: string } | null;

function initialValues(def: FormDef): FormValues {
  const v: FormValues = {};
  for (const f of def.fields) {
    if (f.defaultValue === undefined || f.defaultValue === "") continue;
    if (f.type === "checkbox") v[f.id] = f.defaultValue === "true";
    else if (f.type === "checkboxes") v[f.id] = f.defaultValue.split(",").map((s) => s.trim()).filter(Boolean);
    else if (f.type !== "file") v[f.id] = f.defaultValue;
  }
  return v;
}

export default function DynamicForm({ def, optionSets = {}, preview, onSubmitted }: Props) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<FormValues>(() => initialValues(def));
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const inFlight = useRef(false);

  const fileMeta = useMemo(
    () => Object.fromEntries(Object.entries(files).map(([k, list]) => [k, list.map((f) => ({ name: f.name, size: f.size, type: f.type }))])),
    [files]
  );

  const check = useCallback(
    (v: FormValues, fl: typeof fileMeta) => validateValues(def, v, optionSets, fl),
    [def, optionSets]
  );

  const setValue = (id: string, val: string | boolean | string[]) => {
    const next = { ...values, [id]: val };
    setValues(next);
    if (touched[id] || errors[id]) setErrors((e) => { const all = check(next, fileMeta); const n = { ...e }; if (all[id]) n[id] = all[id]; else delete n[id]; return n; });
  };

  const blur = (id: string) => {
    setTouched((t) => ({ ...t, [id]: true }));
    const all = check(values, fileMeta);
    setErrors((e) => { const n = { ...e }; if (all[id]) n[id] = all[id]; else delete n[id]; return n; });
  };

  const addFiles = (f: FormField, incoming: File[]) => {
    const max = f.maxFiles || 1;
    const current = files[f.id] || [];
    const problems: string[] = [];
    const ok: File[] = [];
    for (const file of incoming) {
      const e = validateFileMeta(f, { name: file.name, size: file.size, type: file.type });
      if (e) problems.push(`${file.name}: ${e}`);
      else if (current.length + ok.length >= max) problems.push(`You can attach at most ${max} file${max > 1 ? "s" : ""}.`);
      else ok.push(file);
    }
    const next = { ...files, [f.id]: [...current, ...ok] };
    setFiles(next);
    setErrors((e) => { const n = { ...e }; if (problems.length) n[f.id] = problems[0]; else delete n[f.id]; return n; });
  };

  const removeFile = (id: string, idx: number) => {
    setFiles((p) => ({ ...p, [id]: (p[id] || []).filter((_, i) => i !== idx) }));
    setErrors((e) => { const n = { ...e }; delete n[id]; return n; });
  };

  const focusFirstError = (errs: FieldErrors) => {
    const first = def.fields.find((f) => errs[f.id]);
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first.id}"] input, [data-field="${first.id}"] select, [data-field="${first.id}"] textarea, [data-field="${first.id}"] button`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.focus({ preventScroll: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return; // one request at a time
    setBanner(null);
    const errs = check(values, fileMeta);
    setTouched(Object.fromEntries(def.fields.map((f) => [f.id, true])));
    setErrors(errs);
    if (Object.keys(errs).length) {
      setBanner({ kind: "error", text: `Please fix ${Object.keys(errs).length === 1 ? "the highlighted field" : "the highlighted fields"} and try again.` });
      focusFirstError(errs);
      return;
    }
    if (preview) {
      setBanner({ kind: "success", text: "Preview only: everything is valid. Nothing was sent." });
      return;
    }

    inFlight.current = true;
    setBusy(true);
    try {
      const fd = new FormData();
      const visibleIds = new Set(def.fields.filter((f) => isVisible(f, values, def.fields)).map((f) => f.id));
      fd.set("data", JSON.stringify({ ...values, _hp: hp }));
      for (const [id, list] of Object.entries(files)) if (visibleIds.has(id)) list.forEach((file) => fd.append(`file:${id}`, file, file.name));
      const res = await fetch(`/api/forms/${def.slug}/submit`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBanner({ kind: "success", text: data.message || def.successMessage });
        setValues(initialValues(def));
        setFiles({});
        setErrors({});
        setTouched({});
        onSubmitted?.();
        formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      } else if (res.status === 422 && data.fieldErrors) {
        setErrors(data.fieldErrors);
        setBanner({ kind: "error", text: data.error || "Please fix the highlighted fields." });
        focusFirstError(data.fieldErrors);
      } else if (res.status === 409) {
        setBanner({ kind: "duplicate", text: data.error || "We already received this submission." });
      } else if (res.status === 429) {
        setBanner({ kind: "error", text: data.error || "Too many attempts. Please wait a few minutes." });
      } else if (res.status === 404) {
        setBanner({ kind: "error", text: "This form is no longer available." });
      } else if (res.status >= 500) {
        setBanner({ kind: "error", text: "Something went wrong on our side. Your answers are still here: please try again in a moment." });
      } else {
        setBanner({ kind: "error", text: data.error || "We could not send your answers. Please try again." });
      }
    } catch {
      setBanner({ kind: "error", text: "Network problem: your answers are still here. Check your connection and try again." });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const visibleFields = def.fields.filter((f) => isVisible(f, values, def.fields));

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy} className="space-y-5" aria-label={def.title}>
      {banner && (
        <div
          role={banner.kind === "success" ? "status" : "alert"}
          className={cn(
            "flex items-start gap-2.5 rounded-xl border p-3.5 text-sm font-medium",
            banner.kind === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            banner.kind === "duplicate" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
            banner.kind === "error" && "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
          )}
        >
          {banner.kind === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
          <span>{banner.text}</span>
        </div>
      )}

      {visibleFields.map((f) => {
        const id = `${uid}-${f.id}`;
        const err = errors[f.id];
        const describedBy = [f.helpText ? `${id}-help` : "", err ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;

        if (f.type === "section") {
          return (
            <div key={f.id} className="pt-3" data-field={f.id}>
              <h2 className="border-b border-ink/10 pb-2 text-base font-bold text-ink">{f.label}</h2>
              {f.helpText && <p className="mt-1 text-xs text-mute">{f.helpText}</p>}
            </div>
          );
        }

        const opts = optionsFor(f, optionSets);
        const common = { id, name: f.id, "aria-invalid": err ? true : undefined, "aria-describedby": describedBy, "aria-required": f.required || undefined, disabled: busy } as const;
        const cls = cn("input w-full", err && "!border-red-500/70 !ring-red-500/20");

        return (
          <div key={f.id} data-field={f.id} className="space-y-1.5">
            {f.type !== "checkbox" && (
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={f.type === "radio" || f.type === "checkboxes" || f.type === "file" ? undefined : id} id={`${id}-label`} className="text-sm font-semibold text-ink">
                  {f.label}
                  {f.required ? <span className="ml-0.5 text-red-500" aria-hidden="true"> *</span> : null}
                  {f.required && <span className="sr-only"> (required)</span>}
                </label>
                {!f.required && <span className="shrink-0 text-[11px] font-medium text-mute">Optional</span>}
              </div>
            )}

            {(f.type === "text" || f.type === "email" || f.type === "phone" || f.type === "number" || f.type === "date") && (
              <input
                {...common}
                type={f.type === "phone" ? "tel" : f.type === "text" ? "text" : f.type}
                inputMode={f.type === "phone" ? "tel" : f.type === "number" ? "decimal" : f.type === "email" ? "email" : undefined}
                autoComplete={f.type === "email" ? "email" : f.type === "phone" ? "tel" : undefined}
                placeholder={f.placeholder}
                min={f.type === "number" ? f.min : f.type === "date" && f.dateRule === "future" ? new Date().toISOString().slice(0, 10) : undefined}
                max={f.type === "number" ? f.max : f.type === "date" && f.dateRule === "past" ? new Date().toISOString().slice(0, 10) : undefined}
                maxLength={f.type === "text" ? f.maxLength ?? 200 : undefined}
                value={(values[f.id] as string) || ""}
                onChange={(e) => setValue(f.id, e.target.value)}
                onBlur={() => blur(f.id)}
                className={cls}
              />
            )}

            {f.type === "textarea" && (
              <textarea
                {...common}
                rows={4}
                placeholder={f.placeholder}
                maxLength={f.maxLength ?? 2000}
                value={(values[f.id] as string) || ""}
                onChange={(e) => setValue(f.id, e.target.value)}
                onBlur={() => blur(f.id)}
                className={cls}
              />
            )}

            {f.type === "select" && (
              <select {...common} value={(values[f.id] as string) || ""} onChange={(e) => setValue(f.id, e.target.value)} onBlur={() => blur(f.id)} className={cls}>
                <option value="">{f.placeholder || "Choose an option"}</option>
                {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}

            {f.type === "radio" && (
              <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy} className="grid gap-2 sm:grid-cols-2">
                {opts.map((o) => {
                  const on = values[f.id] === o.value;
                  return (
                    <label key={o.value} className={cn("flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-sm transition", on ? "border-brand bg-brand/10 font-semibold text-ink" : "border-ink/15 bg-surface hover:border-brand/40", err && !on && "border-red-500/40")}>
                      <input type="radio" name={f.id} value={o.value} checked={on} disabled={busy} onChange={() => setValue(f.id, o.value)} onBlur={() => blur(f.id)} className="h-4 w-4 accent-brand" />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            )}

            {f.type === "checkbox" && (
              <div>
                <label className={cn("flex min-h-[44px] cursor-pointer items-start gap-2.5 text-sm text-ink", err && "text-red-600")}>
                  <input {...common} type="checkbox" checked={values[f.id] === true} onChange={(e) => setValue(f.id, e.target.checked)} onBlur={() => blur(f.id)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
                  <span>
                    {f.label}
                    {f.required ? <span className="ml-0.5 text-red-500" aria-hidden="true"> *</span> : <span className="ml-2 text-[11px] text-mute">Optional</span>}
                  </span>
                </label>
              </div>
            )}

            {f.type === "checkboxes" && (
              <div role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy} className="grid gap-2 sm:grid-cols-2">
                {opts.map((o) => {
                  const cur = Array.isArray(values[f.id]) ? (values[f.id] as string[]) : [];
                  const on = cur.includes(o.value);
                  return (
                    <label key={o.value} className={cn("flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-sm transition", on ? "border-brand bg-brand/10 font-semibold text-ink" : "border-ink/15 bg-surface hover:border-brand/40")}>
                      <input type="checkbox" checked={on} disabled={busy} onChange={() => setValue(f.id, on ? cur.filter((x) => x !== o.value) : [...cur, o.value])} onBlur={() => blur(f.id)} className="h-4 w-4 accent-brand" />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            )}

            {f.type === "file" && <FileField f={f} id={id} files={files[f.id] || []} disabled={busy} err={err} describedBy={describedBy} onAdd={(l) => addFiles(f, l)} onRemove={(i) => removeFile(f.id, i)} />}

            {f.helpText && <p id={`${id}-help`} className="text-xs text-mute">{f.helpText}</p>}
            {err && (
              <p id={`${id}-err`} role="alert" className="flex items-start gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle size={13} className="mt-0.5 shrink-0" /> {err}
              </p>
            )}
          </div>
        );
      })}

      {/* honeypot: invisible to people and assistive tech */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label>Leave this empty<input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></label>
      </div>

      {def.consentText && <p className="text-xs leading-relaxed text-mute">{def.consentText}</p>}

      <button type="submit" disabled={busy} className="btn btn-primary min-h-[48px] w-full gap-2.5 text-sm sm:w-auto sm:px-8">
        {busy ? <><ProgressRing size={18} label="Sending" /> Sending…</> : <><Send size={16} /> {def.submitLabel}</>}
      </button>
      {Object.keys(errors).length > 0 && !busy && <p className="sr-only" role="status">{Object.keys(errors).length} field(s) need attention.</p>}
    </form>
  );
}

function FileField({ f, id, files, disabled, err, describedBy, onAdd, onRemove }: { f: FormField; id: string; files: File[]; disabled: boolean; err?: string; describedBy?: string; onAdd: (l: File[]) => void; onRemove: (i: number) => void }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const accept = (f.accept?.length ? f.accept : Object.keys(FILE_TYPES)).map((e) => `.${e}`).join(",");
  const max = f.maxFiles || 1;
  const sizeMB = Math.min(f.maxSizeMB || MAX_FILE_MB, MAX_FILE_MB);
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) onAdd(Array.from(e.dataTransfer.files)); }}
        className={cn("rounded-xl border-2 border-dashed p-5 text-center transition", over ? "border-brand bg-brand/10" : err ? "border-red-500/50" : "border-ink/20 bg-surface/60")}
      >
        <FileUp className="mx-auto mb-2 text-brand" size={26} aria-hidden="true" />
        <p className="text-sm text-ink">Drag a file here, or</p>
        <button type="button" disabled={disabled || files.length >= max} onClick={() => input.current?.click()} className="btn btn-ghost mt-2 min-h-[44px] border border-ink/15 text-xs">
          Browse files
        </button>
        <input ref={input} id={id} type="file" multiple={max > 1} accept={accept} disabled={disabled} aria-describedby={describedBy} className="sr-only" onChange={(e) => { onAdd(Array.from(e.target.files || [])); e.target.value = ""; }} />
        <p className="mt-2 text-[11px] text-mute">{(f.accept?.length ? f.accept : ["pdf", "jpg", "png", "webp"]).map((x) => x.toUpperCase()).join(", ")} · up to {sizeMB} MB each · max {max} file{max > 1 ? "s" : ""}</p>
      </div>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((file, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-ink/10 bg-surface px-3 py-2 text-xs">
              <span className="min-w-0 truncate font-medium text-ink">{file.name} <span className="text-mute">({(file.size / 1024).toFixed(0)} KB)</span></span>
              <button type="button" onClick={() => onRemove(i)} disabled={disabled} aria-label={`Remove ${file.name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mute hover:bg-ink/5 hover:text-red-500"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
