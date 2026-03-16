export type CategoryType = "ingreso" | "egreso";

export interface Category {
  id: string;
  name: string;
  type?: CategoryType;
}

export interface Account {
  id: string;
  name: string;
}
