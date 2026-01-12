"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface SavvyDatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
}

export default function SavvyDatePicker({
  label = "Fecha",
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  error,
}: SavvyDatePickerProps) {
  return (
    <div className="flex flex-col w-full space-y-1">
      <label className="text-sm font-medium text-gray-800">{label}</label>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`
              w-full justify-start text-left font-normal rounded-xl
              ${error ? "border-red-500" : "border-gray-200"}
            `}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
            {value ? (
              format(value, "dd/MM/yyyy")
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-auto shadow-sm" align="start">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(date) => onChange(date ?? null)}
            defaultMonth={value ?? undefined} // 🔥 asegura que no marque 2 días
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
