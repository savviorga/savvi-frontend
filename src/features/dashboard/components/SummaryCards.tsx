"use client";

import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import type { Summary } from "../utils/dashboard.utils";
import { DASHBOARD_CARD, formatMoney } from "../utils/dashboard.utils";

interface SummaryCardsProps {
  summary: Summary;
  periodLabel: string;
}

const cards = [
  {
    key: "ingresos" as const,
    label: "Ingresos",
    icon: ArrowDownLeft,
    accent: "text-mint",
    iconBg: "bg-mint/10",
    iconColor: "text-mint",
  },
  {
    key: "gastos" as const,
    label: "Gastos",
    icon: ArrowUpRight,
    accent: "text-rose-600",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
  },
  {
    key: "balance" as const,
    label: "Balance",
    icon: Scale,
    accent: "",
    iconBg: "bg-[#0B1829]/5",
    iconColor: "text-[#0B1829]",
  },
];

export default function SummaryCards({ summary, periodLabel }: SummaryCardsProps) {
  const values = {
    ingresos: summary.ingresos,
    gastos: summary.gastos,
    balance: summary.balance,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ key, label, icon: Icon, accent, iconBg, iconColor }) => {
        const value = values[key];
        const valueClass =
          key === "balance"
            ? value >= 0
              ? "text-mint"
              : "text-rose-600"
            : accent;

        return (
          <div
            key={key}
            className={`${DASHBOARD_CARD} group relative overflow-hidden p-5 transition-shadow hover:shadow-md hover:shadow-gray-200/40`}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-mint/80 to-mint/20 opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
              >
                <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden />
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {periodLabel}
              </span>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-gray-500">
              {label}
            </p>
            <p className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${valueClass}`}>
              {formatMoney(value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
