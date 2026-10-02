"use client";

import { useState } from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { formatMoney } from "@/features/dashboard/utils/dashboard.utils";
import type { MonthlySummary } from "../types/profile.type";

function monthLabel(month: string, pattern: string) {
  const label = format(parse(month, "yyyy-MM", new Date()), pattern, { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

/** Barras CSS animadas de ingresos vs. gastos de `summary.monthly`. */
export default function ProfileCashFlow({ data }: { data: MonthlySummary[] }) {
  const [active, setActive] = useState(data.length - 1);
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const current = data[active];

  if (!current) return null;

  return (
    <div
      className="savvi-profile-rise flex h-full flex-col rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm shadow-gray-200/25 sm:p-6"
      style={{ animationDelay: "250ms" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#0B1829]">Últimos {data.length} meses</h3>
          <p className="text-xs text-gray-500">Pasa el cursor por un mes para ver el detalle</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-mint" /> Ingresos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Gastos
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-3">
        <p className="mb-2 text-center text-xs font-semibold text-[#0B1829]">
          {monthLabel(current.month, "MMMM yyyy")} · {current.count} movimientos
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Ingresos</p>
            <p className="mt-0.5 truncate text-sm font-bold text-mint tabular-nums">{formatMoney(current.income)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Gastos</p>
            <p className="mt-0.5 truncate text-sm font-bold text-rose-500 tabular-nums">{formatMoney(current.expense)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Neto</p>
            <p
              className={`mt-0.5 truncate text-sm font-bold tabular-nums ${
                current.net >= 0 ? "text-[#0B1829]" : "text-rose-600"
              }`}
            >
              {formatMoney(current.net)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto scrollbar-none">
        <div className="flex h-[200px] min-w-[480px] items-end justify-between gap-1.5 sm:gap-2.5">
          {data.map((d, i) => {
            const isActive = i === active;
            return (
              <button
                key={d.month}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-2 focus:outline-none"
                aria-label={`${monthLabel(d.month, "MMMM yyyy")}: ingresos ${formatMoney(d.income)}, gastos ${formatMoney(d.expense)}`}
              >
                <div className="flex h-full w-full items-end justify-center gap-0.5">
                  <span
                    className={`savvi-grow-bar w-1/3 max-w-[14px] rounded-t-md bg-gradient-to-t from-mint-dim to-mint transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-45 group-hover:opacity-75"}`}
                    style={{ height: `${Math.max((d.income / max) * 100, d.income > 0 ? 2 : 0)}%`, animationDelay: `${300 + i * 50}ms` }}
                  />
                  <span
                    className={`savvi-grow-bar w-1/3 max-w-[14px] rounded-t-md bg-gradient-to-t from-rose-500 to-rose-300 transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-45 group-hover:opacity-75"}`}
                    style={{ height: `${Math.max((d.expense / max) * 100, d.expense > 0 ? 2 : 0)}%`, animationDelay: `${340 + i * 50}ms` }}
                  />
                </div>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium transition-colors ${isActive ? "bg-[#0B1829] text-white" : "text-gray-500"}`}
                >
                  {monthLabel(d.month, "MMM")}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
