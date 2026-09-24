"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bus,
  Home,
  Sparkles,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const BALANCE = 4_850_000;
const INCOME = 6_200_000;
const EXPENSES = 1_350_000;

const months = [
  { label: "Abr", height: 46 },
  { label: "May", height: 62 },
  { label: "Jun", height: 38 },
  { label: "Jul", height: 74 },
  { label: "Ago", height: 55 },
  { label: "Sep", height: 88 },
] as const;

const movements = [
  {
    icon: ShoppingCart,
    label: "Mercado del mes",
    category: "Alimentación",
    amount: -182_000,
  },
  {
    icon: Home,
    label: "Arriendo",
    category: "Vivienda",
    amount: -1_100_000,
  },
  {
    icon: Bus,
    label: "Transporte",
    category: "Movilidad",
    amount: -68_000,
  },
] as const;

/** Cuenta desde 0 hasta `target` cuando el componente entra en pantalla. */
function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = reduced ? 1 : Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

/** Maqueta animada del resumen mensual, solo decorativa. */
export default function AppPreview() {
  const balance = useCountUp(BALANCE);

  return (
    <div className="relative" aria-hidden>
      <div className="pointer-events-none absolute -left-10 top-1/4 size-48 rounded-full bg-mint/20 blur-3xl savvi-float" />
      <div className="pointer-events-none absolute -right-8 bottom-8 size-40 rounded-full bg-sky-500/20 blur-3xl savvi-float-slow" />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-300/50 sm:p-6">
        <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-mint/10 to-transparent savvi-sheen" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Balance de septiembre
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#0a1628] sm:text-3xl">
              {money(balance)}
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl border border-mint/30 bg-mint/10">
            <Wallet className="size-5 text-mint-dim" strokeWidth={2} />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <ArrowUpRight className="size-3.5 text-mint-dim" />
              Ingresos
            </p>
            <p className="mt-1 text-sm font-bold tabular-nums text-[#0a1628]">
              {money(INCOME)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <ArrowDownRight className="size-3.5 text-rose-500" />
              Egresos
            </p>
            <p className="mt-1 text-sm font-bold tabular-nums text-[#0a1628]">
              {money(EXPENSES)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex h-24 items-end gap-2">
          {months.map((month, index) => (
            <div key={month.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-20 w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-t-md savvi-grow-bar",
                    index === months.length - 1
                      ? "bg-mint"
                      : "bg-mint/25",
                  )}
                  style={{
                    height: `${month.height}%`,
                    animationDelay: `${index * 90}ms`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400">{month.label}</span>
            </div>
          ))}
        </div>

        <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
          {movements.map(({ icon: Icon, label, category, amount }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon className="size-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-[#0a1628]">
                  {label}
                </span>
                <span className="block text-[11px] text-slate-400">
                  {category}
                </span>
              </span>
              <span className="text-xs font-semibold tabular-nums text-rose-500">
                {money(amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute -bottom-5 -left-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xl shadow-slate-300/60 savvi-float sm:-left-8">
        <span className="relative flex size-8 items-center justify-center rounded-lg bg-mint/15">
          <span className="absolute inset-0 rounded-lg bg-mint/30 savvi-pulse-ring" />
          <Sparkles className="relative size-4 text-mint-dim" strokeWidth={2} />
        </span>
        <span className="text-[11px] leading-tight text-slate-500">
          <span className="block font-semibold text-[#0a1628]">Savvi IA</span>
          “Almorcé 25 mil” → registrado
        </span>
      </div>

      <div className="absolute -right-2 -top-4 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl shadow-slate-300/60 savvi-float-slow sm:-right-6">
        <p className="text-[10px] font-medium text-slate-500">Alimentación</p>
        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[62%] rounded-full bg-mint" />
        </div>
        <p className="mt-1 text-[10px] font-medium text-mint-dim">62% del presupuesto</p>
      </div>
    </div>
  );
}
