"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import SavvyBannerLight from "@/components/Banner/SavvyBannerLight";
import SavvyDatePicker from "@/components/SavvyDatePicker/SavvyDatePicker";
import SavvySelect from "@/components/Select/Select";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import type { Debt, RegisterPaymentDto } from "../../types/debt.types";
import type { Account } from "@/features/transactions/types/catalog.types";
import type { Category } from "@/features/categories/types/category.type";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

interface RegisterPaymentModalProps {
  open: boolean;
  onClose: () => void;
  debt: Debt | null;
  accounts: Account[];
  categories: Category[];
  onSubmit: (debtId: string, payload: RegisterPaymentDto) => Promise<boolean>;
  loading?: boolean;
}

export default function RegisterPaymentModal({
  open,
  onClose,
  debt,
  accounts,
  categories,
  onSubmit,
  loading = false,
}: RegisterPaymentModalProps) {
  const [date, setDate] = useState<Date | null>(new Date());
  const [amount, setAmount] = useState<number | null>(null);
  const [account, setAccount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const remaining = debt ? Number(debt.remainingAmount) : 0;
  const expenseCategories = categories.filter((c) => (c.type ?? "egreso") === "egreso");

  useEffect(() => {
    if (open && debt) {
      setDate(new Date());
      setAmount(null);
      setAccount("");
      setCategory("");
      setDescription(`Pago: ${debt.name} - ${debt.payee}`);
    }
  }, [open, debt]);

  if (!open || !debt) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = amount ?? 0;
    if (num <= 0 || num > remaining) return;
    if (!account || !category) return;
    const success = await onSubmit(debt.id, {
      amount: num,
      paidAt: date ? date.toISOString().slice(0, 10) : undefined,
      account,
      category,
      description: description.trim() || undefined,
    });
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-lg bg-white/70 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <span className="text-sm text-gray-600">Registrando pago…</span>
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
          title="Registrar pago"
          subtitle="Mismo flujo que un gasto: se crea la transacción de egreso y se descuenta del pendiente"
        />
        <div className="mt-2 rounded-xl bg-rose-50 p-3 text-sm border border-rose-100">
          <p className="font-medium text-slate-700">{debt.name}</p>
          <p className="text-slate-500">Pendiente: {formatMoney(remaining)}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SavvyDatePicker
                label="Fecha"
                value={date}
                onChange={(d) => setDate(d)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Monto
              </label>
              <CurrencyField
                value={amount}
                onChange={setAmount}
              />
              <p className="mt-1 text-xs text-slate-500">
                Máximo {formatMoney(remaining)}
              </p>
            </div>
          </div>
          <div>
            <SavvySelect
              label="Cuenta"
              value={account}
              onChange={setAccount}
              placeholder="Selecciona una cuenta"
              options={accounts.map((a) => ({ label: a.name, value: a.id }))}
            />
          </div>
          <div>
            <SavvySelect
              label="Categoría"
              value={category}
              onChange={setCategory}
              placeholder="Solo categorías de gastos"
              options={expenseCategories.map((c) => ({
                label: c.name,
                value: c.name,
              }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              rows={2}
              placeholder="Ej. Pago mes marzo"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl">
              Registrar pago
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
