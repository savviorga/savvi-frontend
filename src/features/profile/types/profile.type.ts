import type { User } from "@/features/auth/types/auth.type";

/** `PATCH /profile` — parcial. */
export interface UpdateProfileDto {
  name?: string;
  email?: string;
}

/** `PATCH /profile/password` */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface MonthlySummary {
  /** `YYYY-MM` */
  month: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface TopExpenseCategory {
  category: string;
  total: number;
  count: number;
}

/** `GET /profile/summary` */
export interface ProfileSummary {
  user: User;
  memberSince: string;
  daysActive: number;
  transactions: {
    count: number;
    incomeCount: number;
    expenseCount: number;
    transferCount: number;
    withAttachments: number;
    firstDate: string | null;
    lastDate: string | null;
    activeMonths: number;
  };
  totals: {
    income: number;
    expense: number;
    transfer: number;
    net: number;
    /** null si no hay ingresos */
    savingsRate: number | null;
  };
  averages: {
    monthlyIncome: number;
    monthlyExpense: number;
    expensePerTransaction: number;
  };
  currentMonth: MonthlySummary;
  /** Últimos 12 meses, del más antiguo al actual */
  monthly: MonthlySummary[];
  topExpenseCategories: TopExpenseCategory[];
  documents: { count: number };
  accounts: {
    count: number;
    active: number;
    credit: number;
    totalBalance: number;
    totalCreditLimit: number;
  };
  categories: { count: number; income: number; expense: number };
  budgets: { count: number; currentMonth: number; currentMonthAmount: number };
  debts: {
    count: number;
    pending: number;
    paid: number;
    overdue: number;
    totalRemaining: number;
    totalPaid: number;
    paymentsCount: number;
  };
  transferTemplates: { count: number; active: number };
  aiRegister: { count: number; completed: number; failed: number };
}
