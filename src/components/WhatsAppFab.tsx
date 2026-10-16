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
      className="fixed bottom-5 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/30 transition hover:scale-105">
      <MessageCircle />
    </a>
  );
}
