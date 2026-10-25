"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Trash2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DialogTone = "danger" | "warning" | "brand" | "success" | "neutral";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  danger?: boolean;
}

export interface AlertOptions {
  title?: string;
  message: string;
  buttonText?: string;
  buttonLabel?: string;
  tone?: DialogTone;
}

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface DialogState {
  isOpen: boolean;
  type: "confirm" | "alert";
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  tone: DialogTone;
  resolve?: (val: boolean) => void;
}

// Global dispatcher events
const EVENT_CONFIRM = "luxora:dialog:confirm";
const EVENT_ALERT = "luxora:dialog:alert";
const EVENT_TOAST = "luxora:toast";

/**
 * Modern Promise-based confirmation modal.
 * Replaces legacy window.confirm().
 */
export function showConfirm(options: ConfirmOptions | string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const opts: ConfirmOptions =
    typeof options === "string" ? { message: options } : options;
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent(EVENT_CONFIRM, {
        detail: {
          title: opts.title || (opts.danger || opts.tone === "danger" ? "Confirm Action" : "Please Confirm"),
          message: opts.message,
          confirmText: opts.confirmLabel || opts.confirmText || (opts.danger || opts.tone === "danger" ? "Yes, Delete" : "Confirm"),
          cancelText: opts.cancelLabel || opts.cancelText || "Cancel",
          tone: opts.tone || (opts.danger ? "danger" : "brand"),
          resolve,
        },
      })
    );
  });
}

/**
 * Modern Promise-based alert modal.
 * Replaces legacy window.alert().
 */
export function showAlert(options: AlertOptions | string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const opts: AlertOptions =
    typeof options === "string" ? { message: options } : options;
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent(EVENT_ALERT, {
        detail: {
          title: opts.title || (opts.tone === "danger" ? "Notice" : "Information"),
          message: opts.message,
          buttonText: opts.buttonLabel || opts.buttonText || "Got it",
          tone: opts.tone || "brand",
          resolve: () => resolve(),
        },
      })
    );
  });
}

/**
 * Non-intrusive floating toast notification.
 */
export function showToast(message: string, type: "success" | "error" | "info" = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_TOAST, { detail: { message, type } }));
}

/**
 * Host component to be placed once inside root layout.
 */
export default function FeedbackDialogHost() {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    type: "confirm",
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    tone: "brand",
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleConfirm = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setDialog({
        isOpen: true,
        type: "confirm",
        title: detail.title,
        message: detail.message,
        confirmText: detail.confirmText,
        cancelText: detail.cancelText,
        tone: detail.tone,
        resolve: detail.resolve,
      });
    };

    const handleAlert = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setDialog({
        isOpen: true,
        type: "alert",
        title: detail.title,
        message: detail.message,
        confirmText: detail.buttonText,
        cancelText: "",
        tone: detail.tone,
        resolve: detail.resolve,
      });
    };

    const handleToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-3), { id, message: detail.message, type: detail.type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };

    window.addEventListener(EVENT_CONFIRM, handleConfirm);
    window.addEventListener(EVENT_ALERT, handleAlert);
    window.addEventListener(EVENT_TOAST, handleToast);

    return () => {
      window.removeEventListener(EVENT_CONFIRM, handleConfirm);
      window.removeEventListener(EVENT_ALERT, handleAlert);
      window.removeEventListener(EVENT_TOAST, handleToast);
    };
  }, []);

  const handleClose = (result: boolean) => {
    if (dialog.resolve) {
      dialog.resolve(result);
    }
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (!dialog.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleClose(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog.isOpen]);

  const toneConfig = {
    danger: {
      border: "border-red-500/30",
      iconBg: "bg-red-500/15 text-red-500 border-red-500/30",
      icon: Trash2,
      btnPrimary: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30",
    },
    warning: {
      border: "border-amber-500/30",
      iconBg: "bg-amber-500/15 text-amber-500 border-amber-500/30",
      icon: AlertTriangle,
      btnPrimary: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/30",
    },
    success: {
      border: "border-emerald-500/30",
      iconBg: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
      icon: CheckCircle2,
      btnPrimary: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30",
    },
    brand: {
      border: "border-brand/30",
      iconBg: "bg-brand/15 text-brand border-brand/30",
      icon: Info,
      btnPrimary: "btn-primary",
    },
    neutral: {
      border: "border-ink/15",
      iconBg: "bg-ink/10 text-ink border-ink/20",
      icon: Info,
      btnPrimary: "btn-primary",
    },
  }[dialog.tone || "brand"];

  const IconComponent = toneConfig.icon;

  return (
    <>
      {/* =========================================================================
          MODAL DIALOG (Confirm / Alert)
          ========================================================================= */}
      <AnimatePresence>
        {dialog.isOpen && (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleClose(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className={cn(
                "relative w-full max-w-md overflow-hidden rounded-3xl border bg-surface p-6 sm:p-7 shadow-2xl text-ink z-10",
                toneConfig.border
              )}
            >
              {/* Close 'X' Button */}
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-mute hover:bg-ink/5 hover:text-ink transition"
                aria-label="Close dialog"
              >
                <X size={17} />
              </button>

              {/* Glowing Icon Header */}
              <div className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-2xl border p-3 shadow-md"
                style={{ width: "52px", height: "52px" }}
              >
                <div className={cn("h-full w-full rounded-xl flex items-center justify-center border", toneConfig.iconBg)}>
                  <IconComponent size={24} />
                </div>
              </div>

              {/* Text Body */}
              <div className="text-center space-y-2">
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-ink">
                  {dialog.title}
                </h3>
                <p className="text-xs sm:text-sm text-mute leading-relaxed max-w-sm mx-auto">
                  {dialog.message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-2.5">
                {dialog.type === "confirm" && (
                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="w-full sm:w-1/2 rounded-full border border-ink/15 bg-surface px-4 py-2.5 text-xs font-bold text-ink hover:bg-ink/5 active:scale-[0.98] transition"
                  >
                    {dialog.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  autoFocus
                  onClick={() => handleClose(true)}
                  className={cn(
                    "w-full rounded-full px-5 py-2.5 text-xs font-bold transition active:scale-[0.98] flex items-center justify-center gap-1.5",
                    dialog.type === "confirm" ? "sm:w-1/2" : "w-full",
                    toneConfig.btnPrimary
                  )}
                >
                  <Check size={14} />
                  <span>{dialog.confirmText}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          FLOATING TOAST NOTIFICATIONS
          ========================================================================= */}
      <aside
        className="fixed bottom-5 right-5 z-[160] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "pointer-events-auto flex items-center gap-2.5 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl text-xs font-bold",
                toast.type === "success" && "border-emerald-500/30 bg-surface/95 text-ink shadow-emerald-950/20",
                toast.type === "error" && "border-red-500/30 bg-surface/95 text-red-500 shadow-red-950/20",
                toast.type === "info" && "border-brand/30 bg-surface/95 text-ink shadow-brand/20"
              )}
            >
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl",
                toast.type === "success" && "bg-emerald-500/15 text-emerald-500",
                toast.type === "error" && "bg-red-500/15 text-red-500",
                toast.type === "info" && "bg-brand/15 text-brand"
              )}>
                {toast.type === "success" ? (
                  <CheckCircle2 size={16} />
                ) : toast.type === "error" ? (
                  <AlertCircle size={16} />
                ) : (
                  <Info size={16} />
                )}
              </div>
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-mute hover:text-ink transition p-1"
                aria-label="Dismiss toast"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </aside>
    </>
  );
}
