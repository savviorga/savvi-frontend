"use client";

import { useParams } from "next/navigation";
import { BudgetDetailSpreadsheet } from "@/features/budgets/components/BudgetDetailSpreadsheet";

export default function BudgetDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  if (!id) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Identificador de presupuesto no válido.
      </p>
    );
  }

  return <BudgetDetailSpreadsheet budgetId={id} />;
}
