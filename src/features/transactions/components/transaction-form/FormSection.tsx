import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Bloque del formulario con una pregunta corta ("¿En qué?") en vez de una etiqueta
 * técnica. Si falta y el usuario intentó guardar, se marca y se sacude.
 */
export default function FormSection({
  id,
  title,
  hint,
  error = false,
  action,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  error?: boolean;
  /** Acción a la derecha del título (p. ej. "Ver todas"). */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("scroll-mt-4", error && "animate-shake")}
    >
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h3
          id={`${id}-title`}
          className={cn(
            "text-sm font-semibold",
            error ? "text-rose-600" : "text-[#0B1829]"
          )}
        >
          {title}
          {error ? (
            <span className="ml-2 text-xs font-medium">· Requerido</span>
          ) : hint ? (
            <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>
          ) : null}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}
