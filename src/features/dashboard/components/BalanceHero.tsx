"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedMoney from "./AnimatedMoney";
import { useCountUp } from "../hooks/useCountUp";
import { formatMoney, type Summary } from "../utils/dashboard.utils";

/** Anillo con el porcentaje de los ingresos que no se gastó. */
function SavingsRing({ percent }: { percent: number }) {
  const shown = useCountUp(Math.max(0, Math.min(100, percent)), 1100);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-[76px] w-[76px] shrink-0" role="img" aria-label={`Ahorro: ${Math.round(percent)}%`}>
      <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="#00D4AA"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-base font-bold tabular-nums">{Math.round(shown)}%</span>
        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/50">ahorro</span>
      </span>
    </div>
  );
}

/** Tarjeta principal: balance del periodo, ingresos, gastos y cuánto se ahorra. */
export default function BalanceHero({
  summary,
  periodLabel,
}: {
  summary: Summary;
  periodLabel: string;
}) {
  const { ingresos, gastos, balance } = summary;
  const savingsRate = ingresos > 0 ? (balance / ingresos) * 100 : null;
  const spentShare = ingresos > 0 ? Math.min(100, (gastos / ingresos) * 100) : gastos > 0 ? 100 : 0;
  const negative = balance < 0;

  const message =
    ingresos === 0 && gastos === 0
      ? "Aún no hay movimientos en este periodo."
      : negative
        ? `Gastaste ${formatMoney(-balance)} más de lo que ingresaste.`
        : savingsRate !== null
          ? `Guardas ${Math.round(savingsRate)}% de lo que ganas. ¡Bien!`
          : "Registra tus ingresos para ver cuánto ahorras.";

  return (
    <section
      className="relative isolate overflow-hidden rounded-3xl bg-[#0B1829] p-5 text-white shadow-xl shadow-[#0B1829]/15 sm:p-7 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500"
      aria-label="Balance del periodo"
    >
      {/* Brillos de fondo */}
      <span className="savvi-float absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-mint/25 blur-3xl" aria-hidden />
      <span className="savvi-float-slow absolute -bottom-24 -left-10 -z-10 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" aria-hidden />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/60">Balance · {periodLabel}</p>
          <AnimatedMoney
            value={balance}
            className={cn(
              "mt-1 block text-[2.15rem] font-bold leading-tight tracking-tight sm:text-5xl",
              negative ? "text-rose-300" : "text-white",
            )}
          />
          <p className="mt-1.5 text-sm text-white/70">{message}</p>
        </div>
        {savingsRate !== null && savingsRate > 0 && <SavingsRing percent={savingsRate} />}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
          <p className="flex items-center gap-1.5 text-xs font-medium text-white/60">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint/20 text-mint">
              <ArrowDownLeft className="h-3 w-3" aria-hidden />
            </span>
            Ingresos
          </p>
          <AnimatedMoney value={ingresos} className="mt-1 block text-lg font-bold sm:text-xl" />
        </div>
        <div className="rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
          <p className="flex items-center gap-1.5 text-xs font-medium text-white/60">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-400/20 text-rose-300">
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            </span>
            Gastos
          </p>
          <AnimatedMoney value={gastos} className="mt-1 block text-lg font-bold sm:text-xl" />
        </div>
      </div>

      {(ingresos > 0 || gastos > 0) && (
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "savvi-grow-x h-full rounded-full",
                spentShare >= 100 ? "bg-rose-400" : spentShare >= 85 ? "bg-amber-300" : "bg-mint",
              )}
              style={{ width: `${spentShare}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-white/50">
            {ingresos > 0
              ? `Has gastado el ${Math.round((gastos / ingresos) * 100)}% de tus ingresos`
              : "Sin ingresos registrados en este periodo"}
          </p>
        </div>
      )}
    </section>
  );
}
