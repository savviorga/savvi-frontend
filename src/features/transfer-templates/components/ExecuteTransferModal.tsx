"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import Modal from "@/components/Modal/Modal";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import type { TransferTemplate } from "../types/transfer.types";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ExecuteTransferModal({
  open,
  onClose,
  template,
  initialAmount,
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  template: TransferTemplate | null;
  initialAmount: number | null | undefined;
  loading?: boolean;
  onConfirm: (payload: { amount: number; description?: string }) => Promise<void>;
}) {
  const [amount, setAmount] = useState<number | null>(null);

  const defaultDescription = useMemo(() => {
    if (!template) return undefined;
    return `Pago recurrente: ${template.name}`;
  }, [template]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAmount(initialAmount == null ? null : Number(initialAmount));
  }, [open, initialAmount]);

  const canSubmit = !!template && amount != null && amount > 0;

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Confirmar pago"
      description={template ? `${template.name} — ${template.payeeName}` : undefined}
    >
      {!template ? null : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-3">
            <p className="text-sm text-slate-600">
              Monto sugerido:{" "}
              <span className="font-semibold text-slate-900">
                {initialAmount == null ? "-" : formatMoney(Number(initialAmount))}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Próxima fecha:{" "}
              {format(new Date(template.nextDueDate), "d MMM yyyy", {
                locale: es,
              })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto a pagar
            </label>
            <CurrencyField
              value={amount}
              onChange={(v) => setAmount(v)}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!template || amount == null) return;
                await onConfirm({
                  amount,
                  description: defaultDescription,
                });
              }}
              disabled={!canSubmit || loading}
              className="rounded-xl"
            >
              {loading ? "Procesando..." : "Pagar"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

