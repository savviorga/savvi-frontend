"use client";

import { cn } from "@/lib/utils";

export type ChipOption<T extends string> = { label: string; value: T };

/**
 * Selector de una opción en forma de píldoras (p. ej. Frecuencia: Semanal, Mensual…).
 * La opción elegida va en mint de marca con texto oscuro para que siempre se lea.
 */
export default function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
  className,
}: {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50 disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-mint bg-mint text-cosmos shadow-sm"
                : "border-border bg-white text-foreground hover:border-mint/40 hover:bg-mint/5"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
