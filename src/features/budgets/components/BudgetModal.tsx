"use client";

import { useEffect, useState } from "react";
import { PieChart } from "lucide-react";
import { Button } from "@/components/ui/shadcn-button";
import Modal from "@/components/Modal/Modal";
import SavvySelect from "@/components/Select/Select";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import type { Category } from "@/features/categories/types/category.type";

interface BudgetModalForm {
  categoryId: string;
  period: string; // YYYY-MM
  amount: number | null;
  /** Calcular el límite sumando las partidas (detalle del presupuesto). */
  autoCalculate: boolean;
}

export interface BudgetModalPayload {
  categoryId: string;
  year: number;
  month: number;
  amount: number;
  amountAutoCalculated: boolean;
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
      autoCalculate: false,
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
      autoCalculate: false,
    });
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) return;
    if (
      !form.autoCalculate &&
      (form.amount == null || !Number.isFinite(form.amount) || form.amount <= 0)
    ) {
      return;
    }
    const [yearStr, monthStr] = form.period.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) return;

    onSubmit({
      categoryId: form.categoryId,
      year,
      month,
      amount: form.autoCalculate ? 0 : form.amount!,
      amountAutoCalculated: form.autoCalculate,
    });
  };

  const expenseCategories = categories.filter(
    (c) => (c.type ?? "egreso") === "egreso" && c.isActive,
  );

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Crear presupuesto"
      description="Define el límite mensual para una categoría de gasto."
      className="max-w-md"
      headerIcon={
        <PieChart className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />
      }
    >
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
            <span className="text-sm text-muted-foreground">Cargando…</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="mb-1 block text-sm font-medium text-foreground">
              Mes
            </label>
            <input
              type="month"
              value={form.period}
              onChange={(e) =>
                setForm((f) => ({ ...f, period: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div className="rounded-xl border border-accent/20 bg-accent/10 px-3 py-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.autoCalculate}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((f) => ({
                    ...f,
                    autoCalculate: checked,
                    amount: checked ? 0 : null,
                  }));
                }}
                className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Calcular automáticamente
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  El límite será la suma de los montos estimados de las partidas que
                  agregues en el detalle del presupuesto.
                </span>
              </span>
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Presupuesto (COP)
            </label>
            <CurrencyField
              value={form.autoCalculate ? 0 : form.amount}
              onChange={(value) =>
                setForm((f) => ({
                  ...f,
                  amount: value,
                }))
              }
              disabled={form.autoCalculate}
            />
            {form.autoCalculate ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Desactivá el cálculo automático para ingresar un monto manual.
              </p>
            ) : null}
          </div>

          <div className="flex justify-end space-x-3 border-t border-border pt-4">
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
              disabled={
                loading ||
                !form.categoryId ||
                (!form.autoCalculate &&
                  (form.amount == null ||
                    !Number.isFinite(form.amount) ||
                    form.amount <= 0))
              }
            >
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

