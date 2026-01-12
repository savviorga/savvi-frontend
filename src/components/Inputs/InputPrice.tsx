"use client";

import { useState, useEffect } from "react";

interface InputPriceProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  error?: string;
}

export default function InputPrice({
  label,
  value,
  onChange,
  placeholder = "0.00",
  error,
}: InputPriceProps) {
  const [displayValue, setDisplayValue] = useState("");

  // 🔹 SOLO sincroniza cuando el valor viene de afuera
  useEffect(() => {
    if (value === null || value === undefined) {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Permitir escribir libremente
    if (!/^[0-9.,]*$/.test(raw)) return;

    setDisplayValue(raw);

    const normalized = raw.replace(/,/g, "");

    if (normalized === "" || normalized === ".") {
      onChange(null);
      return;
    }

    const parsed = Number(normalized);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    if (value !== null && value !== undefined) {
      setDisplayValue(formatNumber(value));
    }
  };

  const handleFocus = () => {
    // Al enfocar, mostrar sin formato
    if (value !== null && value !== undefined) {
      setDisplayValue(value.toString());
    }
  };

  return (
    <div className="flex flex-col w-full space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`
          h-11 w-full rounded-xl px-3 text-sm bg-white
          border ${error ? "border-red-500" : "border-gray-300"}
          shadow-sm focus:ring-2 focus:ring-indigo-200
        `}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ===========================
   Helper
=========================== */
function formatNumber(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
