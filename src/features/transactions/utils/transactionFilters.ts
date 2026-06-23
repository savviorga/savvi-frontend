import { endOfMonth, format, startOfDay, startOfMonth } from "date-fns";
import type { Transaction } from "../types/transactions.types";

/** Primer y último día del mes actual (inclusive). */
export function getCurrentMonthDateRange(reference = new Date()) {
  return {
    from: startOfDay(startOfMonth(reference)),
    to: startOfDay(endOfMonth(reference)),
  };
}

/** Filtra transacciones por rango inclusivo (YYYY-MM-DD). Sin fechas → sin filtro. */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  dateFrom: Date | null,
  dateTo: Date | null,
): Transaction[] {
  if (!dateFrom && !dateTo) return transactions;

  const from = dateFrom ? format(startOfDay(dateFrom), "yyyy-MM-dd") : null;
  const to = dateTo ? format(startOfDay(dateTo), "yyyy-MM-dd") : null;

  return transactions.filter((t) => {
    const d = t.date.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}
