import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  isWithinInterval,
  startOfYear,
  endOfYear,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Transaction } from "@/features/transactions/types/transactions.types";

export type PeriodType = "month" | "year";

export interface Period {
  type: PeriodType;
  month: number;
  year: number;
}

export interface Summary {
  ingresos: number;
  gastos: number;
  balance: number;
}

export interface CategoryAmount {
  categoryId: string;
  total: number;
}

export interface EvolutionPoint {
  label: string;
  ingresos: number;
  gastos: number;
  balance: number;
}

/** Filtra transacciones por mes/año */
export function filterByPeriod(
  transactions: Transaction[],
  period: Period
): Transaction[] {
  const start =
    period.type === "month"
      ? startOfMonth(new Date(period.year, period.month))
      : startOfYear(new Date(period.year, 0));
  const end =
    period.type === "month"
      ? endOfMonth(new Date(period.year, period.month))
      : endOfYear(new Date(period.year, 0));

  return transactions.filter((t) => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start, end });
  });
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Resumen: total ingresos, gastos, balance para un conjunto de transacciones */
export function getSummary(transactions: Transaction[]): Summary {
  let ingresos = 0;
  let gastos = 0;
  for (const t of transactions) {
    const amount = toNumber(t.amount);
    if (t.type === "ingreso") ingresos += amount;
    else if (t.type === "egreso") gastos += amount;
    // transferencia: no sumamos a ingresos ni gastos para el balance general
  }
  return {
    ingresos,
    gastos,
    balance: ingresos - gastos,
  };
}

/** Gastos agrupados por categoría (solo egresos) */
export function getExpensesByCategory(
  transactions: Transaction[]
): CategoryAmount[] {
  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "egreso") continue;
    const amount = toNumber(t.amount);
    const current = byCategory.get(t.category) ?? 0;
    byCategory.set(t.category, current + amount);
  }
  return Array.from(byCategory.entries())
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}

/** Datos para gráfico de evolución: por mes (si period es month: últimos 12 meses; si year: meses del año) */
export function getEvolutionData(
  transactions: Transaction[],
  period: Period
): EvolutionPoint[] {
  const points: EvolutionPoint[] = [];
  if (period.type === "month") {
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(period.year, period.month, 1), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const inMonth = transactions.filter((t) => {
        const date = parseISO(t.date);
        return isWithinInterval(date, { start, end });
      });
      const s = getSummary(inMonth);
      points.push({
        label: format(d, "MMM yyyy", { locale: es }),
        ingresos: s.ingresos,
        gastos: s.gastos,
        balance: s.balance,
      });
    }
  } else {
    for (let m = 0; m < 12; m++) {
      const start = startOfMonth(new Date(period.year, m));
      const end = endOfMonth(new Date(period.year, m));
      const inMonth = transactions.filter((t) => {
        const date = parseISO(t.date);
        return isWithinInterval(date, { start, end });
      });
      const s = getSummary(inMonth);
      points.push({
        label: format(start, "MMM", { locale: es }),
        ingresos: s.ingresos,
        gastos: s.gastos,
        balance: s.balance,
      });
    }
  }
  return points;
}

/** Insight: categoría con más gasto en el periodo y monto */
export function getTopExpenseCategory(
  byCategory: CategoryAmount[],
  categoryNames: Record<string, string>
): { categoryName: string; total: number } | null {
  const top = byCategory[0];
  if (!top) return null;
  return {
    categoryName: categoryNames[top.categoryId] ?? top.categoryId,
    total: top.total,
  };
}

/** Comparación con mes anterior: gastos este mes vs mes pasado */
export function getComparisonWithPreviousMonth(
  transactions: Transaction[],
  period: Period
): { currentGastos: number; previousGastos: number; diffPercent: number } | null {
  if (period.type !== "month") return null;
  const current = filterByPeriod(transactions, period);
  const prevPeriod: Period = {
    type: "month",
    month: period.month === 0 ? 11 : period.month - 1,
    year: period.month === 0 ? period.year - 1 : period.year,
  };
  const previous = filterByPeriod(transactions, prevPeriod);
  const currentGastos = getSummary(current).gastos;
  const previousGastos = getSummary(previous).gastos;
  if (previousGastos === 0) {
    return { currentGastos, previousGastos, diffPercent: currentGastos > 0 ? 100 : 0 };
  }
  const diffPercent = ((currentGastos - previousGastos) / previousGastos) * 100;
  return { currentGastos, previousGastos, diffPercent };
}
