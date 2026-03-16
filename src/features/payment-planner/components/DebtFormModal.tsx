"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import SavvyBannerLight from "@/components/Banner/SavvyBannerLight";
import type { Debt, CreateDebtDto, RecurrenceType } from "../../types/debt.types";

function formatDateForInput(iso: string) {
  return iso.slice(0, 10);
}

interface DebtFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateDebtDto) => Promise<boolean>;
  editData?: Debt | null;
  loading?: boolean;
}

export default function DebtFormModal({
  open,
  onClose,
  onSubmit,
  editData,
  loading = false,
}: DebtFormModalProps) {
  const [name, setName] = useState("");
  const [payee, setPayee] = useState("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("monthly");
  const [recurrenceDay, setRecurrenceDay] = useState<number>(1);

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setPayee(editData.payee);
      setTotalAmount(String(editData.totalAmount));
      setDueDate(formatDateForInput(editData.dueDate));
      setNotes(editData.notes ?? "");
      setIsRecurring(editData.isRecurring ?? false);
      setRecurrenceType(editData.recurrenceType ?? "monthly");
      setRecurrenceDay(editData.recurrenceDay ?? 1);
    } else {
      setName("");
      setPayee("");
      setTotalAmount("");
      setDueDate("");
      setNotes("");
      setIsRecurring(false);
      setRecurrenceType("monthly");
      setRecurrenceDay(1);
    }
  }, [editData, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(totalAmount.replace(/,/g, "."));
    if (Number.isNaN(num) || num <= 0) return;
    const success = await onSubmit({
      name,
      payee,
      totalAmount: num,
      dueDate,
      notes: notes.trim() || undefined,
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : undefined,
      recurrenceDay: isRecurring ? recurrenceDay : undefined,
    });
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-lg bg-white/70 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <span className="text-sm text-gray-600">Guardando…</span>
        </div>
      )}
      <div className="w-full max-w-md animate-scaleIn rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-4 flex w-full justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-red-100"
            title="Cerrar"
          >
            <XMarkIcon className="h-5 w-5 text-red-600" />
          </button>
        </div>
        <SavvyBannerLight
          title={editData ? "Editar obligación" : "Nueva obligación"}
          subtitle="Registra deudas o compromisos por pagar"
        />
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre de la deuda o pago
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Ej. Tarjeta de crédito"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              A quién se le debe pagar
            </label>
            <input
              type="text"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Ej. Banco X"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Monto total
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Fecha límite de pago
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              required
            />
          </div>
          <div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-emerald-600"
              />
              <span className="text-sm font-medium text-gray-700">Pago recurrente</span>
            </label>
            {isRecurring && (
              <div className="mt-3 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
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
                    <span className="text-sm text-gray-700">Cada mes</span>
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
                    <span className="text-sm text-gray-700">Cada dos semanas</span>
                  </label>
                </div>
                {recurrenceType === "monthly" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Día del mes
                    </label>
                    <select
                      value={recurrenceDay}
                      onChange={(e) => setRecurrenceDay(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Día {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {recurrenceType === "biweekly" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Día de la semana
                    </label>
                    <select
                      value={recurrenceDay}
                      onChange={(e) => setRecurrenceDay(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    >
                      <option value={1}>Lunes</option>
                      <option value={2}>Martes</option>
                      <option value={3}>Miércoles</option>
                      <option value={4}>Jueves</option>
                      <option value={5}>Viernes</option>
                      <option value={6}>Sábado</option>
                      <option value={7}>Domingo</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              rows={2}
              placeholder="Notas adicionales"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl">
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
