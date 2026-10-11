export type CategoryType = "ingreso" | "egreso";

export interface Category {
  id: string;
  name: string;
  type?: CategoryType;
  description?: string;
  icon?: string;
  color?: string;
  budgetLimit?: number;
  isActive: boolean;
  /** Grupo (categoría principal) al que pertenece; `null` si es principal. */
  parentId?: string | null;
  /** Transacciones registradas directamente en la categoría. Solo en `GET /categories`. */
  transactionsCount?: number;
  /** Presupuestos de la categoría (se eliminan con ella). Solo en `GET /categories`. */
  budgetsCount?: number;
}
