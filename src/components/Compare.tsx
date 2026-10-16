"use client";
import Link from "next/link";
import { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { GitCompareArrows, X } from "lucide-react";

interface Ctx { ids: string[]; names: Record<string, string>; toggle: (slug: string, name: string) => void; clear: () => void; has: (s: string) => boolean }
const C = createContext<Ctx>({ ids: [], names: {}, toggle: () => {}, clear: () => {}, has: () => false });
export const useCompare = () => useContext(C);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const toggle = (slug: string, name: string) => {
    setIds((cur) => (cur.includes(slug) ? cur.filter((x) => x !== slug) : cur.length >= 3 ? cur : [...cur, slug]));
    setNames((n) => ({ ...n, [slug]: name }));
  };
  return <C.Provider value={{ ids, names, toggle, clear: () => setIds([]), has: (s) => ids.includes(s) }}>{children}</C.Provider>;
}

export function CompareBar() {
  const { ids, names, toggle, clear } = useCompare();
  const path = usePathname();
  if (!ids.length || path.startsWith("/admin") || path === "/compare") return null;
  return (
    <div className="glass fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-2xl items-center gap-3 rounded-2xl p-3 shadow-2xl sm:bottom-5">
      <GitCompareArrows size={20} className="ml-1 shrink-0 text-accent" aria-hidden="true" />
      <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
        {ids.map((s) => (
          <li key={s} className="chip max-w-[11rem] py-1" data-on="true">
            <span className="truncate">{names[s] || s}</span>
            <button aria-label={`Remove ${names[s] || s} from comparison`} onClick={() => toggle(s, names[s])}><X size={14} /></button>
          </li>
        ))}
      </ul>
      <button onClick={clear} className="hidden text-sm text-mute hover:text-ink sm:block">Clear</button>
      <Link href={`/compare?ids=${ids.join(",")}`} className="btn btn-primary shrink-0" aria-disabled={ids.length < 2}>Compare ({ids.length}/3)</Link>
    </div>
  );
}
