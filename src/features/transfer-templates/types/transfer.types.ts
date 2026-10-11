export type TransferRecurrenceType = "reminder" | "automatic";

export type TransferFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "custom";

export type ReminderStatus = "scheduled" | "sent" | "dismissed";

export interface TransferTemplate {
  id: string;
  userId: string;
  fromAccountId: string;

  name: string;
  /** Texto libre: referencia, número de crédito, link del portal de pago… */
  description?: string | null;
  payeeName: string;
  payeeAccount?: string | null;
  payeeBank?: string | null;

  lastAmount?: number | null;

  recurrenceType: TransferRecurrenceType;
  frequency: TransferFrequency;
  /** Solo si frequency === "custom": días entre cada vencimiento. */
  customIntervalDays?: number | null;
  dayOfMonth: number;
  nextDueDate: string; // ISO date: YYYY-MM-DD

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  templateId: string;
  scheduledAt: string;
  sentAt?: string | null;
  status: ReminderStatus;
  createdAt: string;

  template?: TransferTemplate;
}

/** PATCH parcial: solo envía los campos que quieras actualizar. */
export type UpdateTransferTemplateDto = Partial<{
  fromAccountId: string;
  name: string;
  /** Vacío borra la descripción. */
  description: string;
  payeeName: string;
  payeeAccount: string;
  payeeBank: string;
  recurrenceType: TransferRecurrenceType;
  frequency: TransferFrequency;
  customIntervalDays: number;
  dayOfMonth: number;
  /** YYYY-MM-DD; si se envía, gana sobre la fecha que el backend recalcula. */
  nextDueDate: string;
}>;

export interface CreateTransferTemplateDto {
  fromAccountId: string;
  name: string;
  description?: string;
  payeeName: string;
  payeeAccount?: string;
  payeeBank?: string;
  initialAmount?: number;
  recurrenceType: TransferRecurrenceType;
  frequency: TransferFrequency;
  /** Obligatorio si frequency es "custom". */
  customIntervalDays?: number;
  dayOfMonth: number;
}

export interface ExecuteTransferDto {
  templateId: string;
  amount: number;
  transactionType?: "ingreso" | "egreso" | "transferencia";
  description?: string;
}

