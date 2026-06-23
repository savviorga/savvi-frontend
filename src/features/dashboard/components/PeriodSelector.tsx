"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import type { PeriodType } from "@/features/dashboard/utils/dashboard.utils";
import { DASHBOARD_CARD } from "../utils/dashboard.utils";

export default function PeriodSelector({
  periodType,
  month,
  year,
  onPeriodTypeChange,
  onMonthChange,
  onYearChange,
}: {
  periodType: PeriodType;
  month: number;
  year: number;
  onPeriodTypeChange: (v: PeriodType) => void;
  onMonthChange: (v: number) => void;
  onYearChange: (v: number) => void;
}) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i), "MMMM", { locale: es }),
  }));

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const selectClass =
    "rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm font-medium text-[#0B1829] transition focus:border-mint focus:bg-white focus:outline-none focus:ring-2 focus:ring-mint/25";

  return (
    <div className={`${DASHBOARD_CARD} mb-6 flex flex-wrap items-center gap-4 p-4`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-[#0B1829]">
        <CalendarDays className="h-4 w-4 text-mint" aria-hidden />
        Periodo
      </div>

      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50/80 p-0.5">
        {(
          [
            { id: "month" as const, label: "Por mes" },
            { id: "year" as const, label: "Por año" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onPeriodTypeChange(id)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition ${
              periodType === id
                ? "bg-mint text-cosmos shadow-sm"
                : "text-gray-600 hover:text-[#0B1829]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {periodType === "month" && (
        <>
          <select
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className={selectClass}
            aria-label="Mes"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className={selectClass}
            aria-label="Año"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </>
      )}

      {periodType === "year" && (
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className={selectClass}
          aria-label="Año"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
