"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  X,
  Sun,
  Moon,
  Check,
  RotateCcw,
  Sparkles,
  Shuffle,
  Eye,
  Sliders,
  Flame,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThemeCombo {
  id: string;
  name: string;
  tag: string;
  subtitle: string;
  primary: string;
  accent: string;
  previewBg: string;
}

export const THEME_COMBOS: ThemeCombo[] = [
  {
    id: "royal",
    name: "Midnight Royal",
    tag: "Original",
    subtitle: "Electric Violet & Neon Cyan",
    primary: "#8B5CF6",
    accent: "#22D3EE",
    previewBg: "from-violet-600 to-cyan-400",
  },
  {
    id: "emerald",
    name: "Emerald Oasis",
    tag: "Nature & Zen",
    subtitle: "Forest Emerald & Fresh Mint",
    primary: "#10B981",
    accent: "#34D399",
    previewBg: "from-emerald-500 to-teal-400",
  },
  {
    id: "amber",
    name: "Sunset Amber",
    tag: "Warm Glow",
    subtitle: "Warm Gold & Terracotta",
    primary: "#F59E0B",
    accent: "#FB923C",
    previewBg: "from-amber-500 to-orange-400",
  },
  {
    id: "sapphire",
    name: "Oceanic Sapphire",
    tag: "Executive",
    subtitle: "Deep Azure & Electric Sky",
    primary: "#3B82F6",
    accent: "#38BDF8",
    previewBg: "from-blue-600 to-cyan-400",
  },
  {
    id: "rose",
    name: "Velvet Rose",
    tag: "Luxury Plum",
    subtitle: "Luxury Plum & Rose Quartz",
    primary: "#EC4899",
    accent: "#F472B6",
    previewBg: "from-pink-600 to-rose-400",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    tag: "High Energy",
    subtitle: "Neon Fuchsia & Acid Lime",
    primary: "#F43F5E",
    accent: "#84CC16",
    previewBg: "from-rose-500 to-lime-400",
  },
  {
    id: "heritage",
    name: "Ahmedabad Heritage",
    tag: "Local Icon",
    subtitle: "Terracotta Sandstone & Marigold",
    primary: "#EA580C",
    accent: "#F59E0B",
    previewBg: "from-orange-600 to-amber-400",
  },
  {
    id: "slate",
    name: "Nordic Frost",
    tag: "Minimal Tech",
    subtitle: "Steel Silver & Arctic Cyan",
    primary: "#94A3B8",
    accent: "#38BDF8",
    previewBg: "from-slate-500 to-cyan-300",
  },
  {
    id: "sakura",
    name: "Tokyo Sakura",
    tag: "Vibrant Cherry",
    subtitle: "Crimson Petals & Coral Blush",
    primary: "#FB7185",
    accent: "#FDA4AF",
    previewBg: "from-rose-500 to-pink-300",
  },
  {
    id: "auragold",
    name: "Imperial Aura",
    tag: "5-Star Regal",
    subtitle: "Royal Indigo & 24K Champagne",
    primary: "#6366F1",
    accent: "#F59E0B",
    previewBg: "from-indigo-600 to-amber-300",
  },
];

export default function ThemeCustomizerSideIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePalette, setActivePalette] = useState("royal");
  const [isDark, setIsDark] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedPalette = localStorage.getItem("sorath-palette") || "royal";
      const storedTheme = localStorage.getItem("sorath-theme");
      const darkPref = storedTheme ? storedTheme === "dark" : document.documentElement.classList.contains("dark");

      setActivePalette(storedPalette);
      setIsDark(darkPref);
      document.documentElement.setAttribute("data-palette", storedPalette);
    } catch {}
  }, []);

  const selectPalette = (paletteId: string) => {
    setActivePalette(paletteId);
    document.documentElement.setAttribute("data-palette", paletteId);
    try {
      localStorage.setItem("sorath-palette", paletteId);
    } catch {}

    const selected = THEME_COMBOS.find((c) => c.id === paletteId);
    if (selected) {
      setToastMessage(`${selected.name} Applied`);
      setTimeout(() => setToastMessage(null), 2200);
    }
  };

  const toggleMode = (dark: boolean) => {
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("sorath-theme", dark ? "dark" : "light");
    } catch {}
  };

  const surpriseRandomPalette = () => {
    const remaining = THEME_COMBOS.filter((c) => c.id !== activePalette);
    const random = remaining[Math.floor(Math.random() * remaining.length)];
    if (random) selectPalette(random.id);
  };

  const resetDefaults = () => {
    selectPalette("royal");
    toggleMode(true);
    setToastMessage("Reset to Midnight Royal Default");
    setTimeout(() => setToastMessage(null), 2000);
  };

  const currentThemeObj = THEME_COMBOS.find((c) => c.id === activePalette) || THEME_COMBOS[0];

  return (
    <>
      {/* =========================================================================
          FLOATING SIDE TAB PINNED TO RIGHT EDGE
          ========================================================================= */}
      <aside
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 print:hidden select-none"
        aria-label="Color Themes Customizer"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 rounded-l-2xl border-y border-l border-white/20 bg-surface/90 py-3 pl-3.5 pr-2.5 text-ink shadow-[0_8px_30px_rgb(0,0,0,0.25)] backdrop-blur-xl transition-all duration-300 hover:border-brand/70 hover:bg-surface hover:pl-4 hover:shadow-brand/20 active:scale-95"
          title="Open Theme & Color Palette Selector"
        >
          {/* Animated Glow Pill */}
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-brand to-accent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Dual Color Swatch Dot representing current active theme */}
          <div className="relative flex flex-col items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-full border border-white/30 shadow-sm"
              style={{ backgroundColor: currentThemeObj.primary }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full border border-white/30 shadow-sm"
              style={{ backgroundColor: currentThemeObj.accent }}
            />
          </div>

          {/* Palette Icon with smooth rotating hover */}
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15 text-brand transition-transform duration-300 group-hover:rotate-45">
            <Palette size={18} />
          </div>

          {/* Vertical Badge Text */}
          <div className="hidden sm:flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-ink [writing-mode:vertical-rl] rotate-180 py-1">
              Themes
            </span>
            <span className="text-[9px] font-mono font-bold text-brand [writing-mode:vertical-rl] rotate-180">
              10 Combos
            </span>
          </div>

          {/* Tooltip on Hover */}
          <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden whitespace-nowrap rounded-xl border border-white/10 bg-surface/95 px-3 py-1.5 text-xs font-semibold text-ink opacity-0 shadow-xl backdrop-blur-md transition-all group-hover:opacity-100 sm:block">
            Customize Colors & Themes
          </div>
        </button>
      </aside>

      {/* =========================================================================
          SLIDE-OUT THEME DRAWER & BACKDROP
          ========================================================================= */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden print:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-Over Drawer from Right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md border-l border-ink/10 bg-surface/95 backdrop-blur-2xl p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand to-accent text-white shadow-md shadow-brand/30">
                      <Palette size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-ink flex items-center gap-1.5">
                        Color Themes Studio
                        <span className="rounded-full bg-brand/10 border border-brand/20 px-2 py-0.5 text-[10px] font-extrabold text-brand">
                          10 Presets
                        </span>
                      </h3>
                      <p className="text-[11px] text-mute">Instant Palette, Gradients & Mode Switcher</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-mute hover:bg-ink/10 hover:text-ink transition"
                    aria-label="Close drawer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Appearance Mode (Light / Dark) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-mute">
                      Canvas Appearance
                    </label>
                    <span className="text-[11px] font-medium text-mute">
                      Active: {isDark ? "Dark Room" : "Daylight"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toggleMode(false)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition",
                        !isDark
                          ? "border-brand bg-brand/15 text-brand shadow-sm ring-1 ring-brand/30"
                          : "border-ink/10 bg-bg/60 text-mute hover:border-ink/20 hover:text-ink"
                      )}
                    >
                      <Sun size={15} />
                      <span>Light Mode</span>
                    </button>
                    <button
                      onClick={() => toggleMode(true)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition",
                        isDark
                          ? "border-brand bg-brand/15 text-brand shadow-sm ring-1 ring-brand/30"
                          : "border-ink/10 bg-bg/60 text-mute hover:border-ink/20 hover:text-ink"
                      )}
                    >
                      <Moon size={15} />
                      <span>Dark Mode</span>
                    </button>
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 via-surface to-accent/5 p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                      <Eye size={14} className="text-brand" />
                      <span>Live Design Preview</span>
                    </div>
                    <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                      {currentThemeObj.name}
                    </span>
                  </div>

                  <p className="text-xs text-mute mb-3">
                    Every card, hero gradient, button and pricing badge on the site dynamically syncs to this palette.
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button className="btn btn-primary text-xs py-1.5 px-3.5 shadow-sm">
                      Brand Button
                    </button>
                    <button className="btn btn-accent text-xs py-1.5 px-3.5 shadow-sm">
                      Accent Action
                    </button>
                    <span className="chip text-xs py-1 px-3" data-on="true">
                      Active Chip
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-ink/10 flex items-center justify-between text-[11px] text-mute font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: currentThemeObj.primary }} />
                      Primary {currentThemeObj.primary}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: currentThemeObj.accent }} />
                      Accent {currentThemeObj.accent}
                    </span>
                  </div>
                </div>

                {/* 10 Color Theme Combos */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-mute">
                      Color Palette Combos
                    </label>
                    <button
                      onClick={surpriseRandomPalette}
                      className="flex items-center gap-1 text-[11px] text-brand hover:underline font-bold"
                    >
                      <Shuffle size={12} />
                      <span>Surprise Me</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {THEME_COMBOS.map((combo) => {
                      const isSelected = activePalette === combo.id;
                      return (
                        <button
                          key={combo.id}
                          onClick={() => selectPalette(combo.id)}
                          className={cn(
                            "group w-full flex items-center justify-between rounded-2xl border p-3 text-left transition-all",
                            isSelected
                              ? "border-brand bg-brand/10 shadow-md ring-1 ring-brand/40"
                              : "border-ink/10 bg-bg/50 hover:border-ink/25 hover:bg-bg/80"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {/* Color Preview Swatch */}
                            <div
                              className={`h-9 w-9 rounded-xl bg-gradient-to-tr ${combo.previewBg} shadow-inner flex items-center justify-center shrink-0 border border-white/20`}
                            >
                              {isSelected ? (
                                <Check size={16} className="text-white drop-shadow" />
                              ) : (
                                <Sparkles size={12} className="text-white/40 group-hover:text-white transition" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className={cn("text-xs font-bold", isSelected ? "text-brand" : "text-ink")}>
                                  {combo.name}
                                </h4>
                                <span className="rounded-md bg-ink/5 px-1.5 py-0.5 text-[9px] font-semibold text-mute">
                                  {combo.tag}
                                </span>
                              </div>
                              <p className="text-[10px] text-mute">{combo.subtitle}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: combo.primary }}
                              title={`Primary: ${combo.primary}`}
                            />
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: combo.accent }}
                              title={`Accent: ${combo.accent}`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="border-t border-ink/10 pt-4 mt-6 space-y-3">
                {toastMessage && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-ok font-bold bg-ok/10 rounded-xl py-1.5 border border-ok/20">
                    <CheckCircle2 size={14} />
                    <span>{toastMessage}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={resetDefaults}
                    className="flex items-center gap-1.5 text-mute hover:text-ink font-semibold transition"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Default</span>
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="btn btn-primary text-xs py-2 px-5"
                  >
                    Done & Explore
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
