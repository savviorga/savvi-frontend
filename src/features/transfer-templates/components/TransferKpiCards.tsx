"use client";

import { useMemo } from "react";
import { endOfMonth, startOfDay } from "date-fns";
import { CalendarClock, CircleAlert, Repeat, Wallet, type LucideIcon } from "lucide-react";
import { DASHBOARD_CARD, formatMoney } from "@/features/dashboard/utils/dashboard.utils";
import { cn } from "@/lib/utils";
import type { TransferTemplate } from "../types/transfer.types";
import { daysUntilDue, parseIsoDate } from "../utils/schedule";

type Kpi = {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  iconClass: string;
  valueClass?: string;
};

function pagos(n: number) {
  return n === 1 ? "1 pago" : `${n} pagos`;
}

function summarize(templates: TransferTemplate[]): Kpi[] {
  const active = templates.filter((t) => t.isActive);
  const monthEnd = endOfMonth(startOfDay(new Date()));
  const sum = (list: TransferTemplate[]) =>
    list.reduce((acc, t) => acc + Number(t.lastAmount ?? 0), 0);

  // Lo vencido también está pendiente de pago este mes.
  const thisMonth = active.filter((t) => parseIsoDate(t.nextDueDate) <= monthEnd);
  const next7 = active.filter((t) => {
    const d = daysUntilDue(t.nextDueDate);
    return d >= 0 && d <= 7;
  });
  const overdue = active.filter((t) => daysUntilDue(t.nextDueDate) < 0);

  return [
    {
      key: "month",
      label: "Por pagar este mes",
      value: formatMoney(sum(thisMonth)),
      hint: thisMonth.length ? `${pagos(thisMonth.length)} pendientes` : "Nada pendiente",
      icon: Wallet,
      iconClass: "bg-mint/10 text-mint-dim",
    },
    {
      key: "next7",
      label: "Próximos 7 días",
      value: formatMoney(sum(next7)),
      hint: next7.length ? pagos(next7.length) : "Sin vencimientos",
      icon: CalendarClock,
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      key: "overdue",
      label: "Vencidos",
      value: formatMoney(sum(overdue)),
      hint: overdue.length ? pagos(overdue.length) : "Todo al día",
      icon: CircleAlert,
      iconClass: overdue.length ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600",
      valueClass: overdue.length ? "text-rose-600" : undefined,
    },
    {
      key: "active",
      label: "Plantillas activas",
      value: String(active.length),
      hint: `de ${templates.length} en total`,
      icon: Repeat,
      iconClass: "bg-[#0B1829]/5 text-[#0B1829]",
    },
  ];
}

export default function TransferKpiCards({
  templates,
  loading = false,
}: {
  templates: TransferTemplate[];
  loading?: boolean;
}) {
  const kpis = useMemo(() => summarize(templates), [templates]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {kpis.map(({ key, label, value, hint, icon: Icon, iconClass, valueClass }) => (
        <div key={key} className={cn(DASHBOARD_CARD, "p-4 sm:p-5")}>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                iconClass
              )}
              aria-hidden
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <p className="text-xs font-medium uppercase leading-tight tracking-wider text-gray-500">
              {label}
            </p>
          </div>
          {loading ? (
            <div className="mt-4 space-y-2" aria-hidden>
              <div className="h-7 w-3/4 animate-pulse rounded-md bg-gray-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          ) : (
            <>
              <p
                className={cn(
                  "mt-3 truncate text-xl font-bold tabular-nums tracking-tight text-[#0B1829] sm:text-2xl",
                  valueClass
                )}
              >
                {value}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{hint}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
