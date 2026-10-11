"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal/Modal";
import ChipSelect from "@/components/Inputs/ChipSelect";
import SavvyDatePicker from "@/components/SavvyDatePicker/SavvyDatePicker";
import { format } from "date-fns";
import { Button } from "@/components/ui/shadcn-button";
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
import { cleanTemplateName, parseIsoDate } from "../utils/schedule";
import DueStatus from "./DueStatus";

/** Igual que `MaxLength` del DTO en el backend. */
const DESCRIPTION_MAX = 1000;

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
  const [description, setDescription] = useState("");
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
  const [nextDueDate, setNextDueDate] = useState("");
  /** Solo se envía la fecha si el usuario la cambió; si no, el backend la recalcula. */
  const [dueDateTouched, setDueDateTouched] = useState(false);

  useEffect(() => {
    if (!open || !template) return;
    setName(template.name);
    setDescription(template.description ?? "");
    setFromAccountId(template.fromAccountId);
    setPayeeName(template.payeeName);
    setPayeeAccount(template.payeeAccount ?? "");
    setPayeeBank(template.payeeBank ?? "");
    setRecurrenceType(template.recurrenceType);
    setFrequency(template.frequency);
    setDayOfMonth(template.dayOfMonth);
    setNextDueDate(template.nextDueDate.slice(0, 10));
    setDueDateTouched(false);
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
      description: description.trim(),
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
      ...(dueDateTouched && nextDueDate ? { nextDueDate } : {}),
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
          ? `Plantilla: ${cleanTemplateName(template.name)}`
          : undefined
      }
      className="max-w-xl"
    >
      {!template ? null : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
              Guardando…
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Cuenta origen
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
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
            <label className="mb-1 block text-sm font-medium text-foreground">
              Nombre de la plantilla
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
              maxLength={200}
              placeholder="Ej. Arriendo apartamento"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Descripción{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={DESCRIPTION_MAX}
              placeholder="Ej. Crédito hipotecario 30563. Se paga en https://credifamilia.com"
              className="block w-full resize-y rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground tabular-nums">
              {description.length}/{DESCRIPTION_MAX}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Destinatario
            </label>
            <input
              type="text"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Número de cuenta
            </label>
            <input
              type="text"
              value={payeeAccount}
              onChange={(e) => setPayeeAccount(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Banco
            </label>
            <input
              type="text"
              value={payeeBank}
              onChange={(e) => setPayeeBank(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
              placeholder="Opcional"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Frecuencia</p>
            <ChipSelect
              ariaLabel="Frecuencia"
              options={[
                { label: "Semanal", value: "weekly" },
                { label: "Quincenal", value: "biweekly" },
                { label: "Mensual", value: "monthly" },
                { label: "Bimestral", value: "bimonthly" },
                { label: "Personalizado", value: "custom" },
              ] as const}
              value={frequency}
              onChange={setFrequency}
            />
            {frequency === "custom" && (
              <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-accent/20 bg-accent/10 p-3">
                <div className="min-w-[5rem] flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="min-w-[8rem] flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Unidad
                  </label>
                  <select
                    value={customIntervalUnit}
                    onChange={(e) =>
                      setCustomIntervalUnit(e.target.value as IntervalUnit)
                    }
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                  >
                    <option value="days">Día(s)</option>
                    <option value="weeks">Semana(s)</option>
                    <option value="months">Mes(es) (30 días)</option>
                    <option value="years">Año(s) (365 días)</option>
                  </select>
                </div>
                <p className="w-full text-xs text-muted-foreground">
                  ≈{" "}
                  <span className="font-semibold text-accent-foreground">
                    {intervalToDays(customIntervalAmount, customIntervalUnit)} días
                  </span>{" "}
                  entre cada vencimiento
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Tipo</p>
            <ChipSelect
              ariaLabel="Tipo"
              options={[
                { label: "Recordatorio", value: "reminder" },
                { label: "Automático", value: "automatic" },
              ] as const}
              value={recurrenceType}
              onChange={setRecurrenceType}
            />
          </div>

          <div>
            <SavvyDatePicker
              label="Próximo vencimiento"
              value={nextDueDate ? parseIsoDate(nextDueDate) : null}
              onChange={(date) => {
                if (!date) return;
                setNextDueDate(format(date, "yyyy-MM-dd"));
                setDueDateTouched(true);
                // En pagos mensuales, los siguientes vencen el mismo día del mes.
                if (frequency === "monthly" || frequency === "bimonthly") {
                  setDayOfMonth(Math.min(28, date.getDate()));
                }
              }}
              dateFormat="EEEE d 'de' MMMM yyyy"
              triggerClassName="capitalize"
            />
            {nextDueDate && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <DueStatus nextDueDate={nextDueDate} className="text-xs [&>svg]:h-3.5 [&>svg]:w-3.5" />
                {dueDateTouched && (
                  <button
                    type="button"
                    onClick={() => {
                      setNextDueDate(template.nextDueDate.slice(0, 10));
                      setDayOfMonth(template.dayOfMonth);
                      setDueDateTouched(false);
                    }}
                    className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Deshacer
                  </button>
                )}
              </div>
            )}
          </div>

          {frequency !== "custom" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Día del mes (1-28)
              </label>
              <input
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </div>
          )}

          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {dueDateTouched ? (
              <>
                El próximo pago vencerá en la <strong>fecha que elegiste</strong>.
                Después de pagarlo, el siguiente se calcula con la frecuencia.
              </>
            ) : (
              <>
                Si cambias la frecuencia o el día sin elegir una fecha, la{" "}
                <strong>próxima fecha</strong> se recalcula desde hoy según la nueva
                regla.
              </>
            )}
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
