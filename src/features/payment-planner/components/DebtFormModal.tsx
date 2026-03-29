"use client";

import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/shadcn-button";
import Modal from "@/components/Modal/Modal";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import SavvyDatePicker from "@/components/SavvyDatePicker/SavvyDatePicker";
import SavvySelect from "@/components/Select/Select";
import type { Debt, CreateDebtDto, RecurrenceType } from "../types/debt.types";
import type { Account } from "@/features/transactions/types/catalog.types";

function formatDateForInput(iso: string) {
  return iso.slice(0, 10);
}

interface DebtFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateDebtDto) => Promise<boolean>;
  editData?: Debt | null;
  accounts?: Account[];
  defaultAccountId?: string;
  loading?: boolean;
}

export default function DebtFormModal({
  open,
  onClose,
  onSubmit,
  editData,
  accounts = [],
  defaultAccountId,
  loading = false,
}: DebtFormModalProps) {
  const [name, setName] = useState("");
  const [payee, setPayee] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("monthly");
  const [recurrenceDay, setRecurrenceDay] = useState<number>(1);

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setPayee(editData.payee);
      setAccountId(editData.accountId ?? defaultAccountId ?? "");
      setTotalAmount(Number(editData.totalAmount));
      setDueDate(formatDateForInput(editData.dueDate));
      setNotes(editData.notes ?? "");
      setIsRecurring(editData.isRecurring ?? false);
      setRecurrenceType(editData.recurrenceType ?? "monthly");
      setRecurrenceDay(editData.recurrenceDay ?? 1);
    } else {
      setName("");
      setPayee("");
      setAccountId(defaultAccountId ?? "");
      setTotalAmount(null);
      setDueDate("");
      setNotes("");
      setIsRecurring(false);
      setRecurrenceType("monthly");
      setRecurrenceDay(1);
    }
  }, [editData, open, defaultAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) return;
    if (totalAmount == null || totalAmount <= 0) return;
    if (!accountId) return;
    const success = await onSubmit({
      name,
      payee,
      accountId,
      totalAmount,
      dueDate,
      notes: notes.trim() || undefined,
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : undefined,
      recurrenceDay: isRecurring ? recurrenceDay : undefined,
    });
    if (success) onClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={editData ? "Editar obligación" : "Nueva obligación"}
      description="Registra deudas o compromisos por pagar"
      className="max-w-lg"
      headerIcon={
        <ClipboardList className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />
      }
    >
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
            <span className="text-sm text-muted-foreground">Guardando…</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Nombre de la deuda o pago
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
              placeholder="Tarjeta de crédito"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              A quién se le debe pagar
            </label>
            <input
              type="text"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
              placeholder="Banco "
              required
            />
          </div>

          <div>
            <SavvySelect
              label="Cuenta"
              value={accountId}
              onChange={setAccountId}
              placeholder="Selecciona una cuenta"
              options={accounts.map((a) => ({
                label: a.name,
                value: a.id,
              }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Monto total
            </label>
            <CurrencyField
              value={totalAmount}
              onChange={setTotalAmount}
              placeholder="0"
              disabled={loading}
            />
          </div>
          <SavvyDatePicker
            label="Fecha límite de pago"
            value={dueDate ? parse(dueDate, "yyyy-MM-dd", new Date()) : null}
            onChange={(date) =>
              setDueDate(date ? format(date, "yyyy-MM-dd") : "")
            }
            placeholder="Seleccionar fecha límite"
            required
          />
          <div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-emerald-600"
              />
              <span className="text-sm font-medium text-foreground">Pago recurrente</span>
            </label>
            {isRecurring && (
              <div className="mt-3 space-y-3 rounded-xl border border-accent/90 bg-accent/40 p-3">
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="recurrenceType"
                      value="monthly"
                      checked={recurrenceType === "monthly"}
                      onChange={() => { setRecurrenceType("monthly"); setRecurrenceDay(1); }}
                      className="accent-emerald-600"
                    />
                    <span className="text-sm text-foreground">Cada mes</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="recurrenceType"
                      value="biweekly"
                      checked={recurrenceType === "biweekly"}
                      onChange={() => { setRecurrenceType("biweekly"); setRecurrenceDay(1); }}
                      className="accent-emerald-600"
                    />
                    <span className="text-sm text-foreground">Cada dos semanas</span>
                  </label>
                </div>
                {recurrenceType === "monthly" && (
                  <SavvySelect
                    label="Día del mes"
                    value={String(recurrenceDay)}
                    onChange={(v) => setRecurrenceDay(Number(v))}
                    placeholder="Selecciona el día"
                    options={Array.from({ length: 31 }, (_, i) => {
                      const d = i + 1;
                      return { label: `Día ${d}`, value: String(d) };
                    })}
                  />
                )}
                {recurrenceType === "biweekly" && (
                  <SavvySelect
                    label="Día de la semana"
                    value={String(recurrenceDay)}
                    onChange={(v) => setRecurrenceDay(Number(v))}
                    placeholder="Selecciona el día"
                    options={[
                      { label: "Lunes", value: "1" },
                      { label: "Martes", value: "2" },
                      { label: "Miércoles", value: "3" },
                      { label: "Jueves", value: "4" },
                      { label: "Viernes", value: "5" },
                      { label: "Sábado", value: "6" },
                      { label: "Domingo", value: "7" },
                    ]}
                  />
                )}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
              rows={2}
              placeholder="Notas adicionales"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl">
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
