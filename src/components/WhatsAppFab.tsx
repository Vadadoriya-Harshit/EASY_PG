"use client";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { waHref, waMessage } from "@/lib/utils";
import { track } from "@/lib/analytics";

export default function WhatsAppFab() {
  const path = usePathname();
  if (!SITE.whatsapp || path.startsWith("/admin") || path.startsWith("/pg/")) return null;
  return (
    <a href={waHref(waMessage())} target="_blank" rel="noopener noreferrer" onClick={() => track("cta_whatsapp")}
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_-4px_rgba(37,211,102,0.5),_0_4px_12px_-2px_rgba(0,0,0,0.2),_inset_0_2px_2px_0_rgba(255,255,255,0.45)] transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-[0_16px_36px_-4px_rgba(37,211,102,0.65)]">
      <MessageCircle />
    </a>
  );
}
