"use client";

import { useCountUp } from "../hooks/useCountUp";
import { formatMoney } from "../utils/dashboard.utils";

/** Monto en pesos que se anima al aparecer o cambiar. */
export default function AnimatedMoney({
  value,
  className,
  duration,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const shown = useCountUp(value, duration);
  return (
    <span className={className} aria-label={formatMoney(value)}>
      <span aria-hidden className="tabular-nums">
        {formatMoney(Math.round(shown))}
      </span>
    </span>
  );
}
