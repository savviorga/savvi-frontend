"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { useCategories } from "@/features/categories/hooks/useCategories";
import SavvyBanner from "@/components/Banner/SavvyBanner";
import {
  filterByPeriod,
  getSummary,
  getExpensesByCategory,
  getEvolutionData,
  getTopExpenseCategory,
  getComparisonWithPreviousMonth,
  type Period,
  type PeriodType,
} from "@/features/dashboard/utils/dashboard.utils";
import SummaryCards from "@/features/dashboard/components/SummaryCards";
import EvolutionChart from "@/features/dashboard/components/EvolutionChart";
import ExpensesByCategoryChart from "@/features/dashboard/components/ExpensesByCategoryChart";
import InsightCards from "@/features/dashboard/components/InsightCards";

const now = new Date();

export default function DashboardPage() {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const { transactions, loading } = useTransactions();
  const { categories } = useCategories();

  const period: Period = useMemo(
    () => ({ type: periodType, month, year }),
    [periodType, month, year]
  );

  const periodLabel = useMemo(() => {
    if (periodType === "month") {
      return format(new Date(year, month), "MMMM yyyy", { locale: es });
    }
    return String(year);
  }, [periodType, month, year]);

  const filtered = useMemo(
    () => filterByPeriod(transactions, period),
    [transactions, period]
  );

  const summary = useMemo(() => getSummary(filtered), [filtered]);
  const byCategory = useMemo(
    () => getExpensesByCategory(filtered),
    [filtered]
  );
  const evolutionData = useMemo(
    () => getEvolutionData(transactions, period),
    [transactions, period]
  );
  const categoryNames = useMemo(
    () =>
      Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );
  const topCategory = useMemo(
    () => getTopExpenseCategory(byCategory, categoryNames),
    [byCategory, categoryNames]
  );
  const comparison = useMemo(
    () => getComparisonWithPreviousMonth(transactions, period),
    [transactions, period]
  );

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i), "MMMM", { locale: es }),
  }));
  const years = Array.from(
    { length: 5 },
    (_, i) => now.getFullYear() - 2 + i
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-slate-500">Cargando dashboard…</p>
      </div>
    );
  }

  return (
    <>
      <SavvyBanner
        title="Dashboard"
        subtitle="Resumen por periodo: ingresos, gastos, balance y evolución."
      />

      {/* Selector de periodo */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-slate-600">Periodo:</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPeriodType("month")}
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
            onClick={() => setPeriodType("year")}
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
              onChange={(e) => setMonth(Number(e.target.value))}
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
              onChange={(e) => setYear(Number(e.target.value))}
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
            onChange={(e) => setYear(Number(e.target.value))}
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

      {/* Resumen: ingresos, gastos, balance */}
      <section className="mb-8">
        <SummaryCards summary={summary} periodLabel={periodLabel} />
      </section>

      {/* Tarjetas tipo "este mes gastaste X en Y" / "comparado con el mes pasado" */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Insights</h2>
        <InsightCards
          topCategory={topCategory}
          comparison={comparison}
          periodLabel={periodLabel}
        />
      </section>

      {/* Gráfico evolución en el tiempo */}
      <section className="mb-8">
        <EvolutionChart data={evolutionData} />
      </section>

      {/* Gastos por categoría (bar + pie) */}
      <section>
        <ExpensesByCategoryChart data={byCategory} categoryNames={categoryNames} />
      </section>
    </>
  );
}
