import { cn } from "@/lib/utils";

export type ProgressBarVariant = "teal" | "navy" | "orange" | "red";

export interface ProgressBarProps {
  /** Texto a la izquierda */
  label: string;
  /** Porcentaje 0–100 */
  value: number;
  /** Color del relleno y del porcentaje */
  variant?: ProgressBarVariant;
  className?: string;
}

const variantClass: Record<
  ProgressBarVariant,
  { fill: string; percent: string }
> = {
  teal: {
    fill: "bg-mint",
    percent: "text-mint",
  },
  navy: {
    fill: "bg-[#1B2640]",
    percent: "text-[#1B2640]",
  },
  orange: {
    fill: "bg-amber-500",
    percent: "text-amber-600",
  },
  red: {
    fill: "bg-red-500",
    percent: "text-red-600",
  },
};

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function ProgressBar({
  label,
  value,
  variant = "teal",
  className,
}: ProgressBarProps) {
  const pct = clampPercent(value);
  const v = variantClass[variant];

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <span className="text-sm font-bold text-slate-800">{label}</span>
        <span className={cn("shrink-0 text-sm font-bold tabular-nums", v.percent)}>
          {Math.round(pct)}%
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out", v.fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
