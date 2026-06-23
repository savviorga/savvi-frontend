"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, Loader2, Sparkles } from "lucide-react";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { useCategories } from "@/features/categories/hooks/useCategories";
import SavvyBannerHome, {
  type SavvyBannerHomeStat,
} from "@/components/Banner/SavvyBannerHome";
import {
  filterByPeriod,
  getSummary,
  getExpensesByCategory,
  getEvolutionData,
  getTopExpenseCategory,
  getComparisonWithPreviousMonth,
  formatMoney,
  type Period,
  type PeriodType,
} from "@/features/dashboard/utils/dashboard.utils";
import EvolutionChart from "@/features/dashboard/components/EvolutionChart";
import ExpensesByCategoryChart from "@/features/dashboard/components/ExpensesByCategoryChart";
import InsightCards from "@/features/dashboard/components/InsightCards";
import PeriodSelector from "@/features/dashboard/components/PeriodSelector";
import DashboardSectionHeading from "@/features/dashboard/components/DashboardSectionHeading";
import { useReminders } from "@/features/transfer-templates/hooks/useReminders";
import ExecuteTransferModal from "@/features/transfer-templates/components/ExecuteTransferModal";
import { TransferTemplatesService } from "@/features/transfer-templates/services/transfer-templates.service";
import type {
  TransferTemplate,
  Reminder,
} from "@/features/transfer-templates/types/transfer.types";
import { Button } from "@/components/ui/shadcn-button";

const now = new Date();

function capitalizePeriod(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function DashboardPage() {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const { transactions, loading, reload: reloadTransactions } = useTransactions();
  const { categories } = useCategories();
  const { reminders, loading: remindersLoading, reload: reloadReminders, dismiss } =
    useReminders({ silent: true });

  const [payOpen, setPayOpen] = useState(false);
  const [payReminder, setPayReminder] = useState<Reminder | null>(null);

  const period: Period = useMemo(
    () => ({ type: periodType, month, year }),
    [periodType, month, year],
  );

  const periodLabel = useMemo(() => {
    if (periodType === "month") {
      return capitalizePeriod(
        format(new Date(year, month), "MMMM yyyy", { locale: es }),
      );
    }
    return String(year);
  }, [periodType, month, year]);

  const filtered = useMemo(
    () => filterByPeriod(transactions, period),
    [transactions, period],
  );

  const summary = useMemo(() => getSummary(filtered), [filtered]);
  const byCategory = useMemo(() => getExpensesByCategory(filtered), [filtered]);
  const evolutionData = useMemo(
    () => getEvolutionData(transactions, period),
    [transactions, period],
  );
  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const topCategory = useMemo(
    () => getTopExpenseCategory(byCategory, categoryNames),
    [byCategory, categoryNames],
  );
  const comparison = useMemo(
    () => getComparisonWithPreviousMonth(transactions, period),
    [transactions, period],
  );

  const bannerStats: SavvyBannerHomeStat[] = useMemo(
    () => [
      {
        label: "Ingresos",
        value: formatMoney(summary.ingresos),
        valueTone: "mint",
        hint: periodLabel,
      },
      {
        label: "Gastos",
        value: formatMoney(summary.gastos),
        valueTone: "rose",
        hint: periodLabel,
      },
      {
        label: "Balance",
        value: formatMoney(summary.balance),
        valueTone: summary.balance >= 0 ? "mint" : "rose",
        hint: periodLabel,
      },
    ],
    [summary, periodLabel],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-mint" aria-hidden />
        <p className="text-sm font-medium text-gray-500">Cargando tu resumen financiero…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <SavvyBannerHome
        title="Dashboard"
        subtitle="Resumen de ingresos, gastos y balance por periodo."
        badgeLabel="Resumen financiero"
        stats={bannerStats}
      />

      {!remindersLoading && reminders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-mint/25 bg-gradient-to-br from-mint/8 via-white to-white shadow-sm">
          <div className="border-b border-mint/15 bg-mint/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/15">
                <Bell className="h-5 w-5 text-mint" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0B1829]">
                  {reminders.length}{" "}
                  {reminders.length === 1
                    ? "pago pendiente de confirmar"
                    : "pagos pendientes de confirmar"}
                </p>
                <p className="text-xs text-gray-500">
                  Revisa el monto sugerido y confirma cuando estés listo.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {reminders.map((r) => {
              const tpl: TransferTemplate | undefined = r.template;
              const suggested = tpl?.lastAmount ?? null;

              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0B1829]">
                      {tpl?.name ?? "Plantilla"}
                      {suggested != null && (
                        <span className="ml-2 font-bold text-mint">
                          {formatMoney(Number(suggested))}
                        </span>
                      )}
                      <span className="ml-1 text-xs font-medium text-gray-400">
                        sugerido
                      </span>
                    </p>
                    {tpl?.payeeName ? (
                      <p className="mt-0.5 text-xs text-gray-500">{tpl.payeeName}</p>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setPayReminder(r);
                        setPayOpen(true);
                      }}
                    >
                      Pagar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await dismiss(r.id);
                      }}
                    >
                      Posponer
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PeriodSelector
        periodType={periodType}
        month={month}
        year={year}
        onPeriodTypeChange={setPeriodType}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />

      <section>
        <DashboardSectionHeading
          title="Insights"
          description="Patrones y comparativas de tu periodo"
          icon={Sparkles}
        />
        <InsightCards
          topCategory={topCategory}
          comparison={comparison}
          periodLabel={periodLabel}
        />
      </section>

      <EvolutionChart data={evolutionData} />

      <ExpensesByCategoryChart data={byCategory} categoryNames={categoryNames} />

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
    </div>
  );
}
