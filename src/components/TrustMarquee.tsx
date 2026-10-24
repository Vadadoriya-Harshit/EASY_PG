"use client";
import { GraduationCap, Briefcase, Award, ShieldCheck } from "lucide-react";

const INSTITUTIONS = [
  { name: "Gujarat University", tag: "Navrangpura", type: "academic" },
  { name: "CEPT University", tag: "Architecture & Design", type: "academic" },
  { name: "IIM Ahmedabad", tag: "Vastrapur", type: "academic" },
  { name: "Ahmedabad University", tag: "Commerce Six Roads", type: "academic" },
  { name: "Nirma University", tag: "Engineering & Law", type: "academic" },
  { name: "LD College of Engg.", tag: "Engineering Hub", type: "academic" },
  { name: "SG Highway IT Corridor", tag: "Software Engineers", type: "corporate" },
  { name: "TCS & Tech Mahindra", tag: "Tech Professionals", type: "corporate" },
];

export default function TrustMarquee() {
  return (
    <section className="border-y border-ink/10 bg-surface/60 py-6 overflow-hidden backdrop-blur-md" aria-label="Partner Universities and Institutions">
      <div className="container-x mb-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold uppercase tracking-wider text-mute flex items-center gap-1.5">
          <Award size={14} className="text-brand" /> Trusted by Students & Professionals from Premier Institutions:
        </span>
        <span className="text-ok font-semibold flex items-center gap-1">
          <ShieldCheck size={14} /> 450+ Active Residents Across Ahmedabad
        </span>
      </div>

      <div className="relative flex overflow-x-hidden">
        {/* Infinite Marquee Track */}
        <div className="animate-marquee flex items-center gap-6 py-2">
          {INSTITUTIONS.concat(INSTITUTIONS).map((inst, idx) => (
            <div
              key={idx}
              className="flex shrink-0 items-center gap-2.5 rounded-full border border-ink/10 bg-surface/90 px-4 py-2 shadow-sm"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand">
                {inst.type === "academic" ? <GraduationCap size={14} /> : <Briefcase size={14} />}
              </div>
              <div>
                <span className="text-xs font-bold text-ink whitespace-nowrap">{inst.name}</span>
                <span className="text-[10px] text-mute block leading-none">{inst.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
