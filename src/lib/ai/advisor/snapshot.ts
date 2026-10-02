/**
 * Foto de la situación financiera del usuario que Savvi IA recibe en cada turno.
 * Todo sale del backend con el token del usuario; el `userId` lo resuelve el
 * backend, nunca se manda. Solo servidor.
 */

import { backendGet } from "@/lib/backend-server";
import type { Account } from "@/features/accounts/types/account.type";
import type { Budget } from "@/features/budgets/types/budget.type";
import type { Category } from "@/features/categories/types/category.type";
import type { Debt } from "@/features/payment-planner/types/debt.types";
import type { Transaction } from "@/features/transactions/types/transactions.types";
import type { ProfileSummary } from "@/features/profile/types/profile.type";

export interface AdvisorCatalog {
  categories: { id: string; name: string; type: "ingreso" | "egreso" }[];
  accounts: { id: string; name: string; isCredit: boolean; isActive: boolean }[];
  debts: { id: string; name: string; remaining: number }[];
}

/** Carga perezosa y memorizada por petición: varias herramientas comparten la misma lista. */
export class AdvisorData {
  private transactions?: Promise<Transaction[]>;
  private budgets?: Promise<Budget[]>;
  private debts?: Promise<Debt[]>;

  constructor(readonly authorization: string) {}

  get<T>(path: string) {
    return backendGet<T>(path, this.authorization);
  }

  getTransactions() {
    this.transactions ??= this.get<Transaction[]>("/transactions").then((list) =>
      list.map((t) => ({ ...t, amount: Number(t.amount) })),
    );
    return this.transactions;
  }

  getBudgets() {
    this.budgets ??= this.get<Budget[]>("/budgets").then((list) =>
      list.map((b) => ({ ...b, amount: Number(b.amount) })),
    );
    return this.budgets;
  }

  getDebts() {
    this.debts ??= this.get<Debt[]>("/payment-planner").then((list) =>
      list.map((d) => ({
        ...d,
        totalAmount: Number(d.totalAmount),
        remainingAmount: Number(d.remainingAmount),
      })),
    );
    return this.debts;
  }
}

export interface AdvisorSnapshot {
  summary: ProfileSummary;
  catalog: AdvisorCatalog;
  /** Texto que va como mensaje de sistema */
  prompt: string;
  /** Sin categorías o sin cuentas: el asesor arranca por la configuración */
  needsSetup: boolean;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
    Number(value) || 0,
  );

/** Fecha de hoy en Colombia, `YYYY-MM-DD`. */
export function todayInBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

export function currentMonthSpend(
  transactions: Transaction[],
  year: number,
  month: number,
): Map<string, number> {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const spent = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "egreso" || !String(t.date).startsWith(prefix)) continue;
    spent.set(t.category, (spent.get(t.category) ?? 0) + t.amount);
  }
  return spent;
}

export async function loadSnapshot(data: AdvisorData): Promise<AdvisorSnapshot> {
  const [summary, categories, accounts, budgets, debts, transactions] = await Promise.all([
    data.get<ProfileSummary>("/profile/summary"),
    data.get<Category[]>("/categories"),
    data.get<Account[]>("/accounts"),
    data.getBudgets().catch(() => [] as Budget[]),
    data.getDebts().catch(() => [] as Debt[]),
    data.getTransactions().catch(() => [] as Transaction[]),
  ]);

  const catalog: AdvisorCatalog = {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type === "ingreso" ? "ingreso" : "egreso",
    })),
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      isCredit: a.isCredit === true,
      isActive: a.isActive !== false,
    })),
    debts: debts
      .filter((d) => d.status === "pending")
      .map((d) => ({ id: d.id, name: d.name, remaining: d.remainingAmount })),
  };

  const today = todayInBogota();
  const [year, month] = today.split("-").map(Number);
  const categoryName = new Map(catalog.categories.map((c) => [c.id, c.name]));
  const spent = currentMonthSpend(transactions, year, month);

  const monthBudgets = budgets.filter((b) => b.year === year && b.month === month && b.isActive !== false);
  const pendingDebts = debts.filter((d) => d.status === "pending");
  const { totals, currentMonth, averages, monthly } = summary;
  const lastMonths = monthly.slice(-3);

  const lines = [
    `HOY: ${today} (Colombia).`,
    `USUARIO: ${summary.user.name}. En Savvi desde ${summary.memberSince.slice(0, 10)} (${summary.daysActive} días).`,
    "",
    "MES EN CURSO:",
    `- Ingresos ${money(currentMonth.income)}, gastos ${money(currentMonth.expense)}, neto ${money(currentMonth.net)}, ${currentMonth.count} movimientos.`,
    "ÚLTIMOS MESES:",
    ...lastMonths.map((m) => `- ${m.month}: ingresos ${money(m.income)}, gastos ${money(m.expense)}, neto ${money(m.net)}`),
    `PROMEDIOS: ingreso mensual ${money(averages.monthlyIncome)}, gasto mensual ${money(averages.monthlyExpense)}.`,
    `HISTÓRICO: ${summary.transactions.count} transacciones; tasa de ahorro ${totals.savingsRate === null ? "sin ingresos registrados" : `${totals.savingsRate}%`}.`,
    "",
    "CUENTAS (id | nombre):",
    ...(catalog.accounts.length
      ? catalog.accounts.map((a) => `- ${a.id} | ${a.name}${a.isCredit ? " (tarjeta de crédito)" : ""}${a.isActive ? "" : " (inactiva)"}`)
      : ["- (ninguna)"]),
    `Saldo total en cuentas de débito: ${money(summary.accounts.totalBalance)}.`,
    "",
    "CATEGORÍAS (id | nombre | tipo):",
    ...(catalog.categories.length
      ? catalog.categories.map((c) => `- ${c.id} | ${c.name} | ${c.type}`)
      : ["- (ninguna)"]),
    "",
    `PRESUPUESTOS DE ESTE MES (${monthBudgets.length}):`,
    ...(monthBudgets.length
      ? monthBudgets.map((b) => {
          const used = spent.get(b.categoryId) ?? 0;
          const pct = b.amount > 0 ? Math.round((used / b.amount) * 100) : 0;
          const name = b.category?.name ?? categoryName.get(b.categoryId) ?? b.categoryId;
          return `- ${name}: presupuesto ${money(b.amount)}, gastado ${money(used)} (${pct}%)`;
        })
      : ["- (ninguno)"]),
    "",
    `DEUDAS PENDIENTES (id | nombre | saldo | vence):`,
    ...(pendingDebts.length
      ? pendingDebts.map((d) => {
          const overdue = d.dueDate.slice(0, 10) < today ? " VENCIDA" : "";
          return `- ${d.id} | ${d.name} (${d.payee}) | ${money(d.remainingAmount)} | ${d.dueDate.slice(0, 10)}${overdue}`;
        })
      : ["- (ninguna)"]),
    "",
    `PAGOS RECURRENTES: ${summary.transferTemplates.count} plantillas (${summary.transferTemplates.active} activas).`,
  ];

  return {
    summary,
    catalog,
    prompt: lines.join("\n"),
    needsSetup: catalog.categories.length === 0 || catalog.accounts.length === 0,
  };
}
