import type { CategoryType } from "../types/category.type";

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  description?: string;
  icon?: string;
  color?: string;
  /** `null` la deja como categoría principal. */
  parentId?: string | null;
  budgetLimit?: number;
  isActive?: boolean;
  isDefault?: boolean;
}
