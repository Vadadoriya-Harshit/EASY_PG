"use client";
import { MessageCircle, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { telHref, waHref } from "@/lib/utils";
import { track } from "@/lib/analytics";

export default function ContactActions({ message, sticky = false, phone }: { message: string; sticky?: boolean; phone?: string }) {
  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : telHref();
  const wa = waHref(message);
  if (!tel && !wa) return null;
  const buttons = (
    <>
      {tel && <a href={tel} onClick={() => track("cta_call")} className="btn btn-ghost flex-1"><Phone size={16} /> Call</a>}
      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => track("cta_whatsapp")} className="btn flex-1 bg-[#25D366] text-white hover:brightness-110"><MessageCircle size={16} /> WhatsApp</a>}
    </>
  );
  if (!sticky) return <div className="flex gap-3">{buttons}</div>;
  return <div className="glass fixed inset-x-0 bottom-0 z-40 flex gap-3 border-x-0 border-b-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">{buttons}</div>;
}
