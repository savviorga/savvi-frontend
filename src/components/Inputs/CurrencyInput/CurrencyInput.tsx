"use client";

import CurrencyInput from "react-currency-input-field";

interface CurrencyFieldProps {
    value: number | null;
    onChange: (value: number | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function CurrencyField({
    value,
    onChange,
    placeholder = "0.00",
    disabled = false,
    className = "",
}: CurrencyFieldProps) {
    return (
        <CurrencyInput
            value={value ?? ""}
            decimalsLimit={2}
            intlConfig={{
                locale: "es-CO",
                currency: "COP",
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`
        w-full
        rounded-xl
        border
        border-gray-300
        bg-white
        px-3
        py-2
        text-sm
        text-gray-900
        placeholder-gray-400
        shadow-sm
        text-right
        focus:border-indigo-500
        focus:outline-none
        focus:ring-1
        focus:ring-indigo-500
        disabled:bg-gray-100
        disabled:text-gray-500
        ${className}
      `}
            onValueChange={(_, __, values) => {
                onChange(values?.float ?? null);
            }}
        />
    );
}
