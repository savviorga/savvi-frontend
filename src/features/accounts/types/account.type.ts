export interface Account {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  description: string;
  isActive: boolean;
  balance?: number;
  isCredit?: boolean;
  creditLimit?: number;
  aprRate?: number;
  gracePeriodDays?: number;
  statementDay?: number;
  dueDay?: number;
  minPaymentPercent?: number;
  minPaymentAmount?: number;
}

export interface CreateAccountDto {
  name: string;
  description: string;
  initialBalance?: number;
  isCredit?: boolean;
  creditLimit?: number;
  aprRate?: number;
  gracePeriodDays?: number;
  statementDay?: number;
  dueDay?: number;
  minPaymentPercent?: number;
  minPaymentAmount?: number;
}