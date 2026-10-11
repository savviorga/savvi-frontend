import { Banknote, CircleAlert } from "lucide-react";
import { formatMoney } from "@/features/dashboard/utils/dashboard.utils";
import type { TransferTemplate } from "../types/transfer.types";
import { daysUntilDue } from "../utils/schedule";

const MAX_NAMES = 3;

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

/**
 * Aviso en rojo sobre la tabla cuando hay pagos vencidos o que vencen en ≤ 3 días,
 * con acceso directo a pagar el más urgente. No se muestra si todo está al día.
 */
export default function UrgentPaymentsAlert({
  templates,
  onPay,
}: {
  /** Ordenadas por urgencia (la primera es la más urgente). */
  templates: TransferTemplate[];
  onPay: (template: TransferTemplate) => void;
}) {
  const urgent = templates.filter(
    (t) => t.isActive && daysUntilDue(t.nextDueDate) <= 3
  );
  if (urgent.length === 0) return null;

  const overdue = urgent.filter((t) => daysUntilDue(t.nextDueDate) < 0);
  const dueSoon = urgent.length - overdue.length;
  const overdueTotal = overdue.reduce((acc, t) => acc + Number(t.lastAmount ?? 0), 0);

  const title = overdue.length
    ? `Tienes ${overdue.length} ${plural(overdue.length, "pago vencido", "pagos vencidos")} por ${formatMoney(overdueTotal)}`
    : `${dueSoon} ${plural(dueSoon, "pago vence", "pagos vencen")} en los próximos 3 días`;

  const names = urgent.slice(0, MAX_NAMES).map((t) => t.payeeName).join(", ");
  const extraNames = urgent.length > MAX_NAMES ? ` y ${urgent.length - MAX_NAMES} más` : "";
  const soonNote =
    overdue.length && dueSoon
      ? ` · ${dueSoon} más ${plural(dueSoon, "vence", "vencen")} en los próximos 3 días`
      : "";

  const mostUrgent = urgent[0];

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600"
          aria-hidden
        >
          <CircleAlert className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-rose-800">{title}</p>
          <p className="mt-0.5 text-sm text-rose-700/80">
            {names}
            {extraNames}
            {soonNote}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onPay(mostUrgent)}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
      >
        <Banknote className="h-4 w-4" />
        <span className="max-w-[14rem] truncate">Pagar {mostUrgent.payeeName}</span>
      </button>
    </div>
  );
}
