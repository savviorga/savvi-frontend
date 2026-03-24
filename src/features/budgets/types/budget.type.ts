export type BudgetPeriod = "monthly";

export interface BudgetDetail {
  id: string;
  budgetId: string;
  label: string;
  description?: string | null;
  estimatedAmount?: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  /** Si es true, el monto es la suma de los montos estimados de las partidas. */
  amountAutoCalculated?: boolean;
  period: BudgetPeriod;
  year: number;
  month: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  details?: BudgetDetail[];
  category?: {
    id: string;
    name: string;
    type?: string;
  };
}

export interface CreateBudgetDto {
  categoryId: string;
  amount: number;
  /** Si es true, amount puede ser 0 y se actualiza sumando partidas. */
  amountAutoCalculated?: boolean;
  period: BudgetPeriod;
  year: number;
  month: number;
  isActive?: boolean;
}

export interface CreateBudgetDetailDto {
  label: string;
  description?: string;
  estimatedAmount?: number;
  sortOrder?: number;
}

export interface UpdateBudgetDetailDto {
  label?: string;
  description?: string | null;
  estimatedAmount?: number | null;
  sortOrder?: number;
}
