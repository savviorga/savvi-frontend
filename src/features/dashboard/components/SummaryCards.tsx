"use client";

import type { Summary } from "../utils/dashboard.utils";

function formatMoney(value: number): string {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe);
}

interface SummaryCardsProps {
  summary: Summary;
  periodLabel: string;
}

export default function SummaryCards({ summary, periodLabel }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-200/30">
        <p className="text-sm font-medium text-slate-500">Ingresos</p>
        <p className="mt-1 text-2xl font-bold text-emerald-600">
          {formatMoney(summary.ingresos)}
        </p>
        <p className="mt-1 text-xs text-slate-400">{periodLabel}</p>
      </div>
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-200/30">
        <p className="text-sm font-medium text-slate-500">Gastos</p>
        <p className="mt-1 text-2xl font-bold text-rose-600">
          {formatMoney(summary.gastos)}
        </p>
        <p className="mt-1 text-xs text-slate-400">{periodLabel}</p>
      </div>
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-200/30">
        <p className="text-sm font-medium text-slate-500">Balance</p>
        <p
          className={`mt-1 text-2xl font-bold ${
            summary.balance >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {formatMoney(summary.balance)}
        </p>
        <p className="mt-1 text-xs text-slate-400">{periodLabel}</p>
      </div>
    </div>
  );
}
