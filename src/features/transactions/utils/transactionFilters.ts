import { endOfMonth, format, startOfDay, startOfMonth } from "date-fns";
import type { Transaction } from "../types/transactions.types";
import type { Category } from "../types/catalog.types";

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

/** Minúsculas y sin tildes, para que "cafe" encuentre "Café". */
function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * `transaction.category` guarda el nombre, pero las transacciones antiguas guardan
 * el id: se traduce a nombre para agrupar y filtrar ambas por igual.
 */
function categoryNameResolver(categories: Category[]) {
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  return (value: string) => nameById.get(value) ?? value;
}

/** Categorías con al menos una transacción, ordenadas alfabéticamente. */
export function getTransactionCategoryNames(
  transactions: Transaction[],
  categories: Category[],
): string[] {
  const resolve = categoryNameResolver(categories);
  const names = new Set<string>();
  for (const t of transactions) {
    if (t.category) names.add(resolve(t.category));
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b, "es"));
}

/** Filtra por nombre de categoría. Sin categoría → sin filtro. */
export function filterTransactionsByCategory(
  transactions: Transaction[],
  categoryName: string,
  categories: Category[],
): Transaction[] {
  if (!categoryName) return transactions;
  const resolve = categoryNameResolver(categories);
  return transactions.filter((t) => resolve(t.category) === categoryName);
}

/** Búsqueda parcial en la descripción (tipo LIKE), sin distinguir mayúsculas ni tildes. */
export function filterTransactionsBySearch(
  transactions: Transaction[],
  search: string,
): Transaction[] {
  const query = normalizeSearchText(search);
  if (!query) return transactions;
  return transactions.filter((t) =>
    normalizeSearchText(t.description ?? "").includes(query),
  );
}
