/**
 * Convierte los argumentos de una herramienta `proponer_*` en una propuesta
 * válida para la tarjeta. Descarta lo que no cumple el DTO del backend o apunta
 * a ids que no son del usuario, y explica por qué para que el modelo corrija.
 * Solo servidor.
 */

import type {
  AccountDraft,
  BudgetDraft,
  CategoryDraft,
  ChatAttachment,
  DebtDraft,
  DebtPaymentDraft,
  PlanItem,
  ProposalData,
  RecurringDraft,
  TransactionDraft,
} from "@/features/savvi-ia/types/proposal.types";
import { NEW_REF_PREFIX, categoryLabel, planItems, toProposalData } from "@/features/savvi-ia/utils/plan";
import type { Budget } from "@/features/budgets/types/budget.type";
import type { AdvisorCatalog } from "./snapshot";
import { todayInBogota } from "./snapshot";
import type { ProposalToolName } from "./tools";

const MAX_ITEMS = 20;
/** Las transacciones se guardan por lotes (`/transactions/bulk`): admiten tablas largas. */
const MAX_TRANSACTIONS = 100;
/** Desde cuántas filas se verifica cada monto contra lo que escribió el usuario. */
const VERIFY_FROM_ITEMS = 3;

type Args = Record<string, unknown>;
type Raw = Record<string, unknown>;

export interface ProposalCheck {
  message?: string;
  proposal: ProposalData | null;
  /** Qué se descartó y por qué; se le devuelve al modelo si no quedó nada */
  problems: string[];
}

const maxItems = (kind: PlanItem["kind"]) => (kind === "transactions" ? MAX_TRANSACTIONS : MAX_ITEMS);

const text = (value: unknown, max: number): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

const positive = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : undefined;

const intIn = (value: unknown, min: number, max: number): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : undefined;

const isoDate = (value: unknown): string | undefined => {
  const v = text(value, 10);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : undefined;
};

const normalize = (name: string) => name.trim().toLocaleLowerCase("es");

/** Para comparar rutas de categoría: "Transporte > Uber" y "transporte › uber" son la misma. */
const labelKey = (label: string) => normalize(label).replace(/\s*(?:›|>|\/)\s*/g, " › ");

function list(args: Args, key: string, problems: string[], max = MAX_ITEMS): Raw[] {
  const raw = args[key];
  if (!Array.isArray(raw)) return [];
  if (raw.length > max) problems.push(`Solo se aceptan ${max} ${key} por propuesta; se descartaron ${raw.length - max}.`);
  return raw.slice(0, max) as Raw[];
}

const MULTIPLIERS: Record<string, number> = { mil: 1e3, k: 1e3, millon: 1e6, millón: 1e6, millones: 1e6 };

/**
 * Montos que aparecen en lo que escribió el usuario, en formato colombiano
 * ("4.500.000,50") o anglo ("4,500,000.50"), y con "mil"/"millones"/"k".
 * Ante la duda se guardan todas las lecturas posibles: sirve para detectar
 * montos inventados, no para interpretar el texto.
 */
export function amountsIn(text: string): Set<number> {
  const found = new Set<number>();
  const pattern = /\d[\d.,]*(?:\s*(mil(?:lones|lón|lon)?|k)\b)?/gi;
  for (const match of text.matchAll(pattern)) {
    const token = match[0].replace(/\s*[a-zñó]+$/i, "").replace(/[.,]+$/, "");
    const factor = match[1] ? MULTIPLIERS[match[1].toLocaleLowerCase("es")] ?? 1 : 1;
    const digits = token.replace(/[.,]/g, "");
    const readings = [Number(digits)];
    const decimal = token.match(/^(.*)[.,](\d{1,2})$/);
    if (decimal) readings.push(Number(`${decimal[1].replace(/[.,]/g, "")}.${decimal[2]}`));
    for (const value of readings) {
      if (!Number.isFinite(value)) continue;
      found.add(Math.round(value * 100) / 100);
      found.add(Math.round(value * factor * 100) / 100);
    }
  }
  return found;
}

/** Registra por qué se descartó un ítem y lo quita de la lista. */
const rejecter = (problems: string[]) => (reason: string): [] => {
  problems.push(reason);
  return [];
};

/**
 * Busca por id y, si no, por nombre: "nueva:<nombre>" es algo que se propone en
 * esta misma respuesta (ya está en el catálogo extendido por {@link withProposed})
 * o que ya existía con ese nombre. El modelo a veces omite el prefijo, así que
 * también vale el nombre solo; en categorías basta el de la subcategoría. Solo
 * se acepta si coincide con uno.
 */
function findIn<T extends { id: string; name: string }>(items: T[], id: unknown): T | undefined {
  if (typeof id !== "string") return undefined;
  const exact = items.find((item) => item.id === id);
  if (exact) return exact;
  const raw = id.trim();
  const wanted = labelKey(normalize(raw).startsWith(NEW_REF_PREFIX) ? raw.slice(NEW_REF_PREFIX.length) : raw);
  if (!wanted) return undefined;
  const byLabel = items.filter((item) => labelKey(item.name) === wanted);
  if (byLabel.length === 1) return byLabel[0];
  const byLeaf = items.filter((item) => labelKey(item.name).split(" › ").at(-1) === wanted);
  return byLeaf.length === 1 ? byLeaf[0] : undefined;
}

function lookup(catalog: AdvisorCatalog) {
  return {
    category: (id: unknown) => findIn(catalog.categories, id),
    account: (id: unknown) => findIn(catalog.accounts, id),
    debt: (id: unknown) => catalog.debts.find((d) => d.id === id),
  };
}

const ALREADY_EXISTS = " ya existe.";

/**
 * No quedó nada por crear porque todo ya existía: no es un error que corregir,
 * y lo que lo use con "nueva:<nombre>" encuentra lo que ya está.
 */
export const onlyExisting = (check: ProposalCheck) =>
  !check.proposal && check.problems.length > 0 && check.problems.every((p) => p.endsWith(ALREADY_EXISTS));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Nombre de un grupo que el modelo nombró sin proponerlo; un id inventado no cuenta. */
function groupName(grupo: unknown): string | undefined {
  const raw = text(grupo, 200);
  if (!raw || UUID.test(raw)) return undefined;
  const name = (normalize(raw).startsWith(NEW_REF_PREFIX) ? raw.slice(NEW_REF_PREFIX.length) : raw).trim();
  return name && !/[›>/]/.test(name) ? name.slice(0, 100) : undefined;
}

function categories(args: Args, catalog: AdvisorCatalog, problems: string[]): CategoryDraft[] {
  const fail = rejecter(problems);
  const seen = new Set(catalog.categories.map((c) => labelKey(c.name)));
  /** Lo propuesto en esta lista: una subcategoría puede colgar de un grupo nuevo. */
  const proposed: AdvisorCatalog["categories"] = [];
  // Los grupos primero, para que existan antes que sus subcategorías.
  const rows = list(args, "categorias", problems).sort((a, b) => Number(a.grupo != null) - Number(b.grupo != null));
  return rows.flatMap((item): CategoryDraft[] => {
    const name = text(item.name, 100);
    if (!name) return [];
    const type = item.type === "ingreso" ? "ingreso" : "egreso";
    let parent = item.grupo != null ? findIn([...catalog.categories, ...proposed], item.grupo) : undefined;
    /** Grupo que el modelo nombró pero no propuso: se crea también, antes que la subcategoría. */
    const implicitGroup: CategoryDraft[] = [];
    if (item.grupo != null && !parent) {
      const group = groupName(item.grupo);
      if (!group || seen.has(labelKey(group))) {
        return fail(
          `Subcategoría ${name}: el grupo no existe (usa el id de una categoría principal o "nueva:<Nombre>" de una que propones aquí).`,
        );
      }
      const ref = `${NEW_REF_PREFIX}${group}`;
      seen.add(labelKey(group));
      parent = { id: ref, name: group, type, parentId: null, isGroup: true };
      proposed.push(parent);
      implicitGroup.push({ ref, name: group, type });
    }
    if (parent) {
      if (parent.parentId) return fail(`Subcategoría ${name}: ${parent.name} ya es subcategoría y solo hay dos niveles.`);
      if (parent.type !== type) return fail(`Subcategoría ${name}: debe ser de ${parent.type}, como su grupo ${parent.name}.`);
    }
    const draft: CategoryDraft = { name, type, parentId: parent?.id, parentName: parent?.name };
    const label = categoryLabel(draft);
    if (seen.has(labelKey(label))) return fail(`La categoría "${label}"${ALREADY_EXISTS}`);
    seen.add(labelKey(label));
    draft.ref = `${NEW_REF_PREFIX}${label}`;
    proposed.push({ id: draft.ref, name: label, type, parentId: parent?.id ?? null, isGroup: false });
    const color = text(item.color, 7);
    return [
      ...implicitGroup,
      {
        ...draft,
        description: text(item.description, 500),
        color: color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : undefined,
        budgetLimit: positive(item.budgetLimit),
      },
    ];
  });
}

function accounts(args: Args, catalog: AdvisorCatalog, problems: string[]): AccountDraft[] {
  const seen = new Set(catalog.accounts.map((a) => normalize(a.name)));
  return list(args, "cuentas", problems).flatMap((item): AccountDraft[] => {
    const name = text(item.name, 100);
    if (!name) return [];
    if (seen.has(normalize(name))) {
      problems.push(`La cuenta "${name}"${ALREADY_EXISTS}`);
      return [];
    }
    seen.add(normalize(name));
    const isCredit = item.isCredit === true;
    return [
      {
        ref: `${NEW_REF_PREFIX}${name}`,
        name,
        description: text(item.description, 500) ?? "",
        initialBalance: positive(item.initialBalance),
        isCredit,
        creditLimit: isCredit ? positive(item.creditLimit) : undefined,
        statementDay: isCredit ? intIn(item.statementDay, 1, 31) : undefined,
        dueDay: isCredit ? intIn(item.dueDay, 1, 31) : undefined,
      },
    ];
  });
}

/** Pista para el modelo cuando usa algo que no existe todavía. */
const NEW_HINT = ' Si hay que crearla, propónla en esta misma respuesta y usa "nueva:<Nombre>".';

function transactions(
  args: Args,
  catalog: AdvisorCatalog,
  problems: string[],
  userText: string,
  evidence: Map<string, ChatAttachment>,
): TransactionDraft[] {
  const fail = rejecter(problems);
  const find = lookup(catalog);
  const rows = list(args, "transacciones", problems, MAX_TRANSACTIONS);
  const known = rows.length >= VERIFY_FROM_ITEMS ? amountsIn(userText) : null;
  return rows.flatMap((item, i): TransactionDraft[] => {
    const type = item.type === "ingreso" || item.type === "transferencia" ? item.type : "egreso";
    const isTransfer = type === "transferencia";
    const amount = positive(item.amount);
    const date = isoDate(item.date);
    const category = find.category(item.categoryId);
    const account = find.account(item.accountId);
    const toAccount = isTransfer ? find.account(item.toAccountId) : undefined;
    const label = `Transacción ${i + 1}`;
    if (!amount) return fail(`${label}: monto inválido.`);
    if (!date) return fail(`${label}: fecha inválida (usa YYYY-MM-DD).`);
    // En transferencias la categoría es opcional; si viene, debe existir.
    if (!category && (!isTransfer || item.categoryId != null)) {
      return fail(`${label}: categoryId no existe en el catálogo.${NEW_HINT}`);
    }
    if (category && !isTransfer && category.type !== type) {
      return fail(`${label}: la categoría ${category.name} es de ${category.type}, no de ${type}.`);
    }
    if (!account) return fail(`${label}: accountId no existe en el catálogo.${NEW_HINT}`);
    if (isTransfer && !toAccount) {
      return fail(`${label}: toAccountId no existe en el catálogo (una transferencia va entre dos cuentas del usuario; un pago a otra persona es un egreso).`);
    }
    if (toAccount && toAccount.id === account.id) {
      return fail(`${label}: la cuenta destino debe ser distinta de la de origen.`);
    }
    const evidenceId = text(item.evidencia, 10)?.toUpperCase();
    const source = evidenceId ? evidence.get(evidenceId) : undefined;
    if (evidenceId && !source) problems.push(`${label}: la evidencia ${evidenceId} no existe; se registra sin soporte.`);
    return [
      {
        date,
        type,
        amount,
        categoryId: category?.id,
        categoryName: category?.name,
        accountId: account.id,
        accountName: account.name,
        toAccountId: toAccount?.id,
        toAccountName: toAccount?.name,
        description: text(item.description, 500),
        evidence: source ? { key: source.key, name: source.name, size: source.size } : undefined,
        warning:
          known && !known.has(amount)
            ? "Este monto no aparece en lo que escribiste: revísalo antes de registrarlo."
            : undefined,
      },
    ];
  });
}

function budgets(args: Args, catalog: AdvisorCatalog, problems: string[], existing: Budget[]): BudgetDraft[] {
  const fail = rejecter(problems);
  const find = lookup(catalog);
  const [ty] = todayInBogota().split("-").map(Number);
  return list(args, "presupuestos", problems).flatMap((item): BudgetDraft[] => {
    const category = find.category(item.categoryId);
    const amount = positive(item.amount);
    const year = intIn(item.year, ty - 1, ty + 2);
    const month = intIn(item.month, 1, 12);
    if (!category) return fail("Presupuesto: categoryId no existe en el catálogo.");
    if (category.type !== "egreso") return fail(`Presupuesto: ${category.name} no es una categoría de egreso.`);
    if (!amount || !year || !month) return fail(`Presupuesto de ${category.name}: monto, año o mes inválido.`);
    const current = existing.find((b) => b.categoryId === category.id && b.year === year && b.month === month);
    return [
      {
        categoryId: category.id,
        categoryName: category.name,
        amount,
        year,
        month,
        currentAmount: current ? Number(current.amount) : undefined,
      },
    ];
  });
}

function debts(args: Args, catalog: AdvisorCatalog, problems: string[]): DebtDraft[] {
  const fail = rejecter(problems);
  const find = lookup(catalog);
  return list(args, "deudas", problems).flatMap((item): DebtDraft[] => {
    const name = text(item.name, 200);
    const payee = text(item.payee, 200);
    const totalAmount = positive(item.totalAmount);
    const dueDate = isoDate(item.dueDate);
    const account = find.account(item.accountId);
    if (!name || !payee) return fail("Deuda: falta nombre o acreedor.");
    if (!totalAmount || !dueDate) return fail(`Deuda ${name}: monto o fecha inválidos.`);
    if (!account) return fail(`Deuda ${name}: accountId no existe en el catálogo.`);
    const isRecurring = item.isRecurring === true;
    const recurrenceType = item.recurrenceType === "biweekly" ? "biweekly" : item.recurrenceType === "monthly" ? "monthly" : undefined;
    return [
      {
        name,
        payee,
        totalAmount,
        dueDate,
        accountId: account.id,
        accountName: account.name,
        notes: text(item.notes, 2000),
        isRecurring,
        recurrenceType: isRecurring ? (recurrenceType ?? "monthly") : undefined,
        recurrenceDay: isRecurring ? intIn(item.recurrenceDay, 1, 31) : undefined,
      },
    ];
  });
}

function debtPayments(args: Args, catalog: AdvisorCatalog, problems: string[]): DebtPaymentDraft[] {
  const fail = rejecter(problems);
  const find = lookup(catalog);
  return list(args, "abonos", problems).flatMap((item): DebtPaymentDraft[] => {
    const debt = find.debt(item.debtId);
    const amount = positive(item.amount);
    const account = find.account(item.accountId);
    const category = find.category(item.categoryId);
    if (!debt) return fail("Abono: debtId no es una deuda pendiente.");
    if (!amount) return fail(`Abono a ${debt.name}: monto inválido.`);
    if (amount > debt.remaining + 0.01)
      return fail(`Abono a ${debt.name}: supera el saldo pendiente (${debt.remaining}).`);
    if (!account) return fail(`Abono a ${debt.name}: accountId no existe.`);
    if (!category || category.type !== "egreso")
      return fail(`Abono a ${debt.name}: categoryId debe ser una categoría de egreso.`);
    return [
      {
        debtId: debt.id,
        debtName: debt.name,
        amount,
        accountId: account.id,
        accountName: account.name,
        categoryId: category.id,
        categoryName: category.name,
        paidAt: isoDate(item.paidAt),
        description: text(item.description, 500),
      },
    ];
  });
}

const FREQUENCIES = ["weekly", "biweekly", "monthly", "bimonthly"] as const;

function recurring(args: Args, catalog: AdvisorCatalog, problems: string[]): RecurringDraft[] {
  const fail = rejecter(problems);
  const find = lookup(catalog);
  return list(args, "pagos", problems).flatMap((item): RecurringDraft[] => {
    const name = text(item.name, 200);
    const payeeName = text(item.payeeName, 200);
    const account = find.account(item.fromAccountId);
    const dayOfMonth = intIn(item.dayOfMonth, 1, 28);
    const frequency = FREQUENCIES.find((f) => f === item.frequency);
    if (!name || !payeeName) return fail("Pago recurrente: falta nombre o beneficiario.");
    if (!account) return fail(`Pago ${name}: fromAccountId no existe.`);
    if (!dayOfMonth || !frequency) return fail(`Pago ${name}: día (1-28) o frecuencia inválidos.`);
    return [
      {
        name,
        payeeName,
        fromAccountId: account.id,
        accountName: account.name,
        initialAmount: positive(item.initialAmount),
        recurrenceType: item.recurrenceType === "automatic" ? "automatic" : "reminder",
        frequency,
        dayOfMonth,
        payeeBank: text(item.payeeBank, 100),
      },
    ];
  });
}

/**
 * @param userText lo que escribió el usuario en la conversación (incluida la
 * lectura de sus evidencias): los montos de una lista larga se verifican contra
 * él para marcar los que el modelo inventó.
 * @param evidence evidencias de la conversación por id (E1, E2…).
 */
export function checkProposal(
  name: ProposalToolName,
  args: Args,
  catalog: AdvisorCatalog,
  existingBudgets: Budget[],
  userText = "",
  evidence: Map<string, ChatAttachment> = new Map(),
): ProposalCheck {
  const problems: string[] = [];
  const message = text(args.mensaje, 2000);

  const proposal = ((): ProposalData | null => {
    const wrap = <K extends ProposalData["kind"]>(kind: K, items: unknown[]) =>
      items.length ? ({ kind, items } as ProposalData) : null;
    switch (name) {
      case "proponer_categorias":
        return wrap("categories", categories(args, catalog, problems));
      case "proponer_cuentas":
        return wrap("accounts", accounts(args, catalog, problems));
      case "proponer_transacciones":
        return wrap("transactions", transactions(args, catalog, problems, userText, evidence));
      case "proponer_presupuestos":
        return wrap("budgets", budgets(args, catalog, problems, existingBudgets));
      case "proponer_deudas":
        return wrap("debts", debts(args, catalog, problems));
      case "proponer_abono_deuda":
        return wrap("debtPayments", debtPayments(args, catalog, problems));
      case "proponer_pagos_recurrentes":
        return wrap("recurring", recurring(args, catalog, problems));
    }
  })();

  return { message, proposal, problems };
}

/**
 * El catálogo más lo que crea una propuesta, con su `ref` como id: así la
 * siguiente herramienta de la misma respuesta puede usar "nueva:Nequi".
 */
export function withProposed(catalog: AdvisorCatalog, proposal: ProposalData | null): AdvisorCatalog {
  if (!proposal) return catalog;
  const items = planItems(proposal);
  const categories = items.flatMap((item): AdvisorCatalog["categories"] =>
    item.kind === "categories" && item.draft.ref
      ? [
          {
            id: item.draft.ref,
            name: categoryLabel(item.draft),
            type: item.draft.type,
            parentId: item.draft.parentId ?? null,
            isGroup: items.some((other) => other.kind === "categories" && other.draft.parentId === item.draft.ref),
          },
        ]
      : [],
  );
  const accounts = items.flatMap((item): AdvisorCatalog["accounts"] =>
    item.kind === "accounts" && item.draft.ref
      ? [{ id: item.draft.ref, name: item.draft.name, isCredit: item.draft.isCredit === true, isActive: true }]
      : [],
  );
  return {
    ...catalog,
    categories: [...catalog.categories, ...categories],
    accounts: [...catalog.accounts, ...accounts],
  };
}

/**
 * Une las propuestas de una misma respuesta en una sola tarjeta: del mismo
 * tipo (una tabla larga partida en varias llamadas) o combinadas (lo que falta
 * crear más lo que lo usa), en el orden en que se deben crear.
 */
export function mergeChecks(base: ProposalCheck, extra: ProposalCheck): ProposalCheck {
  const problems = [...base.problems, ...extra.problems];
  const perKind = new Map<PlanItem["kind"], number>();
  const items = [base.proposal, extra.proposal]
    .flatMap((proposal) => (proposal ? planItems(proposal) : []))
    .filter((item) => {
      const count = (perKind.get(item.kind) ?? 0) + 1;
      perKind.set(item.kind, count);
      return count <= maxItems(item.kind);
    });
  for (const [kind, count] of perKind) {
    const max = maxItems(kind);
    if (count > max) problems.push(`Solo se aceptan ${max} ítems de cada tipo por propuesta; se descartaron ${count - max}.`);
  }
  return {
    message: extra.message ?? base.message,
    proposal: items.length ? toProposalData(items) : null,
    problems,
  };
}
