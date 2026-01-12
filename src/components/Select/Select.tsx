"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlowIconTransaction } from "@/features/transactions/components/FlowIconTransaction";

interface SavvySelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: { label: string; value: string }[];
  error?: string;
}

export default function SavvySelect({
  label,
  value,
  onChange,
  placeholder = "Seleccionar...",
  options,
  error,
}: SavvySelectProps) {
  return (
    <div className="flex flex-col w-full space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={`
            h-24 w-full rounded-xl px-3 text-sm
            border ${error ? "border-red-500" : "border-gray-300"}
            focus:ring-2 focus:ring-indigo-200
          `}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex gap-2 items-center justify-center">
                <FlowIconTransaction type={opt.value} />
                {opt.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
