"use client";
import { useRouter } from "next/navigation";
export default function DeleteProperty({ slug }: { slug: string }) {
  const r = useRouter();
  return <button className="btn btn-ghost !min-h-[40px] text-warn" onClick={async () => { if (!confirm(`Delete ${slug}? This cannot be undone.`)) return; await fetch(`/api/admin/properties/${slug}`, { method: "DELETE" }); r.refresh(); }}>Delete</button>;
}
