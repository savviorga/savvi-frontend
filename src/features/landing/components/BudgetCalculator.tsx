"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Home, PiggyBank, Smile } from "lucide-react";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import { cn } from "@/lib/utils";

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));

const buckets = [
  {
    id: "necesidades",
    icon: Home,
    share: 0.5,
    title: "50% · Necesidades",
    description: "Arriendo, servicios, mercado, transporte, salud y deudas fijas.",
    bar: "bg-[#011627]",
    tint: "bg-slate-100 text-[#011627]",
  },
  {
    id: "deseos",
    icon: Smile,
    share: 0.3,
    title: "30% · Gustos",
    description: "Salidas, suscripciones, ropa, viajes y todo lo que disfrutas.",
    bar: "bg-sky-500",
    tint: "bg-sky-50 text-sky-600",
  },
  {
    id: "ahorro",
    icon: PiggyBank,
    share: 0.2,
    title: "20% · Ahorro y futuro",
    description: "Fondo de emergencia, abonos extra a deudas e inversión.",
    bar: "bg-mint",
    tint: "bg-mint/10 text-mint-dim",
  },
] as const;

const presets = [1_500_000, 2_500_000, 4_000_000, 6_000_000] as const;

export default function BudgetCalculator() {
  const [income, setIncome] = useState<number | null>(3_000_000);
  const value = income && income > 0 ? income : 0;

  /** Con el 20% de ahorro, juntar 3 meses de gastos (80% del ingreso) toma 12 meses. */
  const emergencyFund = value * 0.8 * 3;
  const weeklyFun = (value * 0.3) / 4.3;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
      <label
        htmlFor="landing-income"
        className="block text-sm font-semibold text-[#0a1628]"
      >
        ¿Cuánto recibes al mes?
      </label>
      <p className="mt-1 text-xs text-slate-500">
        Usa tu ingreso después de impuestos y descuentos.
      </p>

      <div className="mt-3">
        <CurrencyField
          value={income}
          onChange={setIncome}
          placeholder="$ 3.000.000"
          className="h-12 rounded-lg border-slate-200 text-left text-lg font-bold text-[#0a1628] shadow-sm focus:border-mint/60 focus:ring-mint/20"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setIncome(preset)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              income === preset
                ? "border-mint bg-mint/10 text-mint-dim"
                : "border-slate-200 text-slate-500 hover:border-mint/50 hover:text-mint-dim",
            )}
          >
            {money(preset)}
          </button>
        ))}
      </div>

      <div className="mt-7 space-y-5">
        {buckets.map(({ id, icon: Icon, share, title, description, bar, tint }) => (
          <div key={id}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    tint,
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-semibold text-[#0a1628]">
                  {title}
                </span>
              </span>
              <span className="text-sm font-bold tabular-nums text-[#0a1628]">
                {money(value * share)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-700 ease-out",
                  bar,
                )}
                style={{ width: value > 0 ? `${share * 100}%` : "0%" }}
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              {description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-medium text-slate-500">
            Puedes gastar en gustos
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-[#0a1628]">
            {money(weeklyFun)}
            <span className="ml-1 text-xs font-medium text-slate-500">
              / semana
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-mint/30 bg-mint/5 p-4">
          <p className="text-xs font-medium text-slate-500">
            Tu fondo de emergencia (3 meses)
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-[#0a1628]">
            {money(emergencyFund)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Ahorrando el 20%, lo completas en unos 12 meses.
          </p>
        </div>
      </div>

      <Link
        href="/register"
        className="group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#011627] text-sm font-bold text-white transition-colors hover:bg-[#02253a]"
      >
        Llevar este plan a Savvi
        <ArrowRight
          className="size-4 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden
        />
      </Link>
      <p className="mt-3 text-center text-[11px] text-slate-400">
        Cálculo orientativo. No es asesoría financiera.
      </p>
    </div>
  );
}
