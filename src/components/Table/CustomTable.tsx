"use client";

import { ReactNode, useState } from "react";
import Pagination from "@/components/Pagination/Pagination";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface CustomTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  rowKey: (row: T) => string;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function CustomTable<T>({
  data,
  columns,
  loading = false,
  rowKey,
  totalPages,
  onPageChange,
}: CustomTableProps<T>) {
  const [page, setPage] = useState(1);

  const handlePageChange = (p: number) => {
    setPage(p);
    onPageChange?.(p);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-slate-200/50">
      {/* Gradient accent top border */}
      <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100">
            {/* Loading State */}
            {loading && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    {/* Spinner */}
                    <div className="relative h-10 w-10">
                      <div className="absolute inset-0 rounded-full border-[3px] border-slate-200" />
                      <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">
                      Cargando información...
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty State */}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    {/* Empty icon */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                      <svg
                        className="h-7 w-7 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-600">
                        No hay registros
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Los datos aparecerán aquí cuando estén disponibles
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!loading &&
              data.map((row, index) => (
                <tr
                  key={rowKey(row)}
                  className={`group transition-colors duration-150 hover:bg-emerald-50/50 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 text-slate-700 ${col.className ?? ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages && totalPages > 1 && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
