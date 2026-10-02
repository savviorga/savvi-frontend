"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** La primera regla es obligatoria; las demás solo suman fuerza. */
export const PASSWORD_RULES = [
  {
    id: "length",
    label: "Mínimo 6 caracteres",
    test: (v: string) => v.length >= 6,
  },
  {
    id: "case",
    label: "Mayúscula y minúscula",
    test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
  {
    id: "number",
    label: "Al menos un número",
    test: (v: string) => /\d/.test(v),
  },
  {
    id: "symbol",
    label: "Un símbolo (!, @, #…)",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
] as const;

const STRENGTH_LEVELS = [
  { label: "Muy débil", text: "text-rose-500", bar: "bg-rose-400" },
  { label: "Débil", text: "text-rose-500", bar: "bg-rose-400" },
  { label: "Aceptable", text: "text-amber-500", bar: "bg-amber-400" },
  { label: "Fuerte", text: "text-mint-dim", bar: "bg-mint" },
  { label: "Muy fuerte", text: "text-mint-dim", bar: "bg-mint" },
] as const;

interface PasswordStrengthMeterProps {
  password: string;
}

export default function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  const rulesPassed = useMemo(
    () => PASSWORD_RULES.map((rule) => rule.test(password)),
    [password],
  );
  const strength = rulesPassed.filter(Boolean).length;
  const level = STRENGTH_LEVELS[password ? strength : 0];

  return (
    <div className="space-y-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 duration-200 animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {PASSWORD_RULES.map((rule, index) => (
            <span
              key={rule.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                index < strength ? level.bar : "bg-slate-200",
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "text-[11px] font-semibold transition-colors",
            level.text,
          )}
          aria-live="polite"
        >
          {level.label}
        </span>
      </div>

      <ul className="grid gap-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule, index) => (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 text-[11px] transition-colors",
              rulesPassed[index] ? "text-mint-dim" : "text-slate-500",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full transition-colors",
                rulesPassed[index]
                  ? "bg-mint/15 text-mint-dim"
                  : "bg-slate-200 text-slate-400",
              )}
              aria-hidden
            >
              <Check className="size-2.5 stroke-[3]" />
            </span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
