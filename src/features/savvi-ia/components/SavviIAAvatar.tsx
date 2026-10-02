"use client";

import { Sparkles } from "lucide-react";

interface SavviIAAvatarProps {
  size?: "sm" | "md";
  /** Muestra un anillo pulsante mientras la IA trabaja. */
  active?: boolean;
}

export default function SavviIAAvatar({ size = "sm", active = false }: SavviIAAvatarProps) {
  const dimensions = size === "md" ? "h-10 w-10" : "h-8 w-8";
  const icon = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span className={`relative inline-flex shrink-0 ${dimensions}`} aria-hidden>
      {active && (
        <span className="savvi-pulse-ring absolute inset-0 rounded-full bg-emerald-400/40" />
      )}
      <span
        className={`savvi-orb relative inline-flex ${dimensions} items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 shadow-sm shadow-emerald-500/30`}
      >
        <Sparkles className={`${icon} text-white`} />
      </span>
    </span>
  );
}
