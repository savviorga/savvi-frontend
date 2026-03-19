"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { PeriodType } from "@/features/dashboard/utils/dashboard.utils";

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

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
      <span className="text-sm font-medium text-slate-600">Periodo:</span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPeriodTypeChange("month")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            periodType === "month"
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Por mes
        </button>
        <button
          type="button"
          onClick={() => onPeriodTypeChange("year")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            periodType === "year"
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Por año
        </button>
      </div>

      {periodType === "month" && (
        <>
          <select
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

