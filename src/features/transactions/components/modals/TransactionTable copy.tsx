import React, { useState } from "react";
import Pagination from "@/components/Pagination/Pagination";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import { Transaction } from "../../types/transactions.types";
import Modal from "@/components/Modal/Modal";
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
  onShow,
}: TransactionTableProps) {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button className="px-2 py-1 bg-red-400 text-white rounded-md" onClick={() => setOpen(true)}>ver</button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Crear transacción"
      >
        <p>lorem</p>

      </Modal>

      <table className="w-full text-sm">
        {/* Header */}
        <thead className="border-b border-gray-200 text-gray-500">
          <tr>
            <th className="px-6 py-4 text-left font-medium">Tipo</th>
            <th className="px-6 py-4 text-left font-medium">Transaction ID</th>
            <th className="px-6 py-4 text-left font-medium">Descripción</th>
            <th className="px-6 py-4 text-left font-medium">Fecha</th>
            <th className="px-6 py-4 text-right font-medium">Monto ($)</th>
            <th className="px-6 py-4 text-right font-medium">Receipt</th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition">
              {/* Icon */}
              <td className="px-6 py-4" title={item.type}>
                <FlowIconTransaction type={item.type}/>
              </td>

              {/* ID */}
              <td className="px-6 py-4 text-gray-500">
                #{item.id.slice(0, 8)}…
              </td>

              {/* Description */}
              <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">
                <p title={item.description}>{item.description}</p>
              </td>


              {/* Date */}
              <td className="px-6 py-4 text-gray-500">{item.date}</td>

              {/* Amount */}
              <td
                className={`px-6 py-4 text-right font-semibold ${item.type === "ingreso" ? "text-emerald-500" : "text-rose-500"
                  }`}
              >
                {item.type === "ingreso" ? "+" : "-"}
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                }).format(item.amount)}
              </td>

              {/* Receipt */}
              <td className="px-6 py-4 text-right">
                <button
                  className="cursor-pointer rounded-full border border-blue-600 px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                  onClick={() => onShow?.(item.id)}
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="py-2">
        <Pagination currentPage={page} totalPages={4} onPageChange={setPage} />
      </div>
    </div>
  );
}
