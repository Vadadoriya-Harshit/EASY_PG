import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { resolveOptionSets } from "@/lib/forms";
import NewForm from "./NewForm";

export const metadata: Metadata = { title: "New form | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  if (!(await getSession())) redirect("/admin/login");
  // all live lists are loaded so templates and the builder preview show real choices
  const sets = await resolveOptionSets({ fields: [{ optionsSource: "areas" }, { optionsSource: "properties" }, { optionsSource: "roomTypes" }] as any });
  return <NewForm optionSets={sets} />;
}
