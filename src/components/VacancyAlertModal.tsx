"use client";
import { BellRing, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import VacancySubscribeForm from "./VacancySubscribeForm";

interface VacancyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProperty?: string;
  defaultArea?: string;
}

export default function VacancyAlertModal({ isOpen, onClose, defaultProperty, defaultArea }: VacancyAlertModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes the dialog; focus moves into it when it opens.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="vacancy-title">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/20 bg-surface/95 p-5 shadow-2xl backdrop-blur-2xl sm:max-w-lg sm:rounded-3xl sm:p-8"
          >
            <button ref={closeRef} onClick={onClose} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-mute transition hover:bg-ink/5 hover:text-ink" aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="mb-2 flex items-center gap-3 pr-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand"><BellRing size={20} /></div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Vacancy alerts</span>
                <h3 id="vacancy-title" className="text-xl font-bold text-ink">Get an email when a bed opens</h3>
              </div>
            </div>
            <p className="mb-5 text-xs leading-relaxed text-mute">
              Tell us what you are looking for. When a matching bed is marked available we will email you. You can unsubscribe in one click.
            </p>
            <VacancySubscribeForm source={defaultProperty ? "property-page" : "public-modal"} defaultProperty={defaultProperty} defaultArea={defaultArea} onDone={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
