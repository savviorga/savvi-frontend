"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Debt } from "../../types/debt.types";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

interface DebtCardProps {
  debt: Debt;
  onRegisterPayment: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
}

export default function DebtCard({
  debt,
  onRegisterPayment,
  onEdit,
  onDelete,
}: DebtCardProps) {
  const remaining = Number(debt.remainingAmount);
  const total = Number(debt.totalAmount);
  const isPaid = debt.status === "paid";
  const progress = total > 0 ? Math.round((1 - remaining / total) * 100) : 0;

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-lg shadow-slate-200/30 ${
        isPaid ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{debt.name}</h3>
          <p className="text-sm text-slate-500">A: {debt.payee}</p>
        </div>
        {isPaid ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            Pagada
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Pendiente
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <span className="text-slate-600">
          Total: <strong>{formatMoney(total)}</strong>
        </span>
        <span className={isPaid ? "text-emerald-600" : "text-rose-600"}>
          Falta: <strong>{formatMoney(remaining)}</strong>
        </span>
        <span className="text-slate-500">
          Límite: {format(new Date(debt.dueDate), "d MMM yyyy", { locale: es })}
        </span>
      </div>
      {!isPaid && total > 0 && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {debt.notes && (
        <p className="mt-2 text-xs text-slate-500 line-clamp-2">{debt.notes}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {!isPaid && (
          <button
            type="button"
            onClick={() => onRegisterPayment(debt)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Registrar pago
          </button>
        )}
        {!isPaid && (
          <>
            <button
              type="button"
              onClick={() => onEdit(debt)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Editar
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onDelete(debt)}
          className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
