"use client";

import { Check, LineChart, Repeat2, Star } from "lucide-react";

const features = [
  {
    icon: Check,
    label: "Control de presupuesto mensual",
  },
  {
    icon: Repeat2,
    label: "Pagos recurrentes automáticos",
  },
  {
    icon: LineChart,
    label: "Reportes y análisis de gastos",
  },
] as const;

export default function LoginBrandingPanel() {
  return (
    <div className="flex flex-col bg-[#011627] px-6 py-10 text-white sm:px-8 sm:py-12 lg:h-full lg:min-h-0 lg:justify-between lg:px-10 lg:py-14 xl:px-14">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-mint shadow-[0_0_0_1px_rgba(0,210,160,0.35)]">
            <Star
              className="size-[22px] fill-[#011627] text-[#011627]"
              strokeWidth={0}
              aria-hidden
            />
          </div>
          <span className="text-xl font-bold tracking-tight">Savvi</span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#022031] px-3 py-1.5">
          <span
            className="size-2 shrink-0 rounded-full bg-emerald-400"
            aria-hidden
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mint">
            Finanzas personales
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.35rem] lg:leading-[1.15]">
            Tu dinero, bajo{" "}
            <span className="text-mint">control total.</span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
            Gestiona ingresos, egresos, presupuestos y pagos recurrentes desde un
            solo lugar.
          </p>
        </div>
      </div>

      <ul className="mt-10 space-y-4 lg:mt-0">
        {features.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-mint/50 bg-white/5">
              <Icon className="size-4 text-white" strokeWidth={2} />
            </span>
            <span className="text-sm font-medium leading-snug text-white/95 sm:text-[15px]">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
