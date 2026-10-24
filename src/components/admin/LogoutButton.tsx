"use client";
import { useRouter } from "next/navigation";
export default function LogoutButton() {
  const r = useRouter();
  return <button className="btn btn-ghost !min-h-[40px]" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); r.replace("/admin/login"); r.refresh(); }}>Sign out</button>;
}
