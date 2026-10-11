"use client";

import { useState } from "react";
import { addMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Minus, PiggyBank, Plus, Sparkles } from "lucide-react";
import { formatMoney } from "@/features/dashboard/utils/dashboard.utils";
import { cn } from "@/lib/utils";
import type { AdvisorBlock } from "../../types/proposal.types";

type SimulatorData = Extract<AdvisorBlock, { type: "simulator" }>;

/** Mismo paso que usa el servidor al redondear el rango. */
const stepFor = (max: number) => (max >= 5_000_000 ? 100_000 : max >= 500_000 ? 10_000 : 1_000);

function monthsLabel(months: number) {
  if (months <= 1) return "1 mes";
  if (months < 24) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} años y ${rest} ${rest === 1 ? "mes" : "meses"}` : `${years} años`;
}

/**
 * Simulador de ahorro: el usuario mueve el aporte mensual y ve en vivo cuánto
 * tarda en llegar a la meta. El cálculo es local (sin IA), así que no puede
 * inventar cifras; el modelo solo propone la meta y el rango.
 */
export default function SimulatorBlock({
  block,
  answer,
  disabled,
  onAnswer,
}: {
  block: SimulatorData;
  answer?: string;
  disabled?: boolean;
  onAnswer?: (answer: string) => void;
}) {
  const [monthly, setMonthly] = useState(block.suggested);
  const step = stepFor(block.max);
  const answered = answer !== undefined;
  const locked = answered || disabled || !onAnswer;

  const remaining = Math.max(0, block.goal - block.saved);
  const months = Math.max(1, Math.ceil(remaining / monthly));
  const reachDate = format(addMonths(new Date(), months), "MMMM 'de' yyyy", { locale: es });
  const savedPercent = Math.round((block.saved / block.goal) * 100);
  const fill = ((monthly - block.min) / (block.max - block.min)) * 100;
  // Tono según el plazo: rápido es verde, muy largo invita a subir el aporte.
  const pace = months <= 6 ? "text-emerald-600" : months <= 18 ? "text-mint-dim" : "text-amber-600";

  const nudge = (direction: 1 | -1) =>
    setMonthly((m) => Math.min(block.max, Math.max(block.min, m + direction * step)));

  return (
    <div className="savvi-msg-in mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-gradient-to-br from-mint/15 via-emerald-50 to-white px-4 pb-4 pt-3.5">
        <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-mint/20 blur-2xl" aria-hidden />
        <div className="relative flex items-center gap-2.5">
          <span className="savvi-pop flex h-9 w-9 items-center justify-center rounded-xl bg-white text-mint-dim shadow-sm">
            <PiggyBank className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{block.title}</p>
            <p className="text-xs text-slate-500">
              Meta {formatMoney(block.goal)}
              {block.saved > 0 && ` · llevas ${savedPercent}%`}
            </p>
          </div>
        </div>

        {/* Resultado: cambia con un pequeño salto cada vez que se mueve el control. */}
        <div className="relative mt-4 text-center" aria-live="polite">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Llegarías en</p>
          <p key={months} className={cn("savvi-pop text-3xl font-bold tracking-tight", pace)}>
            {monthsLabel(months)}
          </p>
          <p className="mt-0.5 text-xs capitalize text-slate-500">{reachDate}</p>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-4 pt-4">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor={`sim-${block.title}`} className="text-xs font-semibold text-slate-600">
              Ahorro mensual
            </label>
            <span className="text-lg font-bold tabular-nums text-[#0B1829]">{formatMoney(monthly)}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Menos"
              disabled={locked || monthly <= block.min}
              onClick={() => nudge(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition active:scale-90 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              id={`sim-${block.title}`}
              type="range"
              min={block.min}
              max={block.max}
              step={step}
              value={monthly}
              disabled={locked}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="savvi-range min-w-0 flex-1 disabled:cursor-default disabled:opacity-70"
              style={{ "--savvi-range-fill": `${fill}%` } as React.CSSProperties}
            />
            <button
              type="button"
              aria-label="Más"
              disabled={locked || monthly >= block.max}
              onClick={() => nudge(1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition active:scale-90 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-slate-400">
            <span>{formatMoney(block.min)}</span>
            <span>{formatMoney(block.max)}</span>
          </div>
        </div>

        {answered ? (
          <p className="savvi-msg-in flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
            <Check className="savvi-pop h-4 w-4" aria-hidden />
            Plan enviado a Savvi
          </p>
        ) : (
          <button
            type="button"
            disabled={locked}
            onClick={() =>
              onAnswer?.(
                `Puedo ahorrar ${formatMoney(monthly)} al mes para "${block.title}" (llegaría en ${monthsLabel(months)}). Ayúdame a armar el plan.`
              )
            }
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all duration-200 hover:shadow-lg active:scale-[.98] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" aria-hidden />
            Ahorrar {formatMoney(monthly)} al mes
          </button>
        )}
      </div>
    </div>
  );
}
