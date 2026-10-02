/**
 * Acciones que Savvi IA propone y el usuario confirma en una tarjeta. Nada se
 * crea en el servidor: al confirmar, el navegador envía cada borrador a su
 * endpoint real. Los campos `*Name` solo sirven para mostrar la tarjeta; el
 * payload que va al backend se arma en `utils/proposals.ts`.
 * Lo comparten el route handler y el navegador: solo tipos, sin dependencias.
 */

/** `POST /categories` */
export interface CategoryDraft {
  name: string;
  type: "ingreso" | "egreso";
  description?: string;
  color?: string;
  budgetLimit?: number;
}

/** `POST /accounts` */
export interface AccountDraft {
  name: string;
  description: string;
  initialBalance?: number;
  isCredit?: boolean;
  creditLimit?: number;
  statementDay?: number;
  dueDay?: number;
}

/** `POST /transactions/bulk`, por lotes */
export interface TransactionDraft {
  date: string;
  type: "ingreso" | "egreso";
  amount: number;
  categoryId: string;
  categoryName: string;
  accountId: string;
  accountName: string;
  description?: string;
  /** El monto no aparece en el texto del usuario: la tarjeta lo muestra y lo deja desmarcado */
  warning?: string;
}

/** `POST /budgets` (crea o actualiza el de esa categoría y mes) */
export interface BudgetDraft {
  categoryId: string;
  categoryName: string;
  amount: number;
  year: number;
  month: number;
  /** Monto vigente si ya existía: la tarjeta muestra el cambio */
  currentAmount?: number;
}

/** `POST /payment-planner` */
export interface DebtDraft {
  name: string;
  payee: string;
  totalAmount: number;
  dueDate: string;
  accountId: string;
  accountName: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceType?: "monthly" | "biweekly";
  recurrenceDay?: number;
}

/** `POST /payment-planner/:id/register-payment` */
export interface DebtPaymentDraft {
  debtId: string;
  debtName: string;
  amount: number;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  paidAt?: string;
  description?: string;
}

/** `POST /transfer-templates` */
export interface RecurringDraft {
  fromAccountId: string;
  accountName: string;
  name: string;
  payeeName: string;
  payeeBank?: string;
  initialAmount?: number;
  recurrenceType: "reminder" | "automatic";
  frequency: "weekly" | "biweekly" | "monthly" | "bimonthly";
  dayOfMonth: number;
}

export type ProposalData =
  | { kind: "categories"; items: CategoryDraft[] }
  | { kind: "accounts"; items: AccountDraft[] }
  | { kind: "transactions"; items: TransactionDraft[] }
  | { kind: "budgets"; items: BudgetDraft[] }
  | { kind: "debts"; items: DebtDraft[] }
  | { kind: "debtPayments"; items: DebtPaymentDraft[] }
  | { kind: "recurring"; items: RecurringDraft[] };

export type ProposalKind = ProposalData["kind"];

export type ProposalItemResult = { ok: true } | { ok: false; error: string };

export type ProposalStatus = "pending" | "creating" | "done" | "dismissed";

/** Estado de la propuesta en el chat: qué se eligió y cómo terminó cada ítem. */
export type Proposal = ProposalData & {
  status: ProposalStatus;
  selected: boolean[];
  results?: (ProposalItemResult | null)[];
};

/** Paso que el asesor hizo antes de responder (se muestra en vivo). */
export interface AdvisorStep {
  label: string;
}

export type AdvisorChartType =
  | "barras"
  | "barras_horizontales"
  | "dona"
  | "linea"
  | "progreso"
  | "indicadores";

export type AdvisorValueFormat = "moneda" | "porcentaje" | "numero";

/**
 * Gráfico que el asesor adjunta a un mensaje. Cada serie trae un valor por etiqueta.
 * - `progreso`: serie 0 = gastado, serie 1 = límite (presupuestos).
 * - `indicadores`: tarjetas con la serie 0.
 * - `dona`: solo la serie 0.
 */
export interface AdvisorChart {
  type: AdvisorChartType;
  title: string;
  subtitle?: string;
  labels: string[];
  series: { name: string; values: number[] }[];
  format: AdvisorValueFormat;
}

/** Una burbuja del asesor: texto en markdown y, opcionalmente, un gráfico. */
export interface AdvisorMessage {
  text: string;
  chart?: AdvisorChart;
}

/** Tokens y costo estimado de OpenAI en una respuesta (o acumulados). */
export interface AdvisorUsage {
  /** Modelo que reportó OpenAI en la última llamada */
  model: string;
  /** Tokens de entrada, incluidos los que vinieron de caché */
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  /** Llamadas al modelo (una respuesta puede tener varias rondas de herramientas) */
  calls: number;
  costUsd: number;
  /** Llamadas de un modelo sin precio conocido: su costo no está en costUsd */
  unpricedCalls: number;
}

/** Eventos NDJSON de `POST /api/ai/chat`. */
export type AdvisorEvent =
  | { type: "step"; step: AdvisorStep }
  | {
      type: "reply";
      /** 1 a 3 mensajes cortos, como burbujas separadas */
      messages: AdvisorMessage[];
      /** Respuestas rápidas sugeridas al usuario */
      suggestions: string[];
      proposal?: ProposalData;
      usage: AdvisorUsage;
    }
  | { type: "error"; message: string; statusCode: number; usage?: AdvisorUsage };
