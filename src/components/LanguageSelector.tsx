"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage, LANGUAGES } from "@/lib/i18n";

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export default function LanguageSelector({ compact = false, className = "" }: LanguageSelectorProps) {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOption = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div ref={containerRef} className={`relative inline-block text-left select-none ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        aria-label="Select Application Language"
        aria-expanded={isOpen}
        className={`group inline-flex items-center gap-1.5 rounded-full border transition-all duration-200 select-none whitespace-nowrap shrink-0 ${
          compact
            ? "px-2.5 py-1 text-[11px] font-semibold border-white/20 bg-white/10 hover:bg-white/20 text-white"
            : "px-3 py-1.5 text-xs font-bold border-ink/15 bg-surface/85 hover:border-brand/40 hover:bg-surface text-ink shadow-sm"
        }`}
      >
        <span className="text-sm leading-none shrink-0">{currentOption.flag}</span>
        <span className="tracking-wide whitespace-nowrap">{currentOption.nativeName}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 opacity-60 group-hover:opacity-100 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 z-[120] mt-2 w-48 origin-top-right rounded-2xl border border-ink/15 bg-surface p-1.5 shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
          >
            <div className="px-2.5 py-1.5 border-b border-ink/5 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-mute flex items-center gap-1">
                <Globe size={11} className="text-brand" />
                Select Language
              </span>
            </div>

            <div className="space-y-0.5">
              {LANGUAGES.map((option) => {
                const isSelected = option.code === lang;
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => {
                      setLang(option.code);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-150 ${
                      isSelected
                        ? "bg-gradient-to-r from-brand/15 to-accent/15 text-brand font-bold"
                        : "text-ink hover:bg-ink/5 hover:text-brand"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{option.flag}</span>
                      <span className="flex flex-col text-left leading-tight">
                        <span className="font-bold text-ink">{option.nativeName}</span>
                        <span className="text-[10px] text-mute">{option.name}</span>
                      </span>
                    </span>

                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
