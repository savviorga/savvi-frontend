export type TransactionType = "ingreso" | "egreso" | "transferencia";

export interface Transaction {
  id: string;
  date: string; // ISO date: YYYY-MM-DD
  type: TransactionType;
  amount: number; // se normaliza a number
  category: string;
  account: string; // accountId
  description?: string;
}

export interface CreateTransactionDto {
  date: string;
  type: TransactionType;
  amount: number;
  category: string;
  account: string;
  description?: string;
  files?: File[];
}