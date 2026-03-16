"use client";

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

interface InsightCardsProps {
  topCategory: { categoryName: string; total: number } | null;
  comparison: {
    currentGastos: number;
    previousGastos: number;
    diffPercent: number;
  } | null;
  periodLabel: string;
}

export default function InsightCards({
  topCategory,
  comparison,
  periodLabel,
}: InsightCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {topCategory && (
        <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 shadow-lg shadow-slate-200/30">
          <p className="text-sm font-medium text-emerald-800/80">
            Donde más gastaste {periodLabel}
          </p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {topCategory.categoryName}: {formatMoney(topCategory.total)}
          </p>
        </div>
      )}
      {comparison != null && (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-200/30">
          <p className="text-sm font-medium text-slate-500">
            Comparado con el mes pasado
          </p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatMoney(comparison.currentGastos)} este mes
          </p>
          <p
            className={`mt-1 text-sm font-medium ${
              comparison.diffPercent > 0
                ? "text-rose-600"
                : comparison.diffPercent < 0
                  ? "text-emerald-600"
                  : "text-slate-500"
            }`}
          >
            {comparison.diffPercent > 0 && "+"}
            {comparison.diffPercent.toFixed(1)}% respecto al mes anterior (
            {formatMoney(comparison.previousGastos)})
          </p>
        </div>
      )}
      {!topCategory && !comparison && (
        <div className="col-span-2 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-5 text-center text-slate-500">
          Selecciona un periodo con datos para ver insights.
        </div>
      )}
    </div>
  );
}
