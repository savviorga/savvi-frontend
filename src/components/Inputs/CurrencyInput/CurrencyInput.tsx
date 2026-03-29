"use client";

import type { FocusEventHandler } from "react";
import CurrencyInput from "react-currency-input-field";

interface CurrencyFieldProps {
    value: number | null;
    onChange: (value: number | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    onBlur?: FocusEventHandler<HTMLInputElement>;
}

export function CurrencyField({
    value,
    onChange,
    placeholder = "0.00",
    disabled = false,
    className = "",
    onBlur,
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
        border-border
        bg-white
        px-3
        py-2
        text-sm
        text-foreground
        placeholder:text-muted-foreground
        shadow-sm
        text-right
        focus:border-accent
        focus:outline-none
        focus:ring-1
        focus:ring-indigo-500
        disabled:bg-muted
        disabled:text-muted-foreground
        ${className}
      `}
            onValueChange={(_, __, values) => {
                onChange(values?.float ?? null);
            }}
            onBlur={onBlur}
        />
    );
}
