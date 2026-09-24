"use client";

import { useId, useMemo, useState } from "react";
import { endOfMonth, format, startOfDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronDown, Search, X } from "lucide-react";
import SavvyDatePicker from "@/components/SavvyDatePicker/SavvyDatePicker";
import SavvySelect from "@/components/Select/Select";
import { Button } from "@/components/ui/shadcn-button";
import { cn } from "@/lib/utils";
import { getCurrentMonthDateRange } from "../utils/transactionFilters";

export interface TransactionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  /** Nombres de categoría disponibles para filtrar. */
  categoryNames: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  onDateFromChange: (date: Date | null) => void;
  onDateToChange: (date: Date | null) => void;
  /** Quita todos los filtros (búsqueda, categoría y fechas). */
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

/**
 * Búsqueda, categoría y rango de fechas en una sola tarjeta. En escritorio los
 * cuatro campos van en una fila y los atajos de fecha debajo.
 */
export default function TransactionFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categoryNames,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  className,
}: TransactionFiltersProps) {
  const searchId = useId();
  const today = startOfDay(new Date());
  const hasDateFilter = dateFrom !== null || dateTo !== null;
  const hasFilter = hasDateFilter || search.trim() !== "" || category !== "";
  /** En móvil el rango personalizado va plegado: los atajos cubren el caso común. */
  const [showRange, setShowRange] = useState(false);

  const categoryOptions = useMemo(
    () => [
      { label: "Todas las categorías", value: "" },
      ...categoryNames.map((name) => ({ label: name, value: name })),
    ],
    [categoryNames],
  );

  const monthRange = getCurrentMonthDateRange(today);
  const isThisMonth =
    dateFrom?.getTime() === monthRange.from.getTime() &&
    dateTo?.getTime() === monthRange.to.getTime();

  const isLast30Days =
    dateFrom?.getTime() === subDays(today, 29).getTime() &&
    dateTo?.getTime() === today.getTime();

  // Plegado, el botón muestra el rango activo para no perderlo de vista.
  const rangeLabel = hasDateFilter
    ? `${dateFrom ? format(dateFrom, "d MMM", { locale: es }) : "Inicio"} – ${
        dateTo ? format(dateTo, "d MMM", { locale: es }) : "Hoy"
      }`
    : "Rango";

  const applyThisMonth = () => {
    onDateFromChange(monthRange.from);
    onDateToChange(monthRange.to);
  };

  const applyLast30Days = () => {
    onDateFromChange(subDays(today, 29));
    onDateToChange(today);
  };

  const clearDates = () => {
    onDateFromChange(null);
    onDateToChange(null);
  };

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
        "mb-4 grid gap-3 rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm sm:grid-cols-2 sm:p-4 lg:grid-cols-4",
        className,
      )}
    >
      <div className="flex w-full flex-col gap-1.5">
        <label
          htmlFor={searchId}
          className="text-sm font-medium leading-none text-foreground"
        >
          Nombre
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por descripción…"
            autoComplete="off"
            className={cn(
              "box-border h-10 w-full rounded-xl border border-border bg-white py-2 pl-9 pr-9 text-sm shadow-none transition-[color,box-shadow,border-color]",
              "placeholder:text-muted-foreground hover:bg-muted/30",
              "focus:border-[#00C49A] focus:outline-none focus:ring-2 focus:ring-[#00C49A]/25",
              "[&::-webkit-search-cancel-button]:appearance-none",
            )}
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Borrar búsqueda"
              className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-2.5 text-muted-foreground transition hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <SavvySelect
        label="Categoría"
        value={category}
        onChange={onCategoryChange}
        placeholder="Todas las categorías"
        options={categoryOptions}
      />

      {/* Atajos: en escritorio van en la fila de abajo; en móvil antes del rango. */}
      <div className="flex flex-wrap items-center gap-1.5 sm:col-span-2 lg:order-last lg:col-span-4">
        <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-[#0B1829]">
          <CalendarDays className="h-4 w-4 text-mint" aria-hidden />
          Fecha
        </span>
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
          onClick={clearDates}
          className={presetClass(!hasDateFilter)}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => setShowRange((v) => !v)}
          aria-expanded={showRange}
          className={cn(
            presetClass(false),
            "inline-flex items-center gap-1 sm:hidden",
          )}
        >
          {rangeLabel}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              showRange && "rotate-180",
            )}
            aria-hidden
          />
        </button>

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

      <div className={showRange ? "contents" : "hidden sm:contents"}>
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
