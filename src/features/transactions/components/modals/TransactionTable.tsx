"use client";

import { useState } from "react";
import CustomTable, { Column } from "@/components/Table/CustomTable";
import Modal from "@/components/Modal/Modal";
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
  const [open, setOpen] = useState(false);

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
        <span className="text-gray-500">{item.date}</span>
      ),
    },
    {
      key: "description",
      header: "Descripción",
      render: (item) => (
        <p
          className="max-w-xs truncate font-medium text-gray-900"
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
          className="rounded-full border border-blue-600 px-4 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
          onClick={() => onShow?.(item.id)}
        >
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Modal trigger */}
      <button
        className="rounded-md bg-red-400 px-2 py-1 text-white"
        onClick={() => setOpen(true)}
      >
        Ver
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Crear transacción"
      >
        <p>lorem</p>
      </Modal>

      {/* Table */}
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
