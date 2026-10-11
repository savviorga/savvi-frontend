import { CircleAlert, CircleCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDueStatus, type DueUrgency } from "../utils/schedule";

const URGENCY_STYLES: Record<
  DueUrgency,
  { icon: typeof Clock; text: string; badge: string }
> = {
  critical: {
    icon: CircleAlert,
    text: "text-rose-600",
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
  },
  soon: {
    icon: Clock,
    text: "text-amber-600",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  ok: {
    icon: CircleCheck,
    text: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
};

/**
 * Semáforo del próximo vencimiento: rojo (vencido o ≤ 3 días), ámbar (4–10) y verde (> 10).
 * `text` va en la tabla para no competir con el badge de estado; `badge` en el detalle.
 */
export default function DueStatus({
  nextDueDate,
  variant = "text",
  className,
}: {
  nextDueDate: string;
  variant?: "text" | "badge";
  className?: string;
}) {
  const { urgency, label } = getDueStatus(nextDueDate);
  const { icon: Icon, text, badge } = URGENCY_STYLES[urgency];

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1",
          badge,
          className
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold",
        text,
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  );
}

/**
 * Clases de fila para la tabla: franja de color a la izquierda según el semáforo y,
 * solo en rojo, un fondo suave. Colorear toda la fila de cada estado satura la vista.
 */
const ROW_CLASSES: Record<DueUrgency | "paused", string> = {
  critical:
    "bg-rose-50/70 shadow-[inset_4px_0_0_#f43f5e] [&>td]:bg-rose-50/70 hover:[&>td]:bg-rose-100/60 [&>td:first-child]:shadow-[inset_4px_0_0_#f43f5e]",
  soon: "shadow-[inset_4px_0_0_#f59e0b] [&>td:first-child]:shadow-[inset_4px_0_0_#f59e0b]",
  ok: "shadow-[inset_4px_0_0_#34d399] [&>td:first-child]:shadow-[inset_4px_0_0_#34d399]",
  paused: "shadow-[inset_4px_0_0_#cbd5e1] [&>td:first-child]:shadow-[inset_4px_0_0_#cbd5e1]",
};

export function dueRowClassName(template: {
  isActive: boolean;
  nextDueDate: string;
}): string {
  if (!template.isActive) return ROW_CLASSES.paused;
  return ROW_CLASSES[getDueStatus(template.nextDueDate).urgency];
}
