"use client";

import { endOfMonth, startOfDay, subDays } from "date-fns";
import { getCurrentMonthDateRange } from "../utils/transactionFilters";
import { CalendarDays } from "lucide-react";
import SavvyDatePicker from "@/components/SavvyDatePicker/SavvyDatePicker";
import { Button } from "@/components/ui/shadcn-button";
import { cn } from "@/lib/utils";

export interface TransactionDateFilterProps {
  dateFrom: Date | null;
  dateTo: Date | null;
  onDateFromChange: (date: Date | null) => void;
  onDateToChange: (date: Date | null) => void;
  onClear: () => void;
  className?: string;
}

const presetClass = (active: boolean) =>
  cn(
    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
    active
      ? "bg-mint text-cosmos shadow-sm"
      : "border border-gray-200 bg-white text-gray-600 hover:border-mint/40 hover:text-[#0B1829]",
  );

export default function TransactionDateFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  className,
}: TransactionDateFilterProps) {
  const today = startOfDay(new Date());
  const hasFilter = dateFrom !== null || dateTo !== null;

  const applyThisMonth = () => {
    const { from, to } = getCurrentMonthDateRange(today);
    onDateFromChange(from);
    onDateToChange(to);
  };

  const applyLast30Days = () => {
    onDateFromChange(subDays(today, 29));
    onDateToChange(today);
  };

  const monthRange = getCurrentMonthDateRange(today);
  const isThisMonth =
    dateFrom?.getTime() === monthRange.from.getTime() &&
    dateTo?.getTime() === monthRange.to.getTime();

  const isLast30Days =
    dateFrom?.getTime() === subDays(today, 29).getTime() &&
    dateTo?.getTime() === today.getTime();

  const handleFromChange = (date: Date | null) => {
    onDateFromChange(date);
    if (date && dateTo && date > dateTo) onDateToChange(date);
  };

  const handleToChange = (date: Date | null) => {
    onDateToChange(date);
    if (date && dateFrom && date < dateFrom) onDateFromChange(date);
  };

  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm sm:p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#0B1829]">
          <CalendarDays className="h-4 w-4 text-mint" aria-hidden />
          Filtrar por fecha
        </div>

        <div className="flex flex-wrap gap-1.5 sm:ml-2">
          <button
            type="button"
            onClick={applyThisMonth}
            className={presetClass(isThisMonth)}
          >
            Este mes
          </button>
          <button
            type="button"
            onClick={applyLast30Days}
            className={presetClass(isLast30Days)}
          >
            Últimos 30 días
          </button>
          <button
            type="button"
            onClick={onClear}
            className={presetClass(!hasFilter)}
          >
            Todas
          </button>
        </div>

        {hasFilter ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="ml-auto h-8 rounded-lg text-xs text-gray-500 hover:text-[#0B1829]"
          >
            Limpiar
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SavvyDatePicker
          label="Desde"
          value={dateFrom}
          onChange={handleFromChange}
          placeholder="Sin límite"
          clearable
          maxDate={dateTo ?? undefined}
          triggerClassName="w-full"
        />
        <SavvyDatePicker
          label="Hasta"
          value={dateTo}
          onChange={handleToChange}
          placeholder="Sin límite"
          clearable
          minDate={dateFrom ?? undefined}
          maxDate={startOfDay(endOfMonth(today))}
          triggerClassName="w-full"
        />
      </div>
    </div>
  );
}
