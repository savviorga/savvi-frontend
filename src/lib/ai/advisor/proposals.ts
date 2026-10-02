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
  DebtDraft,
  DebtPaymentDraft,
  ProposalData,
  RecurringDraft,
  TransactionDraft,
} from "@/features/savvi-ia/types/proposal.types";
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

const maxItems = (kind: ProposalData["kind"]) => (kind === "transactions" ? MAX_TRANSACTIONS : MAX_ITEMS);

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

function lookup(catalog: AdvisorCatalog) {
  return {
    category: (id: unknown) => catalog.categories.find((c) => c.id === id),
    account: (id: unknown) => catalog.accounts.find((a) => a.id === id),
    debt: (id: unknown) => catalog.debts.find((d) => d.id === id),
  };
}

function categories(args: Args, catalog: AdvisorCatalog, problems: string[]): CategoryDraft[] {
  const seen = new Set(catalog.categories.map((c) => normalize(c.name)));
  return list(args, "categorias", problems).flatMap((item): CategoryDraft[] => {
    const name = text(item.name, 100);
    if (!name) return [];
    if (seen.has(normalize(name))) {
      problems.push(`La categoría "${name}" ya existe.`);
      return [];
    }
    seen.add(normalize(name));
    const color = text(item.color, 7);
    return [
      {
        name,
        type: item.type === "ingreso" ? "ingreso" : "egreso",
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
      problems.push(`La cuenta "${name}" ya existe.`);
      return [];
    }
    seen.add(normalize(name));
    const isCredit = item.isCredit === true;
    return [
      {
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

function transactions(args: Args, catalog: AdvisorCatalog, problems: string[], userText: string): TransactionDraft[] {
  const fail = rejecter(problems);
  const find = lookup(catalog);
  const rows = list(args, "transacciones", problems, MAX_TRANSACTIONS);
  const known = rows.length >= VERIFY_FROM_ITEMS ? amountsIn(userText) : null;
  return rows.flatMap((item, i): TransactionDraft[] => {
    const type = item.type === "ingreso" ? "ingreso" : "egreso";
    const amount = positive(item.amount);
    const date = isoDate(item.date);
    const category = find.category(item.categoryId);
    const account = find.account(item.accountId);
    const label = `Transacción ${i + 1}`;
    if (!amount) return fail(`${label}: monto inválido.`);
    if (!date) return fail(`${label}: fecha inválida (usa YYYY-MM-DD).`);
    if (!category) return fail(`${label}: categoryId no existe en el catálogo.`);
    if (category.type !== type) return fail(`${label}: la categoría ${category.name} es de ${category.type}, no de ${type}.`);
    if (!account) return fail(`${label}: accountId no existe en el catálogo.`);
    return [
      {
        date,
        type,
        amount,
        categoryId: category.id,
        categoryName: category.name,
        accountId: account.id,
        accountName: account.name,
        description: text(item.description, 500),
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
 * @param userText lo que escribió el usuario en la conversación: los montos de
 * una lista larga se verifican contra él para marcar los que el modelo inventó.
 */
export function checkProposal(
  name: ProposalToolName,
  args: Args,
  catalog: AdvisorCatalog,
  existingBudgets: Budget[],
  userText = "",
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
        return wrap("transactions", transactions(args, catalog, problems, userText));
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
 * Une dos propuestas del mismo tipo hechas en la misma respuesta (el modelo
 * puede partir una tabla larga en varias llamadas). Devuelve null si son de
 * tipos distintos.
 */
export function mergeChecks(base: ProposalCheck, extra: ProposalCheck): ProposalCheck | null {
  if (!base.proposal || !extra.proposal || base.proposal.kind !== extra.proposal.kind) return null;
  const max = maxItems(base.proposal.kind);
  const items = [...base.proposal.items, ...extra.proposal.items];
  const problems = [...base.problems, ...extra.problems];
  if (items.length > max) problems.push(`Solo se aceptan ${max} ítems por propuesta; se descartaron ${items.length - max}.`);
  return {
    message: base.message ?? extra.message,
    proposal: { kind: base.proposal.kind, items: items.slice(0, max) } as ProposalData,
    problems,
  };
}
