"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TransactionFiltersToggleProps {
  open: boolean;
  onToggle: () => void;
  /** id del panel que se muestra/oculta (para `aria-controls`). */
  panelId: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  category: string;
  search: string;
  className?: string;
}

/**
 * Botón para plegar los filtros. Plegado, resume los filtros activos para que
 * se entienda por qué la lista no muestra todo (por defecto filtra el mes actual).
 */
export default function TransactionFiltersToggle({
  open,
  onToggle,
  panelId,
  dateFrom,
  dateTo,
  category,
  search,
  className,
}: TransactionFiltersToggleProps) {
  const activeFilters: string[] = [];
  if (dateFrom || dateTo) {
    activeFilters.push(
      `${dateFrom ? format(dateFrom, "d MMM", { locale: es }) : "Inicio"} – ${
        dateTo ? format(dateTo, "d MMM", { locale: es }) : "Hoy"
      }`,
    );
  }
  if (category) activeFilters.push(category);
  if (search.trim()) activeFilters.push(`“${search.trim()}”`);

  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
          open
            ? "border-mint/50 bg-mint/10 text-[#0B1829]"
            : "border-gray-200 bg-white text-gray-600 hover:border-mint/40 hover:text-[#0B1829]",
        )}
      >
        <SlidersHorizontal className="h-4 w-4 text-mint" aria-hidden />
        Filtros
        {activeFilters.length > 0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-mint px-1.5 text-[11px] font-bold leading-5 text-cosmos">
            {activeFilters.length}
          </span>
        ) : null}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {!open && activeFilters.length > 0 ? (
        <ul className="flex min-w-0 flex-wrap gap-1.5" aria-label="Filtros activos">
          {activeFilters.map((label) => (
            <li
              key={label}
              className="max-w-[12rem] truncate rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              title={label}
            >
              {label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
