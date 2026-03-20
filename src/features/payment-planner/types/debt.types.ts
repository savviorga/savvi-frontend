export type DebtStatus = "pending" | "paid";
export type RecurrenceType = "monthly" | "biweekly";

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paidAt: string;
  transactionId: string | null;
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  payee: string;
  accountId?: string | null;
  totalAmount: number;
  remainingAmount: number;
  dueDate: string;
  notes: string | null;
  isRecurring: boolean;
  recurrenceType: RecurrenceType | null;
  recurrenceDay: number | null;
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
  payments?: DebtPayment[];
}

export interface CreateDebtDto {
  name: string;
  payee: string;
  accountId: string;
  totalAmount: number;
  dueDate: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceDay?: number;
}

export interface UpdateDebtDto {
  name?: string;
  payee?: string;
  accountId?: string | null;
  totalAmount?: number;
  dueDate?: string;
  notes?: string;
}

export interface RegisterPaymentDto {
  amount: number;
  paidAt?: string;
  account: string;
  category: string;
  description?: string;
}

export interface RegisterPaymentResult {
  debt: Debt;
  payment: DebtPayment;
  transaction: { id: string };
}
