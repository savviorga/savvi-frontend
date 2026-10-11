export type CategoryType = "ingreso" | "egreso";

export interface Category {
  id: string;
  name: string;
  type?: CategoryType;
  icon?: string;
  color?: string;
  /** Grupo (categoría principal) al que pertenece. */
  parentId?: string | null;
  isActive?: boolean;
}

export interface Account {
  id: string;
  name: string;
}
