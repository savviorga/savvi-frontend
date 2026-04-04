"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import CustomTable, { Column } from "@/components/Table/CustomTable";
import { Transaction } from "../../types/transactions.types";
import { FlowIconTransaction } from "../FlowIconTransaction";

interface TransactionTableProps {
  items: Transaction[];
  loading: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onShow?: (id: string) => void;
}

export default function TransactionTable({
  items,
  loading,
  onShow,
  onDelete,
}: TransactionTableProps) {
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (confirmId === id) {
      onDelete?.(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  };

  const columns: Column<Transaction>[] = [
    {
      key: "type",
      header: "Tipo",
      render: (item) => <FlowIconTransaction type={item.type} />,
    },
    {
      key: "date",
      header: "Fecha",
      render: (item) => (
        <span className="text-muted-foreground">{item.date}</span>
      ),
    },
    {
      key: "description",
      header: "Descripción",
      render: (item) => (
        <p
          className="max-w-xs truncate font-medium text-foreground"
          title={item.description}
        >
          {item.description}
        </p>
      ),
    },
    {
      key: "amount",
      header: "Monto ($)",
      className: "text-right",
      render: (item) => (
        <span
          className={`font-semibold ${
            item.type === "ingreso"
              ? "text-emerald-500"
              : "text-rose-500"
          }`}
        >
          {item.type === "ingreso" ? "+" : "-"}
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
          }).format(item.amount)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-accent px-4 py-1.5 text-sm font-medium transition hover:bg-accent/10"
            onClick={() => onShow?.(item.id)}
          >
            Ver
          </button>
          {onDelete && (
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                confirmId === item.id
                  ? "border border-red-500 bg-red-500 text-white hover:bg-red-600"
                  : "border border-red-200 text-red-500 hover:bg-red-50"
              }`}
              onClick={() => handleDelete(item.id)}
              onBlur={() => setConfirmId(null)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirmId === item.id ? "Confirmar" : "Eliminar"}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <CustomTable
        data={items}
        columns={columns}
        loading={loading}
        rowKey={(item) => item.id}
        totalPages={4}
        onPageChange={setPage}
      />
    </div>
  );
}
