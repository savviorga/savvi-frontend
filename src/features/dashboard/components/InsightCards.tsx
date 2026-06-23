"use client";

import { Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import { DASHBOARD_CARD, formatMoney } from "../utils/dashboard.utils";

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
        <div
          className={`${DASHBOARD_CARD} relative overflow-hidden p-5`}
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, #00C49A 8%, white), white 60%)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint/15">
              <Lightbulb className="h-5 w-5 text-mint" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Mayor gasto · {periodLabel}
              </p>
              <p className="mt-2 text-lg font-bold text-[#0B1829]">
                {topCategory.categoryName}
              </p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-mint">
                {formatMoney(topCategory.total)}
              </p>
            </div>
          </div>
        </div>
      )}

      {comparison != null && (
        <div className={`${DASHBOARD_CARD} p-5`}>
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                comparison.diffPercent > 0 ? "bg-rose-50" : "bg-mint/10"
              }`}
            >
              {comparison.diffPercent > 0 ? (
                <TrendingUp className="h-5 w-5 text-rose-500" aria-hidden />
              ) : (
                <TrendingDown className="h-5 w-5 text-mint" aria-hidden />
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                vs. mes anterior
              </p>
              <p className="mt-2 text-lg font-bold tabular-nums text-[#0B1829]">
                {formatMoney(comparison.currentGastos)}
              </p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  comparison.diffPercent > 0
                    ? "text-rose-600"
                    : comparison.diffPercent < 0
                      ? "text-mint"
                      : "text-gray-500"
                }`}
              >
                {comparison.diffPercent > 0 && "+"}
                {comparison.diffPercent.toFixed(1)}% (
                {formatMoney(comparison.previousGastos)} el mes pasado)
              </p>
            </div>
          </div>
        </div>
      )}

      {!topCategory && !comparison && (
        <div
          className={`${DASHBOARD_CARD} col-span-full p-8 text-center text-gray-500`}
        >
          <Lightbulb className="mx-auto h-8 w-8 text-gray-300" aria-hidden />
          <p className="mt-3 text-sm">
            Selecciona un periodo con datos para ver insights.
          </p>
        </div>
      )}
    </div>
  );
}
