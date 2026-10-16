"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("sorath-theme", next ? "dark" : "light"); } catch {}
  };
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      className="grid h-10 w-10 place-items-center rounded-xl border border-ink/15 bg-surface/80 text-ink transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand shadow-sm active:scale-95 shrink-0"
    >
      {dark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-brand" />}
    </button>
  );
}
