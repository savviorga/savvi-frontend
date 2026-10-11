"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { useCategories } from "@/features/categories/hooks/useCategories";
import {
  filterByPeriod,
  getSummary,
  getExpensesByCategory,
  getFlowSeries,
  getSpendingPace,
  getTopExpenseCategory,
  getComparisonWithPreviousMonth,
  type Period,
  type PeriodType,
} from "@/features/dashboard/utils/dashboard.utils";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
import BalanceHero from "@/features/dashboard/components/BalanceHero";
import InsightTiles from "@/features/dashboard/components/InsightTiles";
import PendingPayments from "@/features/dashboard/components/PendingPayments";
import FlowChart from "@/features/dashboard/components/FlowChart";
import CategoryDonut from "@/features/dashboard/components/CategoryDonut";
import { useReminders } from "@/features/transfer-templates/hooks/useReminders";
import ExecuteTransferModal from "@/features/transfer-templates/components/ExecuteTransferModal";
import { getFirstErrorMessage } from "@/types/api-error.type";
import { TransferTemplatesService } from "@/features/transfer-templates/services/transfer-templates.service";
import type { TransferTemplate, Reminder } from "@/features/transfer-templates/types/transfer.types";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Cargando tu resumen">
      <div className="h-14 w-48 animate-pulse rounded-2xl bg-gray-200/70" />
      <div className="h-60 animate-pulse rounded-3xl bg-[#0B1829]/10" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-gray-200/60" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-3xl bg-gray-200/60" />
        <div className="h-80 animate-pulse rounded-3xl bg-gray-200/60" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const today = useMemo(() => new Date(), []);
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const { user } = useAuth();
  const { transactions, loading, reload: reloadTransactions } = useTransactions();
  const { categories } = useCategories();
  const { reminders, reload: reloadReminders, dismiss } = useReminders({ silent: true });
  const [payReminder, setPayReminder] = useState<Reminder | null>(null);

  const period: Period = useMemo(() => ({ type: periodType, month, year }), [periodType, month, year]);

  const periodLabel =
    periodType === "month"
      ? capitalize(format(new Date(year, month), "MMMM yyyy", { locale: es }))
      : String(year);

  const canGoNext =
    periodType === "month"
      ? year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth())
      : year < today.getFullYear();

  const shift = (step: 1 | -1) => {
    if (periodType === "year") {
      setYear((y) => y + step);
      return;
    }
    const next = new Date(year, month + step, 1);
    setMonth(next.getMonth());
    setYear(next.getFullYear());
  };

  const filtered = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);
  const summary = useMemo(() => getSummary(filtered), [filtered]);
  const byCategory = useMemo(() => getExpensesByCategory(filtered), [filtered]);
  const flow = useMemo(() => getFlowSeries(transactions, period), [transactions, period]);
  const comparison = useMemo(
    () => getComparisonWithPreviousMonth(transactions, period),
    [transactions, period],
  );
  const pace = useMemo(() => getSpendingPace(summary.gastos, period, today), [summary.gastos, period, today]);
  const topCategory = useMemo(
    () => getTopExpenseCategory(byCategory, Object.fromEntries(categories.map((c) => [c.id, c.name]))),
    [byCategory, categories],
  );

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5 pb-10 sm:space-y-6">
      <DashboardHeader
        name={user?.name}
        periodType={periodType}
        periodLabel={periodLabel}
        canGoNext={canGoNext}
        onPeriodTypeChange={(type) => {
          setPeriodType(type);
          if (type === "month" && year === today.getFullYear()) setMonth(today.getMonth());
        }}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
      />

      <BalanceHero summary={summary} periodLabel={periodLabel} />

      <InsightTiles
        dailyAvg={pace.dailyAvg}
        projected={pace.projected}
        comparison={comparison}
        topCategory={topCategory}
        totalExpenses={summary.gastos}
      />

      <PendingPayments
        reminders={reminders}
        onPay={setPayReminder}
        onPostpone={(r) => void dismiss(r.id)}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <FlowChart
          data={flow}
          title={periodType === "month" ? "Ingresos y gastos de los últimos 6 meses" : `Ingresos y gastos de ${year}`}
        />
        <CategoryDonut data={byCategory} categories={categories} />
      </div>

      <ExecuteTransferModal
        open={payReminder !== null}
        onClose={() => setPayReminder(null)}
        template={(payReminder?.template ?? null) as TransferTemplate | null}
        initialAmount={payReminder?.template?.lastAmount ?? null}
        onConfirm={async ({ amount, description }) => {
          if (!payReminder?.template) return null;
          try {
            const result = await TransferTemplatesService.execute(payReminder.template.id, {
              templateId: payReminder.template.id,
              amount,
              description,
            });
            toast.success("Pago registrado");
            await reloadTransactions();
            await reloadReminders();
            // El modal sube los adjuntos con este id y luego se cierra.
            return { transactionId: (result.transaction as { id?: string } | null)?.id ?? null };
          } catch (error) {
            toast.error(getFirstErrorMessage(error, "No se pudo registrar el pago"));
            return null;
          }
        }}
      />
    </div>
  );
}
