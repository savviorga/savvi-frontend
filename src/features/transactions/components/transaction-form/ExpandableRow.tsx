import { useId, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fila plegable para lo opcional (IA, documentos, recurrencia): el formulario
 * arranca corto y cada extra se abre solo si se necesita.
 */
export default function ExpandableRow({
  icon: Icon,
  iconClass = "bg-gray-100 text-gray-600",
  title,
  subtitle,
  open,
  onToggle,
  trailing,
  highlight = false,
  children,
}: {
  icon: LucideIcon;
  iconClass?: string;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  /** Reemplaza al chevron (p. ej. un interruptor). */
  trailing?: ReactNode;
  highlight?: boolean;
  children: ReactNode;
}) {
  const panelId = useId();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white transition-colors",
        open || highlight ? "border-mint/40" : "border-border"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50 active:bg-gray-100"
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none",
            open && "scale-110",
            iconClass
          )}
          aria-hidden
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#0B1829]">{title}</span>
          {subtitle ? (
            <span className="block truncate text-xs text-gray-500">{subtitle}</span>
          ) : null}
        </span>
        {trailing ?? (
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300",
              open && "rotate-180"
            )}
            aria-hidden
          />
        )}
      </button>

      {/* grid 0fr → 1fr anima la altura sin medirla. */}
      <div
        id={panelId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {/* El contenido aparece y baja un poco mientras la fila se abre. */}
          <div
            className={cn(
              "border-t border-gray-100 px-4 pb-4 pt-3 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
              open ? "translate-y-0 opacity-100 delay-100" : "-translate-y-2 opacity-0"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
