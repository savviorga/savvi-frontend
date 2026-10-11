import { cn } from "@/lib/utils";
import { TYPE_ORDER, TYPE_THEME, type TransactionKind } from "./theme";

/**
 * Tres botones grandes: el tipo se elige de un toque. Una pastilla de color se
 * desliza hasta el elegido y el ícono da un pequeño salto.
 */
export default function TypeSwitch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: TransactionKind) => void;
}) {
  const index = TYPE_ORDER.indexOf(value as TransactionKind);
  const selectedTheme = index >= 0 ? TYPE_THEME[TYPE_ORDER[index]] : null;

  return (
    <div
      role="radiogroup"
      aria-label="Tipo de movimiento"
      className="relative grid grid-cols-3 rounded-2xl bg-gray-100 p-1"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-xl shadow-md transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none",
          selectedTheme ? selectedTheme.indicator : "opacity-0"
        )}
        style={{ transform: `translateX(${Math.max(index, 0) * 100}%)` }}
      />
      {TYPE_ORDER.map((kind) => {
        const { label, icon: Icon } = TYPE_THEME[kind];
        const selected = value === kind;
        return (
          <button
            key={kind}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(kind)}
            className={cn(
              "relative z-10 flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50 active:scale-[.97] motion-reduce:transform-none",
              selected ? "text-white" : "text-gray-500 hover:text-gray-800"
            )}
          >
            {/* `key` vuelve a montar el ícono para repetir el salto al elegirlo. */}
            <Icon
              key={selected ? "on" : "off"}
              className={cn(
                "h-4 w-4 shrink-0",
                selected &&
                  "motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:spin-in-45 motion-safe:duration-300"
              )}
              aria-hidden
            />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
