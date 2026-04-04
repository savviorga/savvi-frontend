"use client";

import { ReactNode, useState } from "react";
import Pagination from "@/components/Pagination/Pagination";
import LinearLoader from "../Loaders/LinearLoader";

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
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-lg shadow-border/50">
      <div className="h-[2px] bg-[#00C49A]" aria-hidden />

      {/* ── Loading ── */}
      {loading && (
        <div className="px-6 py-16 text-center">
          <LinearLoader />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && data.length === 0 && (
        <div className="px-6 py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <svg
                className="h-7 w-7 text-muted-foreground"
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
              <p className="text-sm font-medium text-muted-foreground">
                No hay registros
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Los datos aparecerán aquí cuando estén disponibles
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop: tabla clásica (hidden en < md) ── */}
      {!loading && data.length > 0 && (
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/80">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col.className ?? ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, index) => (
                <tr
                  key={rowKey(row)}
                  className={`group transition-colors duration-150 hover:bg-accent/10 ${
                    index % 2 === 0 ? "bg-white" : "bg-muted/30"
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 text-foreground ${col.className ?? ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Mobile: cards verticales (visible solo en < md) ── */}
      {!loading && data.length > 0 && (
        <div className="divide-y divide-border/40 md:hidden">
          {data.map((row) => (
            <div key={rowKey(row)} className="space-y-2 px-4 py-3">
              {columns.map((col) => {
                if (!col.header) {
                  return (
                    <div key={col.key} className="pt-1">
                      {col.render(row)}
                    </div>
                  );
                }
                return (
                  <div
                    key={col.key}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {col.header}
                    </span>
                    <span className="text-right text-sm text-foreground">
                      {col.render(row)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages && totalPages > 1 && (
        <div className="border-t border-border bg-muted/50 px-6 py-4">
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
