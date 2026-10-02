"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, CalendarRange, HandCoins, Wallet } from "lucide-react";
import { formatMoney } from "@/features/dashboard/utils/dashboard.utils";
import { useCountUp } from "@/hooks/useCountUp";
import type { ProfileSummary } from "../types/profile.type";

interface MetricCardProps {
  label: string;
  value: number;
  format: (n: number) => string;
  hint: string;
  icon: LucideIcon;
  tone: string;
  iconBg: string;
  index: number;
}

function MetricCard({ label, value, format, hint, icon: Icon, tone, iconBg, index }: MetricCardProps) {
  const animated = useCountUp(value, 1300, 150 + index * 90);

  return (
    <div
      className="savvi-profile-rise group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm shadow-gray-200/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/60"
      style={{ animationDelay: `${120 + index * 70}ms` }}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${iconBg}`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
          <p className={`mt-2 truncate text-2xl font-bold tabular-nums ${tone}`}>{format(animated)}</p>
          <p className="mt-1 truncate text-xs text-gray-400">{hint}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${tone}`} />
        </div>
      </div>
    </div>
  );
}

const integer = (n: number) => Math.round(n).toLocaleString("es-CO");

export default function ProfileMetricsGrid({ summary }: { summary: ProfileSummary }) {
  const { accounts, currentMonth, totals, averages, transactions, debts } = summary;
  const monthPositive = currentMonth.net >= 0;

  const cards: Omit<MetricCardProps, "index">[] = [
    {
      label: "Saldo en cuentas",
      value: accounts.totalBalance,
      format: formatMoney,
      hint: `${accounts.active} de ${accounts.count} cuentas activas`,
      icon: Wallet,
      tone: "text-mint",
      iconBg: "bg-mint/10",
    },
    {
      label: "Balance del mes",
      value: currentMonth.net,
      format: formatMoney,
      hint: `${currentMonth.count} movimientos este mes`,
      icon: CalendarRange,
      tone: monthPositive ? "text-teal-600" : "text-rose-600",
      iconBg: monthPositive ? "bg-teal-50" : "bg-rose-50",
    },
    {
      label: "Ingresos totales",
      value: totals.income,
      format: formatMoney,
      hint: `Promedio ${formatMoney(averages.monthlyIncome)} al mes`,
      icon: ArrowDownLeft,
      tone: "text-cyan-600",
      iconBg: "bg-cyan-50",
    },
    {
      label: "Gastos totales",
      value: totals.expense,
      format: formatMoney,
      hint: `Promedio ${formatMoney(averages.monthlyExpense)} al mes`,
      icon: ArrowUpRight,
      tone: "text-rose-600",
      iconBg: "bg-rose-50",
    },
    {
      label: "Transacciones",
      value: transactions.count,
      format: integer,
      hint: `${transactions.activeMonths} meses con movimientos`,
      icon: ArrowRightLeft,
      tone: "text-[#0B1829]",
      iconBg: "bg-slate-100",
    },
    {
      label: "Deudas por pagar",
      value: debts.totalRemaining,
      format: formatMoney,
      hint:
        debts.overdue > 0
          ? `${debts.pending} pendientes · ${debts.overdue} vencidas`
          : `${debts.pending} pendientes`,
      icon: HandCoins,
      tone: debts.overdue > 0 ? "text-rose-600" : "text-amber-600",
      iconBg: debts.overdue > 0 ? "bg-rose-50" : "bg-amber-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, i) => (
        <MetricCard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
}
