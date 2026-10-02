"use client";

import { PieChart } from "lucide-react";
import { formatMoney } from "@/features/dashboard/utils/dashboard.utils";
import type { TopExpenseCategory } from "../types/profile.type";

const BAR_COLORS = [
  "from-mint to-cyan-400",
  "from-teal-500 to-teal-300",
  "from-cyan-500 to-sky-300",
  "from-indigo-500 to-indigo-300",
  "from-slate-500 to-slate-300",
];

export default function ProfileTopCategories({ categories }: { categories: TopExpenseCategory[] }) {
  const max = Math.max(1, ...categories.map((c) => c.total));

  return (
    <div
      className="savvi-profile-rise flex h-full flex-col rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm shadow-gray-200/25 sm:p-6"
      style={{ animationDelay: "320ms" }}
    >
      <div>
        <h3 className="text-base font-semibold text-[#0B1829]">¿En qué gastas más?</h3>
        <p className="text-xs text-gray-500">Tus 5 categorías con mayor gasto histórico</p>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
          <PieChart className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Aún no tienes gastos registrados.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {categories.map((c, i) => (
            <li
              key={c.category}
              className="savvi-profile-rise"
              style={{ animationDelay: `${400 + i * 70}ms` }}
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-semibold text-[#0B1829]">{c.category}</span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-[#0B1829]">
                  {formatMoney(c.total)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`savvi-profile-fill h-full rounded-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${(c.total / max) * 100}%`, animationDelay: `${480 + i * 70}ms` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                {c.count} {c.count === 1 ? "transacción" : "transacciones"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
