"use client";
import { cn } from "@/lib/utils";

export default function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("spot card transition duration-300 hover:-translate-y-1 hover:border-brand/40", className)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}>
      {children}
    </div>
  );
}
