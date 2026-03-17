"use client";

import { useMemo, useState } from "react";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { Button } from "@/components/ui/button";
import SavvyBanner from "@/components/Banner/SavvyBanner";
import type { Category } from "@/features/categories/types/category.type";
import BudgetTable, {
  BudgetRow,
} from "@/features/budgets/components/BudgetTable";
import { BudgetModal } from "@/features/budgets/components/BudgetModal";
import toast from "react-hot-toast";

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}

function isInCurrentMonth(dateStr: string) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const { start, end } = getCurrentMonthRange();
  return date >= start && date <= end;
}

export default function BudgetPage() {
  const { categories, loading: loadingCategories } = useCategories();
  const { transactions, loading: loadingTransactions } = useTransactions();
  const { budgets, loading: loadingBudgets, createOrUpdate } = useBudgets();

  const [modalOpen, setModalOpen] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const rows: BudgetRow[] = useMemo(() => {
    const expenseCategories = categories.filter(
      (cat) => (cat.type ?? "egreso") === "egreso" && cat.isActive
    );

    const byId: Record<string, Category> = {};
    expenseCategories.forEach((c) => {
      byId[c.id] = c;
    });

    return budgets
      .filter(
        (b) =>
          b.period === "monthly" &&
          b.isActive &&
          b.year === currentYear &&
          b.month === currentMonth
      )
      .map((b) => {
        const cat = byId[b.categoryId];
        if (!cat) return null;

        const spent = transactions
          .filter(
            (tx) =>
              tx.type === "egreso" &&
              tx.category === cat.name &&
              isInCurrentMonth(tx.date)
          )
          .reduce((sum, tx) => {
            const value = Number(tx.amount);
            const safe = Number.isFinite(value) ? value : 0;
            return sum + safe;
          }, 0);

        const budgetLimitRaw = Number(b.amount);
        const budgetLimit = Number.isFinite(budgetLimitRaw)
          ? budgetLimitRaw
          : 0;
        const remaining = Math.max(budgetLimit - spent, 0);

        let usagePercent: number | null = null;
        if (budgetLimit > 0) {
          const percentage = (spent / budgetLimit) * 100;
          usagePercent = Number.isFinite(percentage)
            ? Math.min(percentage, 999)
            : null;
        }

        const periodLabel = `${b.month.toString().padStart(2, "0")}/${b.year}`;

        return {
          id: b.id,
          name: cat.name,
          periodLabel,
          budgetLimit,
          spent,
          remaining,
          usagePercent,
        };
      })
      .filter((row): row is BudgetRow => row !== null);
  }, [budgets, categories, transactions, currentYear, currentMonth]);

  async function handleCreateBudget(payload: {
    categoryId: string;
    year: number;
    month: number;
    amount: number;
  }) {
    try {
      const ok = await createOrUpdate({
        categoryId: payload.categoryId,
        amount: payload.amount,
        period: "monthly",
        year: payload.year,
        month: payload.month,
        isActive: true,
      });
      if (ok) {
        toast.success("Presupuesto guardado");
        setModalOpen(false);
      }
    } finally {
      // noop
    }
  }

  const loading = loadingCategories || loadingTransactions || loadingBudgets;

  return (
    <>
      <SavvyBanner
        title="Presupuestos"
        subtitle="Crea presupuestos por categoría de gasto y controla cómo se consumen con tus transacciones."
      />

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setModalOpen(true)} variant="default" className="rounded-xl">
          + Crear presupuesto
        </Button>
      </div>

      <BudgetTable items={rows} loading={loading} />

      <BudgetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateBudget}
        categories={categories}
        loading={loading}
      />
    </>
  );
}

