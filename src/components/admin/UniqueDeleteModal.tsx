"use client";
import { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  itemName?: string;
  itemPreviewUrl?: string;
  confirmLabel?: string;
  isDeleting?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function UniqueDeleteModal({
  isOpen,
  title,
  description = "Are you sure you want to delete this? This action will permanently remove it from your records.",
  itemName,
  itemPreviewUrl,
  confirmLabel = "Yes, Delete Permanently",
  isDeleting = false,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, isDeleting, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => !isDeleting && onCancel()}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-500/30 bg-surface p-6 shadow-2xl shadow-red-950/40 text-ink z-10"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="absolute right-4 top-4 rounded-full p-1.5 text-mute hover:bg-ink/5 hover:text-ink transition"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            {/* Warning Icon Glow */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-500/20 to-amber-500/20 text-red-500 border border-red-500/30 shadow-lg shadow-red-500/10">
              <AlertTriangle size={28} className="animate-pulse text-red-500" />
            </div>

            {/* Header Content */}
            <div className="text-center space-y-1.5">
              <h3 id="delete-modal-title" className="text-lg sm:text-xl font-black text-ink">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-mute leading-relaxed max-w-sm mx-auto">
                {description}
              </p>
            </div>

            {/* Item Preview Box */}
            {(itemName || itemPreviewUrl) && (
              <div className="my-4 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                {itemPreviewUrl && (
                  <img
                    src={itemPreviewUrl}
                    alt={itemName || "Item"}
                    className="h-12 w-14 rounded-xl object-cover border border-ink/10 shrink-0"
                  />
                )}
                {itemName && (
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">
                      Target to be deleted
                    </span>
                    <span className="text-xs font-bold text-ink truncate block">
                      {itemName}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                disabled={isDeleting}
                className="w-full sm:w-1/2 rounded-full border border-ink/15 bg-surface px-4 py-2.5 text-xs font-bold text-ink hover:bg-ink/5 active:scale-[0.98] transition disabled:opacity-50"
              >
                Cancel / Keep
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>{confirmLabel}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
