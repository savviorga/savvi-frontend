"use client";

import { useState, useEffect } from "react";
import { Banknote } from "lucide-react";
import { Button } from "@/components/ui/shadcn-button";
import Modal from "@/components/Modal/Modal";
import SavvyDatePicker from "@/components/SavvyDatePicker/SavvyDatePicker";
import SavvySelect from "@/components/Select/Select";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import type { Debt, RegisterPaymentDto } from "../types/debt.types";
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
  defaultAccountId?: string;
  loading?: boolean;
}

export default function RegisterPaymentModal({
  open,
  onClose,
  debt,
  accounts,
  categories,
  onSubmit,
  defaultAccountId,
  loading = false,
}: RegisterPaymentModalProps) {
  const [date, setDate] = useState<Date | null>(new Date());
  const [amount, setAmount] = useState<number | null>(null);
  const [account, setAccount] = useState(defaultAccountId ?? "");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const remaining = debt ? Number(debt.remainingAmount) : 0;
  const expenseCategories = categories.filter((c) => (c.type ?? "egreso") === "egreso");

  useEffect(() => {
    if (open && debt) {
      setDate(new Date());
      setAmount(null);
      setAccount(defaultAccountId ?? "");
      setCategory("");
      setDescription(`Pago: ${debt.name} - ${debt.payee}`);
    }
  }, [open, debt, defaultAccountId]);

  if (!debt) return null;

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
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Registrar pago"
      description="Mismo flujo que un gasto: se crea la transacción de egreso y se descuenta del pendiente"
      className="max-w-lg"
      headerIcon={
        <Banknote className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />
      }
    >
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
            <span className="text-sm text-muted-foreground">Registrando pago…</span>
          </div>
        )}

        <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm">
          <p className="font-medium text-foreground">{debt.name}</p>
          <p className="text-muted-foreground">Pendiente: {formatMoney(remaining)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SavvyDatePicker
                label="Fecha"
                value={date}
                onChange={(d) => setDate(d)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Monto
              </label>
              <CurrencyField
                value={amount}
                onChange={setAmount}
              />
              <p className="mt-1 text-xs text-muted-foreground">
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
            <label className="mb-1 block text-sm font-medium text-foreground">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25"
              rows={2}
              placeholder="Ej. Pago mes marzo"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl">
              Registrar pago
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
