"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  labelId?: string;
  describedBy?: string;
  onComplete?: (v: string) => void;
}

/**
 * Accessible luxury one-box-per-digit code input with 3D tactile feedback.
 * Typing advances, Backspace steps back, Arrow/Home/End move, and pasting a whole code fills every box.
 */
export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
  autoFocus,
  labelId,
  describedBy,
  onComplete,
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const live = useRef(value);
  live.current = value;
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const focus = (i: number) => {
    const el = refs.current[Math.min(Math.max(i, 0), length - 1)];
    el?.focus();
    el?.select();
  };

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    live.current = clean;
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      className="flex justify-between gap-2 sm:gap-3"
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          onFocus={(e) => {
            if (i > live.current.length) focus(live.current.length);
            else e.target.select();
          }}
          onChange={(e) => {
            const typed = e.target.value.replace(/\D/g, "");
            if (!typed) return;
            const clean = commit(value.slice(0, i) + typed + value.slice(i + typed.length));
            focus(Math.min(i + typed.length, length - 1, clean.length));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              if (digits[i]) {
                commit(digits.map((x, k) => (k === i ? "" : x)).join(""));
              } else if (i > 0) {
                commit(digits.map((x, k) => (k === i - 1 ? "" : x)).join(""));
                focus(i - 1);
              }
            } else if (e.key === "Delete") {
              e.preventDefault();
              commit(digits.map((x, k) => (k === i ? "" : x)).join(""));
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              focus(i - 1);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              focus(i + 1);
            } else if (e.key === "Home") {
              e.preventDefault();
              focus(0);
            } else if (e.key === "End") {
              e.preventDefault();
              focus(length - 1);
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const clean = commit(e.clipboardData.getData("text"));
            focus(Math.min(clean.length, length - 1));
          }}
          className={cn(
            "h-13 w-full min-w-0 rounded-2xl border bg-surface/90 text-center font-mono text-2xl font-black text-ink outline-none transition-all duration-200 sm:h-16 sm:text-3xl",
            "shadow-[0_2px_6px_rgba(0,0,0,0.04),_inset_0_1px_1px_rgba(255,255,255,0.2)]",
            invalid
              ? "border-red-500/80 bg-red-500/10 text-red-500 ring-2 ring-red-500/20"
              : d
              ? "border-brand/70 bg-brand/[0.05] text-brand shadow-[0_4px_14px_-2px_rgba(var(--brand)/0.25)] font-black"
              : "border-ink/15 hover:border-ink/30",
            "focus:border-brand focus:scale-[1.03] focus:ring-4 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      ))}
    </div>
  );
}
