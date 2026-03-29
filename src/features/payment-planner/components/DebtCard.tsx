"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Debt } from "../types/debt.types";

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
      className={`rounded-2xl border bg-white p-5 shadow-lg shadow-border/30 ${
        isPaid ? "border-accent/30 bg-accent/10" : "border-border/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{debt.name}</h3>
          <p className="text-sm text-muted-foreground">A: {debt.payee}</p>
        </div>
        {isPaid ? (
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground">
            Pagada
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Pendiente
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <span className="text-muted-foreground">
          Total: <strong>{formatMoney(total)}</strong>
        </span>
        <span className={isPaid ? "text-accent" : "text-rose-600"}>
          Falta: <strong>{formatMoney(remaining)}</strong>
        </span>
        <span className="text-muted-foreground">
          Límite: {format(new Date(debt.dueDate), "d MMM yyyy", { locale: es })}
        </span>
      </div>
      {!isPaid && total > 0 && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {debt.notes && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{debt.notes}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {!isPaid && (
          <button
            type="button"
            onClick={() => onRegisterPayment(debt)}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
          >
            Registrar pago
          </button>
        )}
        {!isPaid && (
          <>
            <button
              type="button"
              onClick={() => onEdit(debt)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
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
