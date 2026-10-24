"use client";
import { useState } from "react";
import Link from "next/link";
import { FilePlus2, LayoutTemplate } from "lucide-react";
import FormBuilder from "@/components/admin/FormBuilder";
import { FORM_TEMPLATES, buildTemplate } from "@/lib/form-templates";
import type { FormDef, OptionSets } from "@/lib/form-schema";
import { slugify } from "@/lib/utils";

export default function NewForm({ optionSets }: { optionSets: OptionSets }) {
  const [initial, setInitial] = useState<FormDef | null>(null);

  if (initial) return <FormBuilder initial={initial} optionSets={optionSets} isNew />;

  const start = (id: string) => {
    const d = buildTemplate(id);
    const now = new Date().toISOString();
    setInitial({ ...d, slug: id === "blank" ? "" : slugify(d.title).slice(0, 60), version: 0, createdAt: now, updatedAt: now });
  };

  return (
    <div className="space-y-6 pb-16">
      <div>
        <Link href="/admin/forms" className="text-xs font-semibold text-mute hover:text-ink">← All forms</Link>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Create a form</h1>
        <p className="mt-1 text-sm text-mute">Pick a starting point. You can change everything afterwards.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {FORM_TEMPLATES.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => start(t.id)} className="group flex h-full w-full items-start gap-4 rounded-2xl border border-ink/10 bg-surface p-5 text-left transition hover:border-brand/50 hover:shadow-md">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white">{t.id === "blank" ? <FilePlus2 size={22} /> : <LayoutTemplate size={22} />}</span>
              <span><span className="block text-base font-bold text-ink">{t.name}</span><span className="mt-1 block text-sm text-mute">{t.description}</span></span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
