"use client";

import { useState } from "react";
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
}: TransactionTableProps) {
  const [page, setPage] = useState(1);

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
      key: "receipt",
      header: "Receipt",
      className: "text-right",
      render: (item) => (
        <button
          type="button"
          className="rounded-full border border-accent px-4 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/10"
          onClick={() => onShow?.(item.id)}
        >
          Ver
        </button>
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
