"use client";

import { CalendarClock, Crown, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedMoney from "./AnimatedMoney";
import { formatMoney } from "../utils/dashboard.utils";

function Tile({
  icon: Icon,
  iconClass,
  label,
  children,
  hint,
  index,
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  children: React.ReactNode;
  hint?: string;
  index: number;
}) {
  return (
    <div
      className="group flex items-center gap-3.5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0 sm:flex-col sm:items-start sm:gap-3 sm:p-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-500"
      style={{ animationDelay: `${120 + index * 90}ms` }}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
          iconClass,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="mt-0.5 truncate text-lg font-bold text-[#0B1829]">{children}</div>
        {hint && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  );
}

/** Tres datos para entender el periodo de un vistazo. */
export default function InsightTiles({
  dailyAvg,
  projected,
  comparison,
  topCategory,
  totalExpenses,
}: {
  dailyAvg: number;
  projected: number | null;
  comparison: { previousGastos: number; diffPercent: number } | null;
  topCategory: { categoryName: string; total: number } | null;
  totalExpenses: number;
}) {
  const down = comparison ? comparison.diffPercent <= 0 : false;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Tile
        index={0}
        icon={CalendarClock}
        iconClass="bg-sky-50 text-sky-600"
        label="Gastas al día"
        hint={
          projected !== null
            ? `A este ritmo cerrarás el mes en ${formatMoney(projected)}`
            : "Promedio del periodo"
        }
      >
        <AnimatedMoney value={dailyAvg} />
      </Tile>

      {comparison ? (
        <Tile
          index={1}
          icon={down ? TrendingDown : TrendingUp}
          iconClass={down ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}
          label="Frente al mes anterior"
          hint={
            comparison.previousGastos > 0
              ? `El mes pasado gastaste ${formatMoney(comparison.previousGastos)}`
              : "El mes pasado no registraste gastos"
          }
        >
          <span className={down ? "text-emerald-600" : "text-rose-600"}>
            {down ? "↓" : "↑"} {Math.abs(Math.round(comparison.diffPercent))}%{" "}
            <span className="text-sm font-semibold">{down ? "menos" : "más"}</span>
          </span>
        </Tile>
      ) : (
        <Tile index={1} icon={TrendingUp} iconClass="bg-violet-50 text-violet-600" label="Gasto del año" hint="Suma de todos tus egresos">
          <AnimatedMoney value={totalExpenses} />
        </Tile>
      )}

      <Tile
        index={2}
        icon={Crown}
        iconClass="bg-amber-50 text-amber-600"
        label="Tu mayor gasto"
        hint={
          topCategory && totalExpenses > 0
            ? `${formatMoney(topCategory.total)} · ${Math.round((topCategory.total / totalExpenses) * 100)}% del total`
            : "Aún no hay gastos en este periodo"
        }
      >
        {topCategory?.categoryName ?? "—"}
      </Tile>
    </div>
  );
}
