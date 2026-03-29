"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { format, startOfDay } from "date-fns";
import { es as esDateFns } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import { es as esDayPicker } from "react-day-picker/locale";
import type { Matcher } from "react-day-picker";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/shadcn-button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export interface SavvyDatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  /** Texto de ayuda debajo del campo */
  description?: string;
  /** Deshabilita el selector */
  disabled?: boolean;
  /** Fecha mínima seleccionable (inclusive) */
  minDate?: Date;
  /** Fecha máxima seleccionable (inclusive) */
  maxDate?: Date;
  /** Reglas extra de react-day-picker para deshabilitar días */
  disabledMatchers?: Matcher | Matcher[];
  /** Muestra botón para borrar la fecha seleccionada */
  clearable?: boolean;
  /** Patrón de formato de visualización (date-fns) */
  dateFormat?: string;
  className?: string;
  triggerClassName?: string;
  id?: string;
  name?: string;
  required?: boolean;
  /** Navegación del calendario: etiqueta o desplegables de mes/año */
  captionLayout?: "label" | "dropdown" | "dropdown-months";
  /** Rango de años en desplegables (captionLayout dropdown) */
  fromYear?: number;
  toYear?: number;
  /** Alineación del panel del calendario */
  align?: "start" | "center" | "end";
}

const defaultFromYear = () => new Date().getFullYear() - 100;
const defaultToYear = () => new Date().getFullYear() + 15;

function isDateInMinMaxRange(
  date: Date,
  minDate?: Date,
  maxDate?: Date,
): boolean {
  const d = startOfDay(date);
  if (minDate && d < startOfDay(minDate)) return false;
  if (maxDate && d > startOfDay(maxDate)) return false;
  return true;
}

export default function SavvyDatePicker({
  label = "Fecha",
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  error,
  description,
  disabled = false,
  minDate,
  maxDate,
  disabledMatchers,
  clearable = false,
  dateFormat = "dd/MM/yyyy",
  className,
  triggerClassName,
  id: idProp,
  name,
  required,
  captionLayout = "dropdown",
  fromYear = defaultFromYear(),
  toYear = defaultToYear(),
  align = "start",
}: SavvyDatePickerProps) {
  const reactId = useId();
  const triggerId = idProp ?? `savvy-date-${reactId}`;
  const errorId = `${triggerId}-error`;
  const descId = `${triggerId}-desc`;

  const [open, setOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
    startOfDay(value ?? minDate ?? new Date()),
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setCalendarMonth(startOfDay(value ?? minDate ?? new Date()));
    }
  };

  useEffect(() => {
    if (!open) return;
    setCalendarMonth(startOfDay(value ?? minDate ?? new Date()));
  }, [value, minDate, open]);

  const disabledDays = useMemo(() => {
    const list: Matcher[] = [];
    if (minDate) list.push({ before: startOfDay(minDate) });
    if (maxDate) list.push({ after: startOfDay(maxDate) });
    if (disabledMatchers) {
      if (Array.isArray(disabledMatchers)) list.push(...disabledMatchers);
      else list.push(disabledMatchers);
    }
    return list.length ? list : undefined;
  }, [minDate, maxDate, disabledMatchers]);

  const describedBy =
    [description ? descId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={triggerId}
          className="text-sm font-medium leading-none text-foreground"
        >
          {label}
          {required ? (
            <span className="ml-0.5 text-red-600" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="flex w-full gap-1.5">
        <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              id={triggerId}
              name={name}
              disabled={disabled}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              aria-required={required}
              className={cn(
                "h-10 flex-1 items-center justify-start rounded-xl border border-border bg-white px-3 py-2 text-left text-sm font-normal shadow-none",
                "hover:bg-muted/30",
                "focus-visible:border-[#00C49A] focus-visible:ring-2 focus-visible:ring-[#00C49A]/25",
                error
                  ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/25"
                  : "border-border",
                !value && "text-muted-foreground",
                triggerClassName,
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              {value ? (
                <span className="truncate">
                  {format(value, dateFormat, { locale: esDateFns })}
                </span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            forceMount
            className="w-auto p-0 shadow-md duration-100 data-[state=closed]:duration-75 data-[state=open]:duration-100"
            align={align}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Calendar
              mode="single"
              locale={esDayPicker}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              selected={value ?? undefined}
              onSelect={(date) => {
                onChange(date ?? null);
                setOpen(false);
              }}
              disabled={disabledDays}
              captionLayout={captionLayout}
              fromYear={fromYear}
              toYear={toYear}
              initialFocus
            />
            <div className="border-t border-border bg-muted/50 px-2 py-1.5">
              <Button
                type="button"
                variant="ghost"
                disabled={disabled}
                className="h-9 w-full rounded-lg text-sm font-semibold text-[#00C49A] hover:bg-[#00C49A]/10 hover:text-[#0B1829]"
                onClick={() => {
                  const today = startOfDay(new Date());
                  setCalendarMonth(today);
                  if (isDateInMinMaxRange(today, minDate, maxDate)) {
                    onChange(today);
                    setOpen(false);
                  }
                }}
              >
                Hoy
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {clearable && value && !disabled ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            onClick={() => onChange(null)}
            aria-label="Quitar fecha"
            title="Quitar fecha"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {description ? (
        <p id={descId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
