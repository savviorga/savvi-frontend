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