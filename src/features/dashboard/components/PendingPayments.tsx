"use client";

import Link from "next/link";
import { BellRing } from "lucide-react";
import type { Reminder } from "@/features/transfer-templates/types/transfer.types";
import { cleanTemplateName } from "@/features/transfer-templates/utils/schedule";
import { formatMoney } from "../utils/dashboard.utils";

/** Cuántos recordatorios se muestran; el resto, en Pagos recurrentes. */
const MAX_VISIBLE = 3;

/** Pagos recurrentes que esperan confirmación, con acción directa. */
export default function PendingPayments({
  reminders,
  onPay,
  onPostpone,
}: {
  reminders: Reminder[];
  onPay: (reminder: Reminder) => void;
  onPostpone: (reminder: Reminder) => void;
}) {
  if (reminders.length === 0) return null;

  return (
    <section
      className="rounded-3xl border border-mint/25 bg-white p-4 shadow-sm sm:p-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-500"
      style={{ animationDelay: "300ms" }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2.5 text-sm font-bold text-[#0B1829]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint/15 text-mint-dim">
            <BellRing className="h-4 w-4 motion-safe:animate-[savvi-bell-ring_1.2s_ease-in-out_1]" aria-hidden />
          </span>
          {reminders.length === 1 ? "1 pago por confirmar" : `${reminders.length} pagos por confirmar`}
        </p>
        <Link href="/pagos-recurrentes" className="shrink-0 text-xs font-semibold text-mint-dim hover:underline">
          Ver todos
        </Link>
      </div>

      <ul className="divide-y divide-gray-100">
        {reminders.slice(0, MAX_VISIBLE).map((r) => {
          const tpl = r.template;
          const amount = tpl?.lastAmount ?? null;
          return (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#0B1829]">
                  {tpl ? cleanTemplateName(tpl.name) : "Pago recurrente"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {amount != null ? `${formatMoney(Number(amount))} sugerido` : tpl?.payeeName ?? ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onPostpone(r)}
                className="hidden rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 sm:block"
              >
                Posponer
              </button>
              <button
                type="button"
                onClick={() => onPay(r)}
                className="rounded-xl bg-mint px-4 py-2 text-xs font-semibold text-cosmos shadow-sm transition-all hover:bg-mint-dim active:scale-95"
              >
                Pagar
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
