import { cn } from "@/lib/utils";

/** Interruptor visual; la fila que lo contiene es la que recibe el clic. */
export default function SwitchIndicator({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300",
        checked ? "bg-mint" : "bg-gray-200"
      )}
    >
      {/* Rebote al final del recorrido (curva con sobrepaso). */}
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </span>
  );
}
