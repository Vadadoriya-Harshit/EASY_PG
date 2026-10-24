"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MailCheck, AlertCircle } from "lucide-react";

type State = "ready" | "busy" | "done" | "error";

export default function ConfirmVacancy() {
  const [params, setParams] = useState<{ id: string; t: string } | null>(null);
  const [state, setState] = useState<State>("ready");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setParams({ id: q.get("id") || "", t: q.get("t") || "" });
  }, []);

  const confirm = async () => {
    if (!params || state === "busy") return;
    setState("busy");
    try {
      const res = await fetch("/api/vacancies/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setState("done");
      else { setMsg(data.error || "Could not confirm."); setState("error"); }
    } catch {
      setMsg("Network error. Please try again.");
      setState("error");
    }
  };

  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8 text-center">
        {state === "done" ? (
          <>
            <MailCheck className="mx-auto mb-3 text-emerald-500" size={40} />
            <h1 className="text-2xl font-bold text-ink">You are subscribed</h1>
            <p className="mt-2 text-sm text-mute">We will email you as soon as a matching bed becomes available. Every email has a one-click unsubscribe link.</p>
            <Link href="/pgs" className="btn btn-primary mt-6">Browse PGs</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink">Confirm your email</h1>
            <p className="mt-2 text-sm text-mute">Press the button to start receiving vacancy alerts from Luxora PG.</p>
            {state === "error" && (
              <p role="alert" className="mt-4 flex items-start justify-center gap-2 text-sm font-semibold text-warn"><AlertCircle size={16} className="mt-0.5 shrink-0" />{msg}</p>
            )}
            <button onClick={confirm} disabled={state === "busy" || !params?.id} className="btn btn-primary mt-6 min-h-[44px]">{state === "busy" ? "Confirming…" : "Confirm my email"}</button>
          </>
        )}
      </div>
    </div>
  );
}
