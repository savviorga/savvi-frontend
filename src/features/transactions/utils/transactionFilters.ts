import { endOfMonth, format, startOfDay, startOfMonth } from "date-fns";
import type { Transaction } from "../types/transactions.types";
import { CATEGORY_PATH_SEPARATOR } from "@/features/categories/utils/category-tree";

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

export interface CategoryFilterOption {
  id: string;
  name: string;
}

/**
 * Categorías con al menos una transacción, en orden de grupo: cada grupo
 * (que filtra también sus subcategorías) seguido de "Grupo › Subcategoría".
 */
export function getTransactionCategoryOptions(
  transactions: Transaction[],
): CategoryFilterOption[] {
  const groups = new Map<string, { name: string; children: Map<string, string> }>();
  const groupFor = (id: string, name: string) => {
    const existing = groups.get(id);
    if (existing) return existing;
    const created = { name, children: new Map<string, string>() };
    groups.set(id, created);
    return created;
  };

  for (const t of transactions) {
    if (!t.categoryId) continue;
    const parent = t.category?.parent;
    if (parent) {
      groupFor(parent.id, parent.name).children.set(t.categoryId, t.category!.name);
    } else {
      groupFor(t.categoryId, t.category?.name ?? "Sin categoría");
    }
  }

  const byName = (a: [string, string], b: [string, string]) => a[1].localeCompare(b[1], "es");
  return [...groups]
    .map(([id, g]) => [id, g.name, g.children] as const)
    .sort((a, b) => a[1].localeCompare(b[1], "es"))
    .flatMap(([id, name, children]) => [
      { id, name },
      ...[...children].sort(byName).map(([childId, childName]) => ({
        id: childId,
        name: `${name}${CATEGORY_PATH_SEPARATOR}${childName}`,
      })),
    ]);
}

/** Filtra por categoría; si es un grupo incluye sus subcategorías. Vacío → sin filtro. */
export function filterTransactionsByCategory(
  transactions: Transaction[],
  categoryId: string,
): Transaction[] {
  if (!categoryId) return transactions;
  return transactions.filter(
    (t) => t.categoryId === categoryId || t.category?.parent?.id === categoryId,
  );
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
