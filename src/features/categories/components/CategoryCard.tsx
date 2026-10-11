"use client";

import { forwardRef, useState, type HTMLAttributes } from "react";
import {
  Ban,
  ChevronRight,
  EllipsisVertical,
  FolderInput,
  FolderOutput,
  GripVertical,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Category } from "../types/category.type";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export interface CategoryMenuActions {
  onEdit: (category: Category) => void;
  onToggleActive: (category: Category) => void;
  onDelete: (category: Category) => void;
  /** Solo para subcategorías: la devuelve a la lista principal. */
  onTakeOut?: (category: Category) => void;
}

/** Estado de la tarjeta mientras se arrastra otra encima. */
export type DropState =
  | { kind: "idle" }
  /** Hay un arrastre en curso y esta tarjeta lo acepta. */
  | { kind: "available" }
  | { kind: "over"; message: string }
  | { kind: "blocked"; message: string };

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none",
        danger
          ? "text-rose-600 hover:bg-rose-50 focus:bg-rose-50"
          : "text-gray-700 hover:bg-gray-100 focus:bg-gray-100",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

export function CategoryMenu({
  category,
  actions,
  parentName,
  className,
}: {
  category: Category;
  actions: CategoryMenuActions;
  parentName?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const run = (fn: (c: Category) => void) => () => {
    setOpen(false);
    fn(category);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // No inicia el arrastre de la tarjeta.
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-100 hover:text-[#0B1829] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50",
            open && "bg-gray-100 text-[#0B1829]",
            className,
          )}
          aria-label={`Acciones de ${category.name}`}
        >
          <EllipsisVertical className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 rounded-xl p-1.5" role="menu">
        <MenuItem icon={Pencil} label="Editar" onClick={run(actions.onEdit)} />
        {actions.onTakeOut && (
          <MenuItem
            icon={FolderOutput}
            label={parentName ? `Sacar de ${parentName}` : "Sacar de la categoría"}
            onClick={run(actions.onTakeOut)}
          />
        )}
        <MenuItem
          icon={category.isActive ? PowerOff : Power}
          label={category.isActive ? "Desactivar" : "Activar"}
          onClick={run(actions.onToggleActive)}
        />
        <div className="my-1 h-px bg-border" />
        <MenuItem icon={Trash2} label="Eliminar" onClick={run(actions.onDelete)} danger />
      </PopoverContent>
    </Popover>
  );
}

export function CategoryAvatar({ category, size = "md" }: { category: Category; size?: "sm" | "md" | "lg" }) {
  const color = category.color ?? "#94a3b8";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-bold uppercase",
        size === "sm" && "h-9 w-9 text-xs",
        size === "md" && "h-11 w-11 text-sm",
        size === "lg" && "h-14 w-14 rounded-2xl text-lg",
      )}
      style={{ backgroundColor: `${color}22`, color }}
      aria-hidden
    >
      {category.name.trim().charAt(0) || "?"}
    </span>
  );
}

export interface CategoryCardProps extends HTMLAttributes<HTMLDivElement> {
  category: Category;
  subCount?: number;
  /** Transacciones a mostrar (en una categoría con subcategorías, las de todo el grupo). */
  transactions: number;
  /** Texto extra, p. ej. la subcategoría que coincide con la búsqueda. */
  note?: string;
  drop?: DropState;
  /** Esta tarjeta es la que se está arrastrando (queda como hueco). */
  placeholder?: boolean;
  /** Copia que sigue al dedo o al mouse. */
  overlay?: boolean;
  /** Acaba de recibir una subcategoría: rebota. */
  pop?: boolean;
  showChevron?: boolean;
  menu?: React.ReactNode;
}

/**
 * Tarjeta de categoría. Las que tienen subcategorías se ven como una pila de
 * tarjetas. Mientras se arrastra otra encima muestra si se puede soltar ahí.
 */
export const CategoryCard = forwardRef<HTMLDivElement, CategoryCardProps>(function CategoryCard(
  {
    category,
    subCount = 0,
    transactions,
    note,
    drop = { kind: "idle" },
    placeholder,
    overlay,
    pop,
    showChevron,
    menu,
    className,
    ...rest
  },
  ref,
) {
  const income = category.type === "ingreso";
  const stacked = subCount > 0;

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        "group relative isolate select-none outline-none",
        stacked && "mb-1.5",
        className,
      )}
    >
      {/* Pila: una categoría con subcategorías se ve como varias tarjetas */}
      {stacked && !overlay && (
        <>
          <span className="absolute inset-x-3 -bottom-1.5 -z-10 h-6 rounded-2xl border border-border bg-white/70" aria-hidden />
          <span className="absolute inset-x-1.5 -bottom-[3px] -z-10 h-6 rounded-2xl border border-border bg-white/90" aria-hidden />
        </>
      )}

      <div
        className={cn(
          "relative flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm transition-all duration-200 sm:p-3.5",
          "cursor-grab active:cursor-grabbing group-focus-visible:ring-2 group-focus-visible:ring-mint/60",
          !overlay && "hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0",
          !category.isActive && "bg-slate-50",
          drop.kind === "idle" && "border-border",
          drop.kind === "available" && "border-dashed border-mint/50",
          drop.kind === "over" && "scale-[1.03] border-mint shadow-lg shadow-mint/20 ring-2 ring-mint",
          drop.kind === "blocked" && "border-rose-300 ring-2 ring-rose-200",
          placeholder && "border-dashed border-gray-300 opacity-40 shadow-none",
          overlay && "rotate-2 scale-[1.04] cursor-grabbing border-mint/60 shadow-2xl shadow-[#0B1829]/20",
          pop && "savvi-pop",
        )}
      >
        <GripVertical
          className="hidden h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-400 sm:block"
          aria-hidden
        />
        <span className="relative">
          <CategoryAvatar category={category} />
          {stacked && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0B1829] px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {subCount}
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "truncate text-sm font-semibold sm:text-[15px]",
                category.isActive ? "text-[#0B1829]" : "text-slate-500",
              )}
            >
              {category.name}
            </span>
            {!category.isActive && (
              <span className="shrink-0 rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Inactiva
              </span>
            )}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <span className={income ? "text-emerald-600" : "text-rose-600"}>
              {income ? "Ingresos" : "Gastos"}
            </span>
            {stacked && (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-foreground/80">
                  {plural(subCount, "subcategoría", "subcategorías")}
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>
              {transactions > 0 ? plural(transactions, "transacción", "transacciones") : "Sin transacciones"}
            </span>
          </span>
          {note && <span className="mt-0.5 block truncate text-[11px] font-medium text-mint-dim">{note}</span>}
        </span>

        {menu}
        {showChevron && (
          <ChevronRight
            className="h-5 w-5 shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gray-500"
            aria-hidden
          />
        )}

        {/* Aviso mientras otra tarjeta está encima */}
        {(drop.kind === "over" || drop.kind === "blocked") && (
          <span
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-2xl px-4 text-center text-sm font-semibold backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95",
              drop.kind === "over" ? "bg-mint/15 text-[#0B1829]" : "bg-rose-50/95 text-rose-700",
            )}
          >
            {drop.kind === "over" ? (
              <FolderInput className="h-5 w-5 shrink-0 text-mint-dim motion-safe:animate-bounce" aria-hidden />
            ) : (
              <Ban className="h-5 w-5 shrink-0" aria-hidden />
            )}
            <span className="line-clamp-2">{drop.message}</span>
          </span>
        )}
      </div>
    </div>
  );
});
