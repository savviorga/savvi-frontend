import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import { cn } from "@/lib/utils";
import { TYPE_THEME, isTransactionKind } from "./theme";

/** El monto es lo primero que se escribe: grande, centrado y con el color del tipo. */
export default function AmountHero({
  type,
  value,
  onChange,
  autoFocus,
  error,
  flashKey = 0,
}: {
  type: string;
  value: number | null;
  onChange: (value: number | null) => void;
  autoFocus?: boolean;
  error?: boolean;
  /** Al cambiar, destella un aro verde (p. ej. tras guardar y seguir registrando). */
  flashKey?: number;
}) {
  const theme = isTransactionKind(type) ? TYPE_THEME[type] : null;

  return (
    <div
      id="tx-section-amount"
      className={cn(
        "relative scroll-mt-4 rounded-2xl px-4 pb-4 pt-3 text-center transition-[background-color,box-shadow,transform] duration-300",
        // Al escribir el monto, el bloque se eleva apenas.
        "focus-within:-translate-y-0.5 focus-within:shadow-lg focus-within:shadow-gray-200/60 motion-reduce:transform-none",
        theme?.heroBg ?? "bg-gray-50",
        error && "animate-shake ring-2 ring-rose-400"
      )}
    >
      {flashKey > 0 && (
        <span
          key={flashKey}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-emerald-400 motion-safe:animate-out motion-safe:fade-out-0 motion-safe:fill-mode-forwards motion-safe:duration-1000 motion-reduce:hidden"
        />
      )}
      <label
        htmlFor="tx-amount"
        className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          error ? "text-rose-600" : "text-gray-500"
        )}
      >
        {error ? "Escribe el monto" : "¿Cuánto?"}
      </label>
      <CurrencyField
        id="tx-amount"
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        aria-invalid={error || undefined}
        placeholder="$ 0"
        className={cn(
          "mt-1 h-14 border-0 bg-transparent px-0 py-0 text-center text-4xl font-bold tabular-nums tracking-tight shadow-none focus:border-0 focus:ring-0 sm:text-[2.5rem]",
          "placeholder:text-gray-300",
          theme?.amount ?? "text-[#0B1829]"
        )}
      />
    </div>
  );
}
