import { AccountService } from "@/features/accounts/services/account.service";
import { BudgetService } from "@/features/budgets/services/budget.service";
import { CategoryService } from "@/features/categories/services/category.service";
import { PaymentPlannerService } from "@/features/payment-planner/services/payment-planner.service";
import { TransactionService } from "@/features/transactions/services/transaction.service";
import { TransferTemplatesService } from "@/features/transfer-templates/services/transfer-templates.service";
import { getErrorMessages, isApiError } from "@/types/api-error.type";
import type {
  PlanItem,
  Proposal,
  ProposalData,
  ProposalItemResult,
  ProposalKind,
  TransactionDraft,
} from "../types/proposal.types";
import type { CreateTransactionDto } from "@/features/transactions/types/transactions.types";
import { categoryLabel, ownRef, planItems } from "./plan";

/**
 * Transacciones por petición a `POST /transactions/bulk`. Los lotes se envían
 * en cola, uno tras otro, para no saturar la base de datos con una tabla larga.
 */
export const TRANSACTION_BATCH_SIZE = 20;

export const formatCop = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const FREQUENCY_LABEL = { weekly: "semanal", biweekly: "quincenal", monthly: "mensual", bimonthly: "bimestral" } as const;

const shortDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/** Textos por tipo: sustantivo, verbo del botón y participio del resultado. */
export const PROPOSAL_META: Record<
  ProposalKind,
  { one: string; many: string; verb: string; done: string; doneMany: string }
> = {
  categories: { one: "categoría", many: "categorías", verb: "Crear", done: "creada", doneMany: "creadas" },
  accounts: { one: "cuenta", many: "cuentas", verb: "Crear", done: "creada", doneMany: "creadas" },
  transactions: { one: "transacción", many: "transacciones", verb: "Registrar", done: "registrada", doneMany: "registradas" },
  budgets: { one: "presupuesto", many: "presupuestos", verb: "Guardar", done: "guardado", doneMany: "guardados" },
  debts: { one: "deuda", many: "deudas", verb: "Registrar", done: "registrada", doneMany: "registradas" },
  debtPayments: { one: "abono", many: "abonos", verb: "Registrar", done: "registrado", doneMany: "registrados" },
  recurring: { one: "pago recurrente", many: "pagos recurrentes", verb: "Crear", done: "creado", doneMany: "creados" },
  plan: { one: "cambio", many: "cambios", verb: "Confirmar", done: "guardado", doneMany: "guardados" },
};

export const proposalNoun = (kind: ProposalKind, count: number) =>
  count === 1 ? PROPOSAL_META[kind].one : PROPOSAL_META[kind].many;

/** "1 cuenta, 2 categorías y 1 transacción" */
export function describeCounts(proposal: ProposalData): string {
  const counts = new Map<PlanItem["kind"], number>();
  for (const item of planItems(proposal)) counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
  const parts = [...counts].map(([kind, count]) => `${count} ${proposalNoun(kind, count)}`);
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}` : (parts[0] ?? "");
}

/** Los ítems con advertencia (monto no verificado) arrancan desmarcados. */
export const toProposal = (data: ProposalData): Proposal =>
  ({
    ...data,
    status: "pending",
    selected: planItems(data).map(({ draft }) => !("warning" in draft && draft.warning)),
  }) as Proposal;

export type BadgeTone = "income" | "expense" | "credit" | "neutral";

export interface ProposalItemView {
  title: string;
  detail: string;
  badge?: { label: string; tone: BadgeTone };
  /** Monto destacado a la derecha */
  amount?: { value: number; tone: BadgeTone };
  color?: string;
  warning?: string;
  /** Archivo que queda como soporte (evidencia del chat). */
  attachment?: string;
}

const join = (...parts: (string | number | null | undefined | false)[]) => parts.filter(Boolean).join(" · ");

function itemView({ kind, draft: item }: PlanItem): ProposalItemView {
  switch (kind) {
    case "categories":
      return {
        title: categoryLabel(item),
        detail: join(item.description, item.budgetLimit && `Presupuesto: ${formatCop(item.budgetLimit)}/mes`),
        badge: item.type === "ingreso" ? { label: "Ingreso", tone: "income" } : { label: "Egreso", tone: "expense" },
        color: item.color,
      };
    case "accounts":
      return {
        title: item.name,
        detail: join(
          item.description,
          item.initialBalance && `Saldo: ${formatCop(item.initialBalance)}`,
          item.creditLimit && `Cupo: ${formatCop(item.creditLimit)}`,
          item.statementDay && `Corte: día ${item.statementDay}`,
          item.dueDay && `Pago: día ${item.dueDay}`,
        ),
        badge: item.isCredit ? { label: "Crédito", tone: "credit" } : undefined,
      };
    case "transactions":
      return {
        title: item.description || item.categoryName || "Transferencia",
        detail: join(
          shortDate(item.date),
          item.categoryName,
          item.toAccountName ? `${item.accountName} → ${item.toAccountName}` : item.accountName,
        ),
        amount: {
          value: item.amount,
          tone: item.type === "ingreso" ? "income" : item.type === "transferencia" ? "neutral" : "expense",
        },
        warning: item.warning,
        attachment: item.evidence?.name,
      };
    case "budgets":
      return {
        title: item.categoryName,
        detail: join(
          `${MONTHS[item.month - 1]} ${item.year}`,
          item.currentAmount !== undefined ? `Antes: ${formatCop(item.currentAmount)}` : "Nuevo",
        ),
        amount: { value: item.amount, tone: "neutral" },
      };
    case "debts":
      return {
        title: item.name,
        detail: join(
          item.payee,
          `Vence ${shortDate(item.dueDate)}`,
          item.isRecurring && `Cuota ${item.recurrenceType === "biweekly" ? "quincenal" : "mensual"}`,
          item.accountName,
        ),
        amount: { value: item.totalAmount, tone: "expense" },
      };
    case "debtPayments":
      return {
        title: `Abono a ${item.debtName}`,
        detail: join(item.paidAt ? shortDate(item.paidAt) : "Hoy", item.accountName, item.categoryName),
        amount: { value: item.amount, tone: "expense" },
      };
    case "recurring":
      return {
        title: item.name,
        detail: join(
          item.payeeName,
          `${FREQUENCY_LABEL[item.frequency]}, día ${item.dayOfMonth}`,
          item.recurrenceType === "automatic" ? "Automático" : "Recordatorio",
          item.accountName,
        ),
        amount: item.initialAmount ? { value: item.initialAmount, tone: "neutral" } : undefined,
      };
  }
}

/** Cómo se ve cada ítem en la tarjeta. */
export const toItemViews = (proposal: ProposalData): ProposalItemView[] => planItems(proposal).map(itemView);

const describeView = (view: ProposalItemView) =>
  join(
    view.title,
    view.detail,
    view.amount && formatCop(view.amount.value),
    view.badge?.label,
    view.attachment && `soporte: ${view.attachment}`,
  );

/** Cada ítem en una línea; en una propuesta combinada, con su tipo delante. */
function describeItems(proposal: ProposalData): string[] {
  return planItems(proposal).map((item) => {
    const text = describeView(itemView(item));
    return proposal.kind === "plan" ? `${PROPOSAL_META[item.kind].one}: ${text}` : text;
  });
}

/** Resumen de la propuesta para el historial que ve el modelo. */
export function describeProposalForModel(proposal: Proposal): string {
  const items = describeItems(proposal)
    .map((line) => `- ${line}`)
    .join("\n");
  const state =
    proposal.status === "dismissed"
      ? "El usuario la descartó; no se hizo nada."
      : proposal.status === "done"
        ? "El usuario ya respondió (ver el mensaje automático siguiente)."
        : "Pendiente de que el usuario la confirme en la tarjeta.";
  return `[Propuesta de ${PROPOSAL_META[proposal.kind].many}]\n${items}\n${state}`;
}

/** Mensaje automático tras confirmar: le dice al modelo qué quedó y qué falló. */
export function describeResultsForModel(proposal: Proposal): string {
  const ok: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];

  describeItems(proposal).forEach((label, index) => {
    const result = proposal.results?.[index];
    if (!proposal.selected[index]) skipped.push(label);
    else if (result?.ok) ok.push(result.note ? `${label} (${result.note})` : label);
    else if (result) failed.push(`${label}: ${result.error}`);
  });

  const meta = PROPOSAL_META[proposal.kind];
  return [
    `(Mensaje automático de la app, no lo escribió el usuario) Resultado de la propuesta de ${meta.many}:`,
    ok.length ? `Quedaron ${meta.doneMany}:\n${ok.map((c) => `- ${c}`).join("\n")}` : "No se guardó nada.",
    skipped.length ? `El usuario desmarcó:\n${skipped.map((s) => `- ${s}`).join("\n")}` : "",
    failed.length ? `Fallaron:\n${failed.map((f) => `- ${f}`).join("\n")}` : "",
    "Confírmale al usuario lo que quedó en una frase y sigue tomando la iniciativa con el siguiente paso.",
  ]
    .filter(Boolean)
    .join("\n");
}

const errorText = (error: unknown): string =>
  isApiError(error)
    ? getErrorMessages(error).join(", ")
    : error instanceof Error
      ? error.message
      : "Error inesperado";

/** Ids reales de lo que la propuesta ya creó, por su `ref`. */
type CreatedIds = Map<string, string>;

/**
 * Cambia la `ref` de un ítem nuevo de la propuesta por su id real. Si ese ítem
 * no se pudo crear, lo que lo usa tampoco se guarda.
 */
function resolver(refs: Set<string>, created: CreatedIds) {
  return function resolve<T extends string | undefined>(id: T, name?: string): T {
    if (!id || !refs.has(id)) return id;
    const real = created.get(id);
    if (!real) throw new Error(`No se guardó porque ${name ? `"${name}"` : "lo que necesita"} no se pudo crear.`);
    return real as T;
  };
}

type Resolve = ReturnType<typeof resolver>;

const toTransactionDto = (t: TransactionDraft, resolve: Resolve): CreateTransactionDto => ({
  date: t.date,
  type: t.type,
  amount: t.amount,
  categoryId: resolve(t.categoryId, t.categoryName),
  account: resolve(t.accountId, t.accountName),
  toAccount: resolve(t.toAccountId, t.toAccountName) ?? null,
  description: t.description,
});

/**
 * Adjunta la evidencia del chat como soporte de la transacción ya creada. Si
 * falla, la transacción queda igual y se avisa en la nota del resultado.
 */
async function attachEvidence(transactionId: string, draft: TransactionDraft): Promise<string | undefined> {
  if (!draft.evidence) return undefined;
  try {
    await TransactionService.confirmUpload(transactionId, [draft.evidence]);
    return undefined;
  } catch (error) {
    return `no se pudo adjuntar ${draft.evidence.name}: ${errorText(error)}`;
  }
}

/**
 * Envía un ítem a su endpoint real con el payload exacto del DTO del backend.
 * Devuelve el id de lo creado (si otros ítems lo usan) y una nota si quedó
 * creado con algún detalle.
 */
async function executeItem({ kind, draft }: PlanItem, resolve: Resolve): Promise<{ id?: string; note?: string }> {
  switch (kind) {
    case "categories": {
      const created = await CategoryService.create({
        name: draft.name,
        type: draft.type,
        description: draft.description,
        color: draft.color,
        budgetLimit: draft.budgetLimit,
        parentId: resolve(draft.parentId, draft.parentName),
        isActive: true,
      });
      return { id: created.id };
    }
    case "accounts": {
      const created = await AccountService.create({
        name: draft.name,
        description: draft.description,
        initialBalance: draft.initialBalance,
        isCredit: draft.isCredit,
        creditLimit: draft.creditLimit,
        statementDay: draft.statementDay,
        dueDay: draft.dueDay,
      });
      return { id: created.id };
    }
    case "transactions": {
      const created = await TransactionService.create(toTransactionDto(draft, resolve));
      return { note: await attachEvidence(created.id, draft) };
    }
    case "budgets":
      await BudgetService.createOrUpdate({
        categoryId: resolve(draft.categoryId, draft.categoryName),
        amount: draft.amount,
        year: draft.year,
        month: draft.month,
        period: "monthly",
        isActive: true,
      });
      return {};
    case "debts":
      await PaymentPlannerService.create({
        name: draft.name,
        payee: draft.payee,
        totalAmount: draft.totalAmount,
        dueDate: draft.dueDate,
        accountId: resolve(draft.accountId, draft.accountName),
        notes: draft.notes,
        isRecurring: draft.isRecurring,
        recurrenceType: draft.recurrenceType,
        recurrenceDay: draft.recurrenceDay,
      });
      return {};
    case "debtPayments":
      await PaymentPlannerService.registerPayment(draft.debtId, {
        amount: draft.amount,
        account: resolve(draft.accountId, draft.accountName),
        categoryId: resolve(draft.categoryId, draft.categoryName),
        paidAt: draft.paidAt,
        description: draft.description,
      });
      return {};
    case "recurring":
      await TransferTemplatesService.create({
        fromAccountId: resolve(draft.fromAccountId, draft.accountName),
        name: draft.name,
        payeeName: draft.payeeName,
        payeeBank: draft.payeeBank,
        initialAmount: draft.initialAmount,
        recurrenceType: draft.recurrenceType,
        frequency: draft.frequency,
        dayOfMonth: draft.dayOfMonth,
      });
      return {};
  }
}

type ResultHandler = (index: number, result: ProposalItemResult) => void;

async function executeOne(
  item: PlanItem,
  index: number,
  resolve: Resolve,
  created: CreatedIds,
  onResult: ResultHandler,
): Promise<void> {
  try {
    const { id, note } = await executeItem(item, resolve);
    const ref = ownRef(item);
    if (ref && id) created.set(ref, id);
    onResult(index, note ? { ok: true, note } : { ok: true });
  } catch (error) {
    onResult(index, { ok: false, error: errorText(error) });
  }
}

/** Lote rechazado antes de guardar (validación): el backend no insertó ninguna fila. */
const isRejectedBatch = (error: unknown) => isApiError(error) && error.statusCode >= 400 && error.statusCode < 500;

/**
 * Transacciones en cola de lotes de {@link TRANSACTION_BATCH_SIZE}: un lote no
 * sale hasta que el anterior terminó. Si el backend rechaza un lote por
 * validación, se reintenta fila por fila para marcar exactamente cuál falló;
 * si falla por red o servidor no se reintenta, para no duplicar registros.
 */
async function executeTransactionBatches(
  items: PlanItem[],
  indexes: number[],
  resolve: Resolve,
  created: CreatedIds,
  onResult: ResultHandler,
): Promise<void> {
  // Las que usan una cuenta o categoría que no se pudo crear fallan sin enviarse.
  const ready: { index: number; draft: TransactionDraft; dto: CreateTransactionDto }[] = [];
  for (const index of indexes) {
    const item = items[index];
    if (item.kind !== "transactions") continue;
    try {
      ready.push({ index, draft: item.draft, dto: toTransactionDto(item.draft, resolve) });
    } catch (error) {
      onResult(index, { ok: false, error: errorText(error) });
    }
  }

  for (let start = 0; start < ready.length; start += TRANSACTION_BATCH_SIZE) {
    const batch = ready.slice(start, start + TRANSACTION_BATCH_SIZE);
    let saved: Awaited<ReturnType<typeof TransactionService.bulk>>;
    try {
      saved = await TransactionService.bulk(batch.map((row) => row.dto));
    } catch (error) {
      if (isRejectedBatch(error)) {
        for (const row of batch) await executeOne(items[row.index], row.index, resolve, created, onResult);
      } else {
        const result: ProposalItemResult = { ok: false, error: errorText(error) };
        batch.forEach((row) => onResult(row.index, result));
      }
      continue;
    }
    // El backend devuelve las transacciones en el mismo orden del lote.
    for (const [position, row] of batch.entries()) {
      const transaction = saved[position];
      const note = transaction ? await attachEvidence(transaction.id, row.draft) : undefined;
      onResult(row.index, note ? { ok: true, note } : { ok: true });
    }
  }
}

/**
 * Ejecuta en orden los ítems seleccionados, avisando el resultado de cada uno.
 * Lo nuevo (cuentas, categorías) va primero y su id real reemplaza su `ref` en
 * lo que lo usa; las transacciones van al final, por lotes.
 */
export async function executeSelectedItems(proposal: Proposal, onResult: ResultHandler): Promise<void> {
  const items = planItems(proposal);
  const indexes = items.map((_, index) => index).filter((index) => proposal.selected[index]);
  const created: CreatedIds = new Map();
  const resolve = resolver(new Set(items.flatMap((item) => ownRef(item) ?? [])), created);
  for (const index of indexes) {
    if (items[index].kind !== "transactions") await executeOne(items[index], index, resolve, created, onResult);
  }
  await executeTransactionBatches(items, indexes, resolve, created, onResult);
}
