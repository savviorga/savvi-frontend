import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, type LucideIcon } from "lucide-react";

export type TransactionKind = "ingreso" | "egreso" | "transferencia";

/** Color de cada tipo: el formulario completo toma el tono del movimiento. */
export const TYPE_THEME: Record<
  TransactionKind,
  {
    label: string;
    /** Sustantivo para el botón "Guardar gasto". */
    noun: string;
    icon: LucideIcon;
    /** Fondo de la pastilla que se desliza bajo el tipo elegido. */
    indicator: string;
    heroBg: string;
    amount: string;
  }
> = {
  egreso: {
    label: "Gasto",
    noun: "gasto",
    icon: ArrowUpRight,
    indicator: "bg-rose-500 shadow-rose-500/30",
    heroBg: "bg-rose-50/80",
    amount: "text-rose-600",
  },
  ingreso: {
    label: "Ingreso",
    noun: "ingreso",
    icon: ArrowDownLeft,
    indicator: "bg-emerald-500 shadow-emerald-500/30",
    heroBg: "bg-emerald-50/80",
    amount: "text-emerald-600",
  },
  transferencia: {
    label: "Transferencia",
    noun: "transferencia",
    icon: ArrowLeftRight,
    indicator: "bg-sky-500 shadow-sky-500/30",
    heroBg: "bg-sky-50/80",
    amount: "text-sky-600",
  },
};

export const TYPE_ORDER: TransactionKind[] = ["egreso", "ingreso", "transferencia"];

export function isTransactionKind(value: string): value is TransactionKind {
  return value in TYPE_THEME;
}

/** Chip seleccionable (categoría, cuenta, fecha): mint de marca al elegirlo. */
export const CHIP_BASE =
  "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:scale-[.96] motion-reduce:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50";

/**
 * Entrada escalonada (aparece y sube un poco). `index` define el retraso para que
 * los elementos lleguen uno tras otro.
 */
export function enterAnimation(index: number, stepMs = 45) {
  return {
    className:
      "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-500",
    style: { animationDelay: `${index * stepMs}ms` },
  };
}
export const CHIP_IDLE =
  "border-border bg-white text-gray-700 hover:border-mint/40 hover:bg-mint/5";
export const CHIP_SELECTED =
  "border-mint bg-mint/10 text-[#0B1829] ring-1 ring-mint";
