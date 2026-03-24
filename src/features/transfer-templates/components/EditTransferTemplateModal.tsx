"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal/Modal";
import { Button } from "@/components/ui/button";
import type {
  TransferFrequency,
  TransferTemplate,
  UpdateTransferTemplateDto,
} from "../types/transfer.types";
import {
  daysToIntervalForm,
  intervalToDays,
  type IntervalUnit,
} from "../utils/interval";

type AccountOption = { id: string; name: string };

export default function EditTransferTemplateModal({
  open,
  onClose,
  template,
  accounts,
  loading = false,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  template: TransferTemplate | null;
  accounts: AccountOption[];
  loading?: boolean;
  onSave: (id: string, payload: UpdateTransferTemplateDto) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [payeeAccount, setPayeeAccount] = useState("");
  const [payeeBank, setPayeeBank] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<
    "reminder" | "automatic"
  >("reminder");
  const [frequency, setFrequency] = useState<TransferFrequency>("monthly");
  const [customIntervalAmount, setCustomIntervalAmount] = useState(1);
  const [customIntervalUnit, setCustomIntervalUnit] =
    useState<IntervalUnit>("years");
  const [dayOfMonth, setDayOfMonth] = useState(1);

  useEffect(() => {
    if (!open || !template) return;
    setName(template.name);
    setFromAccountId(template.fromAccountId);
    setPayeeName(template.payeeName);
    setPayeeAccount(template.payeeAccount ?? "");
    setPayeeBank(template.payeeBank ?? "");
    setRecurrenceType(template.recurrenceType);
    setFrequency(template.frequency);
    setDayOfMonth(template.dayOfMonth);
    if (
      template.frequency === "custom" &&
      template.customIntervalDays != null &&
      template.customIntervalDays > 0
    ) {
      const { amount, unit } = daysToIntervalForm(template.customIntervalDays);
      setCustomIntervalAmount(amount);
      setCustomIntervalUnit(unit);
    } else {
      setCustomIntervalAmount(1);
      setCustomIntervalUnit("years");
    }
  }, [open, template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    if (!payeeName.trim()) {
      toast.error("El destinatario es requerido");
      return;
    }
    if (!fromAccountId) {
      toast.error("Selecciona una cuenta de origen");
      return;
    }

    if (frequency === "custom") {
      const days = intervalToDays(customIntervalAmount, customIntervalUnit);
      if (days < 1 || days > 3660) {
        toast.error("El intervalo debe estar entre 1 y 3660 días");
        return;
      }
    }

    const payload: UpdateTransferTemplateDto = {
      name: name.trim(),
      fromAccountId,
      payeeName: payeeName.trim(),
      payeeAccount: payeeAccount.trim() || undefined,
      payeeBank: payeeBank.trim() || undefined,
      recurrenceType,
      frequency,
      dayOfMonth: frequency === "custom" ? template.dayOfMonth : dayOfMonth,
      customIntervalDays:
        frequency === "custom"
          ? intervalToDays(customIntervalAmount, customIntervalUnit)
          : undefined,
    };

    if (frequency !== "custom") {
      delete payload.customIntervalDays;
    }

    await onSave(template.id, payload);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Editar transferencia recurrente"
      description={
        template
          ? `Plantilla: ${template.name}`
          : undefined
      }
      className="max-w-xl max-h-[90vh] overflow-y-auto"
    >
      {!template ? null : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
              Guardando…
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cuenta origen
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              required
            >
              <option value="">Selecciona cuenta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre de la plantilla
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Destinatario
            </label>
            <input
              type="text"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Número de cuenta
            </label>
            <input
              type="text"
              value={payeeAccount}
              onChange={(e) => setPayeeAccount(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Banco
            </label>
            <input
              type="text"
              value={payeeBank}
              onChange={(e) => setPayeeBank(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Opcional"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Frecuencia</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { label: "Semanal", value: "weekly" },
                  { label: "Quincenal", value: "biweekly" },
                  { label: "Mensual", value: "monthly" },
                  { label: "Bimestral", value: "bimonthly" },
                  { label: "Personalizado", value: "custom" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    frequency === opt.value
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {frequency === "custom" && (
              <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <div className="min-w-[5rem] flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Cada
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3660}
                    value={customIntervalAmount}
                    onChange={(e) =>
                      setCustomIntervalAmount(Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="min-w-[8rem] flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Unidad
                  </label>
                  <select
                    value={customIntervalUnit}
                    onChange={(e) =>
                      setCustomIntervalUnit(e.target.value as IntervalUnit)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="days">Día(s)</option>
                    <option value="weeks">Semana(s)</option>
                    <option value="months">Mes(es) (30 días)</option>
                    <option value="years">Año(s) (365 días)</option>
                  </select>
                </div>
                <p className="w-full text-xs text-slate-600">
                  ≈{" "}
                  <span className="font-semibold text-emerald-800">
                    {intervalToDays(customIntervalAmount, customIntervalUnit)} días
                  </span>{" "}
                  entre cada vencimiento
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { label: "Recordatorio", value: "reminder" },
                  { label: "Automático", value: "automatic" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecurrenceType(opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    recurrenceType === opt.value
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {frequency !== "custom" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Día del mes (1-28)
              </label>
              <input
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          )}

          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Si cambias la frecuencia o el calendario, la{" "}
            <strong>próxima fecha</strong> se recalcula desde hoy según la nueva
            regla.
          </p>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl" disabled={loading}>
              Guardar cambios
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
