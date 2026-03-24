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
import PeriodSelector from "../../src/features/dashboard/components/PeriodSelector";
import { useReminders } from "@/features/transfer-templates/hooks/useReminders";
import ExecuteTransferModal from "@/features/transfer-templates/components/ExecuteTransferModal";
import { TransferTemplatesService } from "@/features/transfer-templates/services/transfer-templates.service";
import type { TransferTemplate, Reminder } from "@/features/transfer-templates/types/transfer.types";

const now = new Date();

export default function DashboardPage() {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const { transactions, loading, reload: reloadTransactions } = useTransactions();
  const { categories } = useCategories();
  const { reminders, loading: remindersLoading, reload: reloadReminders, dismiss } = useReminders();

  const [payOpen, setPayOpen] = useState(false);
  const [payReminder, setPayReminder] = useState<Reminder | null>(null);

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

      {/* Recordatorios de transferencias recurrentes */}
      {!remindersLoading && reminders.length > 0 && (
        <div className="mb-6 rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                <span>🔔</span>
                Tienes {reminders.length} pagos por confirmar hoy
              </p>
              <p className="mt-1 text-xs text-emerald-800/70">
                Revisa el monto sugerido y confirma cuando estés listo.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {reminders.map((r) => {
              const tpl: TransferTemplate | undefined = r.template;
              const suggested = tpl?.lastAmount ?? null;

              return (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-emerald-200/60 bg-white/80 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {tpl?.name ?? "Plantilla"} —{" "}
                      {suggested == null ? "-" : `$${Number(suggested).toLocaleString("es-CO")}`}{" "}
                      <span className="text-xs font-medium text-slate-500">
                        (sugerido)
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {tpl?.payeeName ?? ""}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPayReminder(r);
                        setPayOpen(true);
                      }}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Pagar
                    </button>
                    <button
                      onClick={async () => {
                        await dismiss(r.id);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Posponer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selector de periodo */}
      <PeriodSelector
        periodType={periodType}
        month={month}
        year={year}
        onPeriodTypeChange={setPeriodType}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />

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

      <ExecuteTransferModal
        open={payOpen}
        onClose={() => {
          setPayOpen(false);
          setPayReminder(null);
        }}
        template={(payReminder?.template ?? null) as TransferTemplate | null}
        initialAmount={payReminder?.template?.lastAmount ?? null}
        onConfirm={async ({ amount, description }) => {
          if (!payReminder?.template) return;
          await TransferTemplatesService.execute(payReminder.template.id, {
            templateId: payReminder.template.id,
            amount,
            description,
          });
          setPayOpen(false);
          setPayReminder(null);
          await reloadTransactions();
          await reloadReminders();
        }}
      />
    </>
  );
}
