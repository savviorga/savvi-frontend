export type CategoryType = "ingreso" | "egreso";

export interface Category {
  id: string;
  name: string;
  type?: CategoryType;
  icon?: string;
  color?: string;
}

export interface Account {
  id: string;
  name: string;
}
