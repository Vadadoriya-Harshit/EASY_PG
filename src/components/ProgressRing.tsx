import { cn } from "@/lib/utils";

/**
 * Circular progress indicator.
 * - no `value`: indeterminate spinner. Use it only while a real request is pending.
 * - `value` 0..1: determinate ring (e.g. time remaining).
 */
export default function ProgressRing({ size = 18, stroke = 2.5, value, className, label }: { size?: number; stroke?: number; value?: number; className?: string; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const determinate = typeof value === "number";
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role={label ? "progressbar" : "presentation"}
      aria-label={label}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={determinate ? Math.round((value as number) * 100) : undefined}
      className={cn(!determinate && "animate-spin", className)}
      style={determinate ? { transform: "rotate(-90deg)" } : undefined}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.22} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={determinate ? c * (1 - Math.min(Math.max(value as number, 0), 1)) : c * 0.72}
        style={determinate ? { transition: "stroke-dashoffset 1s linear" } : undefined}
      />
    </svg>
  );
}
