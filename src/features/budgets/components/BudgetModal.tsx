"use client";

import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import SavvyBannerLight from "@/components/Banner/SavvyBannerLight";
import SavvySelect from "@/components/Select/Select";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import type { Category } from "@/features/categories/types/category.type";

interface BudgetModalForm {
  categoryId: string;
  period: string; // YYYY-MM
  amount: number | null;
}

export interface BudgetModalPayload {
  categoryId: string;
  year: number;
  month: number;
  amount: number;
}

interface BudgetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: BudgetModalPayload) => void;
  categories: Category[];
  loading?: boolean;
}

export function BudgetModal({
  open,
  onClose,
  onSubmit,
  categories,
  loading = false,
}: BudgetModalProps) {
  const [form, setForm] = useState<BudgetModalForm>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return {
      categoryId: "",
      period: `${y}-${m}`,
      amount: null,
    };
  });

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    setForm({
      categoryId: "",
      period: `${y}-${m}`,
      amount: null,
    });
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.amount || form.amount <= 0) return;
    const [yearStr, monthStr] = form.period.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) return;

    onSubmit({
      categoryId: form.categoryId,
      year,
      month,
      amount: form.amount,
    });
  };

  const expenseCategories = categories.filter(
    (c) => (c.type ?? "egreso") === "egreso" && c.isActive,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-lg bg-white/70 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <span className="text-sm text-gray-600">Cargando…</span>
        </div>
      )}

      <div className="relative w-full max-w-md animate-scaleIn rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-4 flex w-full justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 transition hover:bg-red-100"
            title="Cerrar"
          >
            <XMarkIcon className="h-5 w-5 text-red-600" />
          </button>
        </div>

        <SavvyBannerLight
          title="Crear presupuesto"
          subtitle="Define el límite mensual para una categoría de gasto."
        />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <SavvySelect
              label="Categoría"
              value={form.categoryId}
              onChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              placeholder="Selecciona una categoría de gasto"
              options={expenseCategories.map((c) => ({
                label: c.name,
                value: c.id,
              }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mes
            </label>
            <input
              type="month"
              value={form.period}
              onChange={(e) =>
                setForm((f) => ({ ...f, period: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Presupuesto (COP)
            </label>
            <CurrencyField
              value={form.amount}
              onChange={(value) =>
                setForm((f) => ({
                  ...f,
                  amount: value,
                }))
              }
            />
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-300 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              className="rounded-xl"
              disabled={loading}
            >
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

