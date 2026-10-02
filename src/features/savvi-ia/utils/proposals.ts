import { AccountService } from "@/features/accounts/services/account.service";
import { BudgetService } from "@/features/budgets/services/budget.service";
import { CategoryService } from "@/features/categories/services/category.service";
import { PaymentPlannerService } from "@/features/payment-planner/services/payment-planner.service";
import { TransactionService } from "@/features/transactions/services/transaction.service";
import { TransferTemplatesService } from "@/features/transfer-templates/services/transfer-templates.service";
import { getErrorMessages, isApiError } from "@/types/api-error.type";
import type {
  Proposal,
  ProposalData,
  ProposalItemResult,
  ProposalKind,
} from "../types/proposal.types";

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
};

export const proposalNoun = (kind: ProposalKind, count: number) =>
  count === 1 ? PROPOSAL_META[kind].one : PROPOSAL_META[kind].many;

export const toProposal = (data: ProposalData): Proposal =>
  ({ ...data, status: "pending", selected: data.items.map(() => true) }) as Proposal;

export type BadgeTone = "income" | "expense" | "credit" | "neutral";

export interface ProposalItemView {
  title: string;
  detail: string;
  badge?: { label: string; tone: BadgeTone };
  /** Monto destacado a la derecha */
  amount?: { value: number; tone: BadgeTone };
  color?: string;
}

const join = (...parts: (string | number | null | undefined | false)[]) => parts.filter(Boolean).join(" · ");

/** Cómo se ve cada ítem en la tarjeta. */
export function toItemViews(proposal: ProposalData): ProposalItemView[] {
  switch (proposal.kind) {
    case "categories":
      return proposal.items.map((item) => ({
        title: item.name,
        detail: join(item.description, item.budgetLimit && `Presupuesto: ${formatCop(item.budgetLimit)}/mes`),
        badge: item.type === "ingreso" ? { label: "Ingreso", tone: "income" } : { label: "Egreso", tone: "expense" },
        color: item.color,
      }));
    case "accounts":
      return proposal.items.map((item) => ({
        title: item.name,
        detail: join(
          item.description,
          item.initialBalance && `Saldo: ${formatCop(item.initialBalance)}`,
          item.creditLimit && `Cupo: ${formatCop(item.creditLimit)}`,
          item.statementDay && `Corte: día ${item.statementDay}`,
          item.dueDay && `Pago: día ${item.dueDay}`,
        ),
        badge: item.isCredit ? { label: "Crédito", tone: "credit" } : undefined,
      }));
    case "transactions":
      return proposal.items.map((item) => ({
        title: item.description || item.categoryName,
        detail: join(shortDate(item.date), item.categoryName, item.accountName),
        amount: { value: item.amount, tone: item.type === "ingreso" ? "income" : "expense" },
      }));
    case "budgets":
      return proposal.items.map((item) => ({
        title: item.categoryName,
        detail: join(
          `${MONTHS[item.month - 1]} ${item.year}`,
          item.currentAmount !== undefined ? `Antes: ${formatCop(item.currentAmount)}` : "Nuevo",
        ),
        amount: { value: item.amount, tone: "neutral" },
      }));
    case "debts":
      return proposal.items.map((item) => ({
        title: item.name,
        detail: join(
          item.payee,
          `Vence ${shortDate(item.dueDate)}`,
          item.isRecurring && `Cuota ${item.recurrenceType === "biweekly" ? "quincenal" : "mensual"}`,
          item.accountName,
        ),
        amount: { value: item.totalAmount, tone: "expense" },
      }));
    case "debtPayments":
      return proposal.items.map((item) => ({
        title: `Abono a ${item.debtName}`,
        detail: join(item.paidAt ? shortDate(item.paidAt) : "Hoy", item.accountName, item.categoryName),
        amount: { value: item.amount, tone: "expense" },
      }));
    case "recurring":
      return proposal.items.map((item) => ({
        title: item.name,
        detail: join(
          item.payeeName,
          `${FREQUENCY_LABEL[item.frequency]}, día ${item.dayOfMonth}`,
          item.recurrenceType === "automatic" ? "Automático" : "Recordatorio",
          item.accountName,
        ),
        amount: item.initialAmount ? { value: item.initialAmount, tone: "neutral" } : undefined,
      }));
  }
}

const describeItem = (view: ProposalItemView) =>
  join(view.title, view.detail, view.amount && formatCop(view.amount.value), view.badge?.label);

/** Resumen de la propuesta para el historial que ve el modelo. */
export function describeProposalForModel(proposal: Proposal): string {
  const items = toItemViews(proposal)
    .map((view) => `- ${describeItem(view)}`)
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
  const views = toItemViews(proposal);
  const ok: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];

  views.forEach((view, index) => {
    const result = proposal.results?.[index];
    const label = describeItem(view);
    if (!proposal.selected[index]) skipped.push(label);
    else if (result?.ok) ok.push(label);
    else if (result) failed.push(`${label}: ${result.error}`);
  });

  const meta = PROPOSAL_META[proposal.kind];
  return [
    `(Mensaje automático de la app, no lo escribió el usuario) Resultado de la propuesta de ${meta.many}:`,
    ok.length ? `Quedaron ${meta.doneMany}:\n${ok.map((c) => `- ${c}`).join("\n")}` : `No quedó ninguna ${meta.one} ${meta.done}.`,
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

/** Envía un ítem a su endpoint real con el payload exacto del DTO del backend. */
async function executeItem(proposal: ProposalData, index: number): Promise<void> {
  switch (proposal.kind) {
    case "categories":
      await CategoryService.create({ ...proposal.items[index], isActive: true });
      return;
    case "accounts":
      await AccountService.create(proposal.items[index]);
      return;
    case "transactions": {
      const t = proposal.items[index];
      await TransactionService.create({
        date: t.date,
        type: t.type,
        amount: t.amount,
        category: t.categoryId,
        account: t.accountId,
        description: t.description,
      });
      return;
    }
    case "budgets": {
      const b = proposal.items[index];
      await BudgetService.createOrUpdate({
        categoryId: b.categoryId,
        amount: b.amount,
        year: b.year,
        month: b.month,
        period: "monthly",
        isActive: true,
      });
      return;
    }
    case "debts": {
      const d = proposal.items[index];
      await PaymentPlannerService.create({
        name: d.name,
        payee: d.payee,
        totalAmount: d.totalAmount,
        dueDate: d.dueDate,
        accountId: d.accountId,
        notes: d.notes,
        isRecurring: d.isRecurring,
        recurrenceType: d.recurrenceType,
        recurrenceDay: d.recurrenceDay,
      });
      return;
    }
    case "debtPayments": {
      const p = proposal.items[index];
      await PaymentPlannerService.registerPayment(p.debtId, {
        amount: p.amount,
        account: p.accountId,
        category: p.categoryId,
        paidAt: p.paidAt,
        description: p.description,
      });
      return;
    }
    case "recurring": {
      const r = proposal.items[index];
      await TransferTemplatesService.create({
        fromAccountId: r.fromAccountId,
        name: r.name,
        payeeName: r.payeeName,
        payeeBank: r.payeeBank,
        initialAmount: r.initialAmount,
        recurrenceType: r.recurrenceType,
        frequency: r.frequency,
        dayOfMonth: r.dayOfMonth,
      });
      return;
    }
  }
}

/** Ejecuta en orden los ítems seleccionados, avisando el resultado de cada uno. */
export async function executeSelectedItems(
  proposal: Proposal,
  onResult: (index: number, result: ProposalItemResult) => void,
): Promise<void> {
  for (let index = 0; index < proposal.items.length; index += 1) {
    if (!proposal.selected[index]) continue;
    try {
      await executeItem(proposal, index);
      onResult(index, { ok: true });
    } catch (error) {
      onResult(index, { ok: false, error: errorText(error) });
    }
  }
}
