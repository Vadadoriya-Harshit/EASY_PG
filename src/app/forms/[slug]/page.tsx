import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getForm, resolveOptionSets } from "@/lib/forms";
import DynamicForm from "@/components/forms/DynamicForm";

// Always fresh: edits in the admin builder must show immediately, and visitors must never see a stale field list.
export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9-]{2,60}$/;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = SLUG.test(slug) ? await getForm(slug, { publishedOnly: true }).catch(() => null) : null;
  return {
    title: f?.title || "Form",
    description: f?.description || undefined,
    alternates: { canonical: `/forms/${slug}` },
    robots: { index: false, follow: true }, // utility pages, not search landing pages
  };
}

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG.test(slug)) notFound();
  const def = await getForm(slug, { publishedOnly: true });
  if (!def) notFound();
  const sets = await resolveOptionSets(def);
  return (
    <div className="container-x py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-mute"><Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden="true">/</span> {def.title}</nav>
        <div className="card border-ink/10 p-5 shadow-lg sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{def.title}</h1>
          {def.description && <p className="mt-2 text-sm leading-relaxed text-mute">{def.description}</p>}
          <p className="mt-3 text-xs text-mute"><span className="text-red-500">*</span> marks required fields.</p>
          <div className="mt-6"><DynamicForm def={def} optionSets={sets} /></div>
        </div>
      </div>
    </div>
  );
}
