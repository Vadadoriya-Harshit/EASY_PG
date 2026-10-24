"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MailX, AlertCircle } from "lucide-react";

type State = "ready" | "busy" | "done" | "error";

export default function UnsubscribeVacancy() {
  const [params, setParams] = useState<{ id: string; t: string } | null>(null);
  const [state, setState] = useState<State>("ready");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setParams({ id: q.get("id") || "", t: q.get("t") || "" });
  }, []);

  const go = async () => {
    if (!params || state === "busy") return;
    setState("busy");
    try {
      const res = await fetch("/api/vacancies/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setState("done");
      else { setMsg(data.error || "Could not unsubscribe."); setState("error"); }
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
            <MailX className="mx-auto mb-3 text-mute" size={40} />
            <h1 className="text-2xl font-bold text-ink">You have been unsubscribed</h1>
            <p className="mt-2 text-sm text-mute">We will not send you any more vacancy emails. Changed your mind? You can subscribe again from the footer any time.</p>
            <Link href="/" className="btn btn-primary mt-6">Back to home</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink">Unsubscribe from vacancy alerts?</h1>
            <p className="mt-2 text-sm text-mute">You will stop receiving emails when beds become available.</p>
            {state === "error" && (
              <p role="alert" className="mt-4 flex items-start justify-center gap-2 text-sm font-semibold text-warn"><AlertCircle size={16} className="mt-0.5 shrink-0" />{msg}</p>
            )}
            <button onClick={go} disabled={state === "busy" || !params?.id} className="btn btn-primary mt-6 min-h-[44px]">{state === "busy" ? "Working…" : "Yes, unsubscribe me"}</button>
          </>
        )}
      </div>
    </div>
  );
}
