"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function PropertyTabs({ inquiry, visit }: { inquiry: React.ReactNode; visit: React.ReactNode }) {
  const [tab, setTab] = useState<"inquiry" | "visit">("inquiry");
  return (
    <div>
      <div role="tablist" aria-label="Contact type" className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-ink/5 p-1">
        {([["inquiry", "Inquiry"], ["visit", "Request a visit"]] as const).map(([k, l]) => (
          <button key={k} role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} onClick={() => setTab(k)}
            className={cn("min-h-[40px] rounded-full text-sm font-semibold transition", tab === k ? "bg-brand text-white" : "text-mute hover:text-ink")}>{l}</button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>{tab === "inquiry" ? inquiry : visit}</div>
    </div>
  );
}
