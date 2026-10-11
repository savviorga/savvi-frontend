"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import ChipSelect from "@/components/Inputs/ChipSelect";
import { cn } from "@/lib/utils";
import type { PeriodType } from "../utils/dashboard.utils";

const PERIOD_OPTIONS = [
  { label: "Mes", value: "month" },
  { label: "Año", value: "year" },
] as const;

function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

const NAV_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-gray-100 hover:text-[#0B1829] active:scale-90 disabled:pointer-events-none disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50";

/** Saludo y selector de periodo: Mes/Año y flechas para moverse en el tiempo. */
export default function DashboardHeader({
  name,
  periodType,
  periodLabel,
  canGoNext,
  onPeriodTypeChange,
  onPrev,
  onNext,
}: {
  name?: string;
  periodType: PeriodType;
  periodLabel: string;
  canGoNext: boolean;
  onPeriodTypeChange: (type: PeriodType) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const firstName = name?.trim().split(/\s+/)[0];

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
      <div>
        <p className="text-sm font-medium text-gray-500">{greeting()}</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1829] sm:text-3xl">
          {firstName ? `Hola, ${firstName}` : "Tu resumen"}
        </h1>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <ChipSelect
          ariaLabel="Ver por mes o por año"
          options={PERIOD_OPTIONS}
          value={periodType}
          onChange={onPeriodTypeChange}
        />
        <div className="flex items-center rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
          <button type="button" onClick={onPrev} className={NAV_BUTTON} aria-label="Periodo anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span
            key={periodLabel}
            className={cn(
              "min-w-[8.5rem] px-1 text-center text-sm font-semibold text-[#0B1829] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95",
            )}
            aria-live="polite"
          >
            {periodLabel}
          </span>
          <button type="button" onClick={onNext} disabled={!canGoNext} className={NAV_BUTTON} aria-label="Periodo siguiente">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
