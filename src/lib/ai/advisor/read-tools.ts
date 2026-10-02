/**
 * Ejecución de las herramientas `consultar_*`. Devuelven JSON compacto para el
 * modelo (nombres en lugar de ids, montos redondeados) y un texto corto que la
 * UI muestra mientras el asesor "revisa". Solo servidor.
 */

import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import type { TransferTemplate, Reminder } from "@/features/transfer-templates/types/transfer.types";
import type { AdvisorCatalog, AdvisorData } from "./snapshot";
import { currentMonthSpend, todayInBogota } from "./snapshot";
import type { ReadToolName } from "./tools";

type Args = Record<string, unknown>;

const round = (n: number) => Math.round(n * 100) / 100;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const isDate = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function monthName(year: number, month: number) {
  return format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", { locale: es });
}

function rangeLabel(desde: string | null, hasta: string | null) {
  const fmt = (d: string) => format(parse(d, "yyyy-MM-dd", new Date()), "d 'de' MMM", { locale: es });
  if (desde && hasta) return ` del ${fmt(desde)} al ${fmt(hasta)}`;
  if (desde) return ` desde el ${fmt(desde)}`;
  if (hasta) return ` hasta el ${fmt(hasta)}`;
  return "";
}

/** Texto en vivo: "Revisando tus gastos de Mercado del 1 de sep al 26 de sep" */
export function describeReadStep(name: ReadToolName, args: Args, catalog: AdvisorCatalog): string {
  switch (name) {
    case "consultar_transacciones": {
      const tipo = str(args.tipo);
      const what = tipo === "ingreso" ? "ingresos" : tipo === "egreso" ? "gastos" : tipo === "transferencia" ? "transferencias" : "movimientos";
      const cat = catalog.categories.find((c) => c.id === args.categoriaId)?.name;
      const acc = catalog.accounts.find((a) => a.id === args.cuentaId)?.name;
      return `Revisando tus ${what}${cat ? ` de ${cat}` : ""}${acc ? ` en ${acc}` : ""}${rangeLabel(isDate(str(args.desde)), isDate(str(args.hasta)))}`;
    }
    case "consultar_presupuestos": {
      const year = Number(args.anio);
      const month = Number(args.mes);
      return month >= 1 && month <= 12 ? `Revisando tus presupuestos de ${monthName(year, month)}` : "Revisando tus presupuestos";
    }
    case "consultar_deudas":
      return args.estado === "pagadas" ? "Revisando las deudas que ya pagaste" : "Revisando tus deudas";
    case "consultar_pagos_recurrentes":
      return "Revisando tus pagos recurrentes";
  }
}

async function transactionsTool(data: AdvisorData, catalog: AdvisorCatalog, args: Args) {
  const desde = isDate(str(args.desde));
  const hasta = isDate(str(args.hasta));
  const tipo = str(args.tipo);
  const categoriaId = str(args.categoriaId);
  const cuentaId = str(args.cuentaId);
  const texto = str(args.texto)?.toLocaleLowerCase("es");
  const limite = Math.min(Math.max(Number(args.limite) || 15, 1), 40);

  const categoryName = new Map(catalog.categories.map((c) => [c.id, c.name]));
  const accountName = new Map(catalog.accounts.map((a) => [a.id, a.name]));

  const list = (await data.getTransactions()).filter((t) => {
    const date = String(t.date).slice(0, 10);
    if (desde && date < desde) return false;
    if (hasta && date > hasta) return false;
    if (tipo && t.type !== tipo) return false;
    if (categoriaId && t.category !== categoriaId) return false;
    if (cuentaId && t.account !== cuentaId) return false;
    if (texto && !(t.description ?? "").toLocaleLowerCase("es").includes(texto)) return false;
    return true;
  });

  const byCategory = new Map<string, { total: number; count: number }>();
  let income = 0;
  let expense = 0;
  for (const t of list) {
    if (t.type === "ingreso") income += t.amount;
    if (t.type === "egreso") {
      expense += t.amount;
      const entry = byCategory.get(t.category) ?? { total: 0, count: 0 };
      entry.total += t.amount;
      entry.count += 1;
      byCategory.set(t.category, entry);
    }
  }

  const sorted = [...list].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return {
    encontradas: list.length,
    totalIngresos: round(income),
    totalEgresos: round(expense),
    gastoPorCategoria: [...byCategory.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([id, v]) => ({ categoria: categoryName.get(id) ?? id, total: round(v.total), cantidad: v.count })),
    transacciones: sorted.slice(0, limite).map((t) => ({
      fecha: String(t.date).slice(0, 10),
      tipo: t.type,
      monto: round(t.amount),
      categoria: categoryName.get(t.category) ?? t.category,
      cuenta: accountName.get(t.account) ?? t.account,
      descripcion: t.description ?? null,
    })),
    nota: list.length > limite ? `Se listan las ${limite} más recientes de ${list.length}.` : undefined,
  };
}

async function budgetsTool(data: AdvisorData, catalog: AdvisorCatalog, args: Args) {
  const [ty, tm] = todayInBogota().split("-").map(Number);
  const year = Number.isInteger(args.anio) ? Number(args.anio) : ty;
  const month = Number.isInteger(args.mes) && Number(args.mes) >= 1 && Number(args.mes) <= 12 ? Number(args.mes) : tm;

  const [budgets, transactions] = await Promise.all([data.getBudgets(), data.getTransactions()]);
  const spent = currentMonthSpend(transactions, year, month);
  const categoryName = new Map(catalog.categories.map((c) => [c.id, c.name]));

  const rows = budgets
    .filter((b) => b.year === year && b.month === month && b.isActive !== false)
    .map((b) => {
      const used = spent.get(b.categoryId) ?? 0;
      return {
        categoria: b.category?.name ?? categoryName.get(b.categoryId) ?? b.categoryId,
        categoriaId: b.categoryId,
        presupuesto: round(b.amount),
        gastado: round(used),
        restante: round(b.amount - used),
        porcentajeUsado: b.amount > 0 ? Math.round((used / b.amount) * 100) : null,
      };
    });

  const budgeted = new Set(rows.map((r) => r.categoriaId));
  const withoutBudget = [...spent.entries()]
    .filter(([id]) => !budgeted.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, total]) => ({ categoria: categoryName.get(id) ?? id, categoriaId: id, gastado: round(total) }));

  return { anio: year, mes: month, presupuestos: rows, gastosSinPresupuesto: withoutBudget };
}

async function debtsTool(data: AdvisorData, catalog: AdvisorCatalog, args: Args) {
  const today = todayInBogota();
  const accountName = new Map(catalog.accounts.map((a) => [a.id, a.name]));
  const debts = (await data.getDebts()).filter((d) =>
    args.estado === "pendientes" ? d.status === "pending" : args.estado === "pagadas" ? d.status === "paid" : true,
  );

  return {
    deudas: debts.map((d) => ({
      id: d.id,
      nombre: d.name,
      acreedor: d.payee,
      estado: d.status === "paid" ? "pagada" : "pendiente",
      montoTotal: round(d.totalAmount),
      saldo: round(d.remainingAmount),
      vence: d.dueDate.slice(0, 10),
      vencida: d.status === "pending" && d.dueDate.slice(0, 10) < today,
      recurrente: d.isRecurring ? `${d.recurrenceType ?? ""} día ${d.recurrenceDay ?? "?"}`.trim() : null,
      cuenta: d.accountId ? (accountName.get(d.accountId) ?? null) : null,
      abonos: d.payments?.length ?? undefined,
    })),
  };
}

async function recurringTool(data: AdvisorData, catalog: AdvisorCatalog) {
  const accountName = new Map(catalog.accounts.map((a) => [a.id, a.name]));
  const [templates, reminders] = await Promise.all([
    data.get<TransferTemplate[]>("/transfer-templates"),
    data.get<Reminder[]>("/reminders").catch(() => [] as Reminder[]),
  ]);

  return {
    plantillas: templates.map((t) => ({
      nombre: t.name,
      beneficiario: t.payeeName,
      desde: accountName.get(t.fromAccountId) ?? null,
      tipo: t.recurrenceType === "automatic" ? "automático" : "recordatorio",
      frecuencia: t.frequency,
      dia: t.dayOfMonth,
      ultimoMonto: t.lastAmount != null ? Number(t.lastAmount) : null,
      activa: t.isActive,
    })),
    recordatoriosPendientes: reminders.map((r) => ({
      plantilla: r.template?.name ?? null,
      montoSugerido: r.template?.lastAmount != null ? Number(r.template.lastAmount) : null,
    })),
  };
}

export async function runReadTool(
  name: ReadToolName,
  args: Args,
  data: AdvisorData,
  catalog: AdvisorCatalog,
): Promise<unknown> {
  switch (name) {
    case "consultar_transacciones":
      return transactionsTool(data, catalog, args);
    case "consultar_presupuestos":
      return budgetsTool(data, catalog, args);
    case "consultar_deudas":
      return debtsTool(data, catalog, args);
    case "consultar_pagos_recurrentes":
      return recurringTool(data, catalog);
  }
}
