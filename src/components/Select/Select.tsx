"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

import { FlowIconTransaction } from "@/features/transactions/components/FlowIconTransaction";
import { cn } from "@/lib/utils";

/** Valores de tipo de movimiento que comparten icono con "transacción" */
function flowIconKey(value: string): string {
  if (value === "transferencia") return "transaccion";
  return value;
}

function optionMatchesQuery(
  opt: { label: string; value: string },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    opt.label.toLowerCase().includes(q) ||
    opt.value.toLowerCase().includes(q)
  );
}

interface SavvySelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: { label: string; value: string }[];
  error?: string;
  disabled?: boolean;
  /** Iconos de flujo (ingreso / egreso / transferencia). Desactivado por defecto para listas genéricas (cuentas, categorías, días). */
  showFlowIcons?: boolean;
  triggerClassName?: string;
}

export default function SavvySelect({
  label,
  value,
  onChange,
  placeholder = "Seleccionar…",
  options,
  error,
  disabled = false,
  showFlowIcons = false,
  triggerClassName,
}: SavvySelectProps) {
  const reactId = useId();
  const fieldId = `savvy-select-${reactId}`;
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    return options.filter((opt) => optionMatchesQuery(opt, query));
  }, [options, query]);

  useEffect(() => {
    setQuery("");
  }, [value]);

  const inputClass = cn(
    "box-border h-10 w-full rounded-xl border border-border bg-white py-2 pl-3 pr-10 text-left text-sm font-normal leading-normal shadow-none transition-[color,box-shadow,border-color]",
    "placeholder:text-muted-foreground",
    "hover:bg-muted/30",
    "focus:border-[#00C49A] focus:outline-none focus:ring-2 focus:ring-[#00C49A]/25",
    "disabled:cursor-not-allowed disabled:opacity-60",
    error &&
      "border-red-500 focus:border-red-500 focus:ring-red-500/25",
    triggerClassName,
  );

  return (
    <div className="relative z-20 isolate flex w-full flex-col gap-1.5">
      <label
        htmlFor={fieldId}
        className="text-sm font-medium leading-none text-foreground"
      >
        {label}
      </label>

      <Combobox
        immediate
        value={selectedOption}
        onChange={(opt) => {
          onChange(opt?.value ?? "");
          setQuery("");
        }}
        onClose={() => setQuery("")}
        by="value"
        disabled={disabled}
      >
        <div className="relative z-10">
          <ComboboxInput
            id={fieldId}
            autoComplete="off"
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            aria-autocomplete="list"
            className={inputClass}
            displayValue={(opt: { label: string; value: string } | null) =>
              opt?.label ?? ""
            }
            onChange={(e) => setQuery(e.target.value)}
          />
          <ComboboxButton
            type="button"
            className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-2.5 text-muted-foreground outline-none transition hover:text-foreground"
          >
            <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
          </ComboboxButton>
        </div>

        <ComboboxOptions
          modal={false}
          portal={false}
          anchor={{ to: "bottom start", gap: 6 }}
          transition
          className={cn(
            "scrollbar-clean pointer-events-auto z-[200] max-h-[min(17rem,80vh)] overflow-auto rounded-xl border border-border/90 bg-popover p-1 shadow-xl outline-none",
            "transition duration-100 ease-out data-[closed]:opacity-0 data-[enter]:opacity-100",
            "empty:invisible",
          )}
        >
          {filteredOptions.length === 0 ? (
            <div className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
              Sin coincidencias
            </div>
          ) : (
            filteredOptions.map((opt, index) => (
              <ComboboxOption
                key={`${fieldId}-${index}-${opt.value}`}
                value={opt}
                className={cn(
                  "group relative flex cursor-pointer select-none items-center gap-2 rounded-lg py-2.5 pl-3 pr-9 text-sm outline-none",
                  "data-focus:bg-[#00C49A]/12 data-focus:text-foreground",
                )}
              >
                {showFlowIcons ? (
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="flex shrink-0 origin-left scale-90">
                      <FlowIconTransaction type={flowIconKey(opt.value)} />
                    </span>
                    <span className="leading-snug">{opt.label}</span>
                  </span>
                ) : (
                  <span className="block min-w-0 flex-1 truncate leading-snug">
                    {opt.label}
                  </span>
                )}
                <span className="absolute right-2 flex size-4 items-center justify-center">
                  <Check
                    className="size-4 text-[#00C49A] opacity-0 group-data-selected:opacity-100"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </span>
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </Combobox>

      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
