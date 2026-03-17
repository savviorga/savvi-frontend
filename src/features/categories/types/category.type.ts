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
}
