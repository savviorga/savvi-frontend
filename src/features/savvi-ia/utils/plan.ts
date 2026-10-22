/**
 * Propuestas combinadas: una sola tarjeta crea lo que falta (cuentas,
 * categorías, subcategorías) y lo que lo usa (transacciones, presupuestos…).
 * Sin dependencias: lo usan el route handler y el navegador.
 */

import type { CategoryDraft, PlanItem, ProposalData } from "../types/proposal.types";

/** Cómo se nombra un ítem nuevo hasta que existe su id real. */
export const NEW_REF_PREFIX = "nueva:";

/** Orden de creación: primero lo que otros ítems necesitan; las transacciones al final. */
const CREATION_ORDER: Record<PlanItem["kind"], number> = {
  categories: 0,
  accounts: 1,
  budgets: 2,
  debts: 2,
  recurring: 2,
  debtPayments: 3,
  transactions: 4,
};

/** "Transporte › Uber", o el nombre si es principal. */
export const categoryLabel = (draft: CategoryDraft) =>
  draft.parentName ? `${draft.parentName} › ${draft.name}` : draft.name;

/** Los ítems de cualquier propuesta, cada uno con su tipo. */
export function planItems(proposal: ProposalData): PlanItem[] {
  if (proposal.kind === "plan") return proposal.items;
  return (proposal.items as PlanItem["draft"][]).map((draft) => ({ kind: proposal.kind, draft }) as PlanItem);
}

/** Ítems → propuesta: de un solo tipo si todos coinciden; si no, un plan en orden de creación. */
export function toProposalData(items: PlanItem[]): ProposalData {
  const kinds = new Set(items.map((item) => item.kind));
  if (kinds.size === 1) {
    return { kind: items[0].kind, items: items.map((item) => item.draft) } as ProposalData;
  }
  return { kind: "plan", items: [...items].sort((a, b) => CREATION_ORDER[a.kind] - CREATION_ORDER[b.kind]) };
}

/** La `ref` con la que los demás ítems usan a este, si es nuevo. */
export const ownRef = (item: PlanItem): string | undefined =>
  item.kind === "categories" || item.kind === "accounts" ? item.draft.ref : undefined;

/** Ids que usa un ítem: reales o `ref` de otro ítem de la misma propuesta. */
export function usedIds(item: PlanItem): string[] {
  const ids = (() => {
    switch (item.kind) {
      case "categories":
        return [item.draft.parentId];
      case "accounts":
        return [];
      case "transactions":
        return [item.draft.categoryId, item.draft.accountId, item.draft.toAccountId];
      case "budgets":
        return [item.draft.categoryId];
      case "debts":
        return [item.draft.accountId];
      case "debtPayments":
        return [item.draft.accountId, item.draft.categoryId];
      case "recurring":
        return [item.draft.fromAccountId];
    }
  })();
  return ids.filter((id): id is string => Boolean(id));
}

/**
 * Marca o desmarca un ítem sin dejar huérfanos: desmarcar la cuenta nueva
 * desmarca el gasto que la usa, y marcar el gasto vuelve a marcar la cuenta.
 */
export function toggleSelection(proposal: ProposalData, selected: boolean[], index: number): boolean[] {
  const items = planItems(proposal);
  const next = [...selected];
  const byRef = new Map(items.flatMap((item, i): [string, number][] => {
    const ref = ownRef(item);
    return ref ? [[ref, i]] : [];
  }));

  const set = (i: number, value: boolean) => {
    if (next[i] === value) return;
    next[i] = value;
    if (value) {
      for (const id of usedIds(items[i])) {
        const needed = byRef.get(id);
        if (needed !== undefined) set(needed, true);
      }
      return;
    }
    const ref = ownRef(items[i]);
    if (ref) items.forEach((item, j) => usedIds(item).includes(ref) && set(j, false));
  };

  set(index, !selected[index]);
  return next;
}
