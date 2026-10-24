import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getForm, resolveOptionSets } from "@/lib/forms";
import FormBuilder from "@/components/admin/FormBuilder";

export const metadata: Metadata = { title: "Edit form | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditFormPage({ params }: { params: { slug: string } }) {
  if (!(await getSession())) redirect("/admin/login");
  const form = await getForm(params.slug);
  if (!form) notFound();
  return <FormBuilder initial={form} optionSets={await resolveOptionSets(form)} isNew={false} />;
}
