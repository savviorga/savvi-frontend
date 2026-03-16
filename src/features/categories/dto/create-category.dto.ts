import type { CategoryType } from "../types/category.type";

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  budgetLimit?: number;
  isActive?: boolean;
  isDefault?: boolean;
}
