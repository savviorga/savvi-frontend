"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type {
  Transaction,
  TransactionType,
} from "../types/transactions.types";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const SINGLE_TYPE_LABEL: Record<TransactionType, string> = {
  ingreso: "Total ingresos",
  egreso: "Total gastos",
  transferencia: "Total transferido",
};

const SINGLE_TYPE_CLASS: Record<TransactionType, string> = {
  ingreso: "text-emerald-600",
  egreso: "text-rose-600",
  transferencia: "text-foreground",
};

export interface TransactionTotalsProps {
  /** Transacciones visibles (ya filtradas). */
  items: Transaction[];
  /** Pestaña de un solo tipo; sin tipo se muestran ingresos, gastos y balance. */
  type?: TransactionType;
  loading?: boolean;
  className?: string;
}

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0 sm:px-4">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-semibold tabular-nums sm:text-xl",
          valueClassName,
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export default function TransactionTotals({
  items,
  type,
  loading = false,
  className,
}: TransactionTotalsProps) {
  const totals = useMemo(() => {
    const sums: Record<TransactionType, number> = {
      ingreso: 0,
      egreso: 0,
      transferencia: 0,
    };
    for (const t of items) {
      if (t.type in sums) sums[t.type] += Number(t.amount) || 0;
    }
    return { ...sums, balance: sums.ingreso - sums.egreso };
  }, [items]);

  const show = (value: number) => (loading ? "—" : currency.format(value));

  return (
    <article
      className={cn(
        "mb-4 rounded-2xl border border-border bg-card p-3 sm:p-4",
        className,
      )}
      aria-label="Totales de las transacciones filtradas"
    >
      {type ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {SINGLE_TYPE_LABEL[type]}
          </p>
          <p
            className={cn(
              "text-lg font-semibold tabular-nums sm:text-2xl",
              SINGLE_TYPE_CLASS[type],
            )}
          >
            {show(totals[type])}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 divide-x divide-border">
          <Stat
            label="Ingresos"
            value={show(totals.ingreso)}
            valueClassName="text-emerald-600"
          />
          <Stat
            label="Gastos"
            value={show(totals.egreso)}
            valueClassName="text-rose-600"
          />
          <Stat
            label="Balance"
            value={show(totals.balance)}
            valueClassName={
              totals.balance < 0 ? "text-rose-600" : "text-foreground"
            }
          />
        </div>
      )}
    </article>
  );
}
