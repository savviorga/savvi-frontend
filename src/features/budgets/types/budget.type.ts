export type BudgetPeriod = "monthly";

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  year: number;
  month: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDto {
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  year: number;
  month: number;
  isActive?: boolean;
}

