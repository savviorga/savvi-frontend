/**
 * Acciones que Savvi IA propone y el usuario confirma en una tarjeta. Nada se
 * crea en el servidor: al confirmar, el navegador envía cada borrador a su
 * endpoint real. Los campos `*Name` solo sirven para mostrar la tarjeta; el
 * payload que va al backend se arma en `utils/proposals.ts`.
 * Una propuesta puede crear lo que le falta (cuentas, categorías): mientras no
 * existe, cada ítem nuevo se nombra por su `ref` ("nueva:Nequi") y los demás
 * ítems lo usan en lugar del id real.
 * Lo comparten el route handler y el navegador: solo tipos, sin dependencias.
 */

/** `POST /categories` */
export interface CategoryDraft {
  /** "nueva:Grupo › Subcategoría": cómo la usan los demás ítems de la propuesta */
  ref?: string;
  name: string;
  type: "ingreso" | "egreso";
  /** Grupo, si es subcategoría: id real o `ref` de un grupo nuevo de la misma propuesta */
  parentId?: string;
  parentName?: string;
  description?: string;
  color?: string;
  budgetLimit?: number;
}

/** `POST /accounts` */
export interface AccountDraft {
  /** "nueva:Nombre": cómo la usan los demás ítems de la propuesta */
  ref?: string;
  name: string;
  description: string;
  initialBalance?: number;
  isCredit?: boolean;
  creditLimit?: number;
  statementDay?: number;
  dueDay?: number;
}

/** Evidencia (foto, captura o PDF) que el usuario adjuntó en el chat; vive en S3. */
export interface ChatAttachment {
  /** Key de S3 (`users/<userId>/savvi-ia/...`) */
  key: string;
  name: string;
  mimeType: string;
  size: number;
  /**
   * Lo que Savvi IA leyó del archivo (JSON compacto). Se guarda en el mensaje y
   * en los turnos siguientes viaja este texto en vez del archivo.
   */
  analysis?: string;
}

/** Archivo que queda como soporte de la transacción al confirmar. */
export interface EvidenceRef {
  key: string;
  name: string;
  size: number;
}

/** `POST /transactions/bulk`, por lotes */
export interface TransactionDraft {
  date: string;
  type: "ingreso" | "egreso" | "transferencia";
  amount: number;
  /** Opcional solo en transferencias (el backend usa "Transferencias"). */
  categoryId?: string;
  categoryName?: string;
  accountId: string;
  accountName: string;
  /** Transferencia: cuenta destino del usuario. */
  toAccountId?: string;
  toAccountName?: string;
  description?: string;
  /** El monto no aparece en el texto del usuario: la tarjeta lo muestra y lo deja desmarcado */
  warning?: string;
  /** Evidencia de la que salió el movimiento: se adjunta a la transacción al crearla */
  evidence?: EvidenceRef;
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

type SingleProposalData =
  | { kind: "categories"; items: CategoryDraft[] }
  | { kind: "accounts"; items: AccountDraft[] }
  | { kind: "transactions"; items: TransactionDraft[] }
  | { kind: "budgets"; items: BudgetDraft[] }
  | { kind: "debts"; items: DebtDraft[] }
  | { kind: "debtPayments"; items: DebtPaymentDraft[] }
  | { kind: "recurring"; items: RecurringDraft[] };

type ToPlanItem<P> = P extends { kind: infer K; items: (infer D)[] } ? { kind: K; draft: D } : never;

/** Un borrador con su tipo al lado: los ítems de una propuesta combinada. */
export type PlanItem = ToPlanItem<SingleProposalData>;

/**
 * `plan`: propuesta combinada (p. ej. la cuenta y la categoría que faltan más
 * el gasto que las usa), ordenada para crear primero lo que otros necesitan.
 */
export type ProposalData = SingleProposalData | { kind: "plan"; items: PlanItem[] };

export type ProposalKind = ProposalData["kind"];

/** `note`: quedó creado pero con un detalle (p. ej. no se pudo adjuntar la evidencia). */
export type ProposalItemResult = { ok: true; note?: string } | { ok: false; error: string };

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

/** Ícono de una opción: el cliente lo traduce a un ícono real. */
export type AdvisorOptionIcon =
  | "gasto"
  | "ingreso"
  | "ahorro"
  | "presupuesto"
  | "deuda"
  | "meta"
  | "calendario"
  | "tarjeta"
  | "grafico"
  | "pregunta";

/** Pantallas a las que un atajo puede llevar (lista cerrada). */
export type AdvisorDestination =
  | "transacciones"
  | "presupuestos"
  | "pagos_recurrentes"
  | "planificador"
  | "categorias"
  | "cuentas"
  | "dashboard";

export type AdvisorAlertTone = "peligro" | "advertencia" | "exito" | "info";

/**
 * Componente interactivo que el asesor adjunta a una burbuja. El modelo solo
 * elige de este catálogo y lo llena con datos; la app lo dibuja y valida.
 * - `options`: botones; tocar uno envía su texto como respuesta del usuario.
 * - `alert`: aviso destacado.
 * - `simulator`: simulador de ahorro; el cálculo lo hace la app, no el modelo.
 * - `shortcuts`: botones que llevan a otra pantalla de Savvi.
 */
export type AdvisorBlock =
  | {
      type: "options";
      question?: string;
      multiple: boolean;
      options: { text: string; description?: string; icon: AdvisorOptionIcon }[];
    }
  | { type: "alert"; tone: AdvisorAlertTone; title: string; detail?: string }
  | {
      type: "simulator";
      title: string;
      /** Monto a reunir, en COP */
      goal: number;
      /** Lo que ya tiene ahorrado para esa meta */
      saved: number;
      suggested: number;
      min: number;
      max: number;
    }
  | { type: "shortcuts"; buttons: { text: string; destination: AdvisorDestination }[] };

export type AdvisorBlockType = AdvisorBlock["type"];

/** Una burbuja del asesor: texto en markdown y, opcionalmente, un gráfico o un bloque. */
export interface AdvisorMessage {
  text: string;
  chart?: AdvisorChart;
  block?: AdvisorBlock;
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
  /** Lo que se leyó de cada evidencia nueva: el cliente lo guarda en el mensaje. */
  | { type: "evidence"; items: { key: string; analysis: string }[] }
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
