"use client";

import Link from "next/link";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import CustomTable, { Column } from "@/components/Table/CustomTable";
import DeleteButton from "@/components/Buttons/DeleteButton";

export interface BudgetRow {
  id: string;
  name: string;
  periodLabel: string;
  budgetLimit: number;
  spent: number;
  remaining: number;
  usagePercent: number | null;
  /** Partidas de detalle (facturas, servicios, etc.) */
  detailCount: number;
}

interface BudgetTableProps {
  items: BudgetRow[];
  loading: boolean;
  onDelete?: (id: string) => void;
}

export default function BudgetTable({
  items,
  loading,
  onDelete,
}: BudgetTableProps) {
  const columns: Column<BudgetRow>[] = [
    {
      key: "name",
      header: "Categoría de gasto",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-800">{row.name}</span>
          <span className="text-xs text-slate-400">
            Presupuesto para {row.periodLabel}
            {row.detailCount > 0 ? (
              <span className="text-emerald-600">
                {" "}
                · {row.detailCount} partida{row.detailCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </span>
        </div>
      ),
    },
    {
      key: "budgetLimit",
      header: "Presupuesto asignado",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {row.budgetLimit.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            })}
          </span>
          <span className="text-[11px] text-slate-400">Límite mensual</span>
        </div>
      ),
    },
    {
      key: "spent",
      header: "Gastado (mes actual)",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-rose-600">
            {row.spent.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            })}
          </span>
          {row.usagePercent !== null && (
            <span
              className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                row.usagePercent >= 100
                  ? "bg-rose-100 text-rose-700"
                  : row.usagePercent >= 80
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {row.usagePercent.toFixed(0)}% usado
            </span>
          )}
        </div>
      ),
    },
    {
      key: "remaining",
      header: "Disponible",
      render: (row) => {
        const isOver = row.spent > row.budgetLimit;
        const remainingValue = Math.max(row.budgetLimit - row.spent, 0);

        return (
          <div className="flex flex-col gap-1">
            <span
              className={
                isOver
                  ? "text-rose-600 font-semibold"
                  : "text-emerald-700 font-medium"
              }
            >
              {remainingValue.toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0,
              })}
            </span>
            {row.usagePercent !== null && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    row.usagePercent >= 100
                      ? "bg-rose-500"
                      : row.usagePercent >= 80
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(row.usagePercent, 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-36",
      render: (row) => {
        return (
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Link
              href={`/budget/${row.id}`}
              className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
              title="Detalle (facturas, servicios…)"
              aria-label="Ver detalle del presupuesto"
            >
              <ClipboardDocumentListIcon className="size-4" />
            </Link>
            {onDelete && (
              <DeleteButton
                label="Eliminar"
                onDelete={() => onDelete(row.id)}
                confirmMessage="¿Eliminar este presupuesto? Esta acción no se puede deshacer."
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <CustomTable
        data={items}
        columns={columns}
        loading={loading}
        rowKey={(row) => row.id}
        totalPages={1}
        onPageChange={() => {}}
      />
    </div>
  );
}

