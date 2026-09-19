"use client";

import type { FocusEventHandler } from "react";
import CurrencyInput from "react-currency-input-field";
import { cn } from "@/lib/utils";

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
            className={cn(
                "w-full rounded-xl border border-border bg-white px-3 py-2 text-right text-sm text-foreground shadow-sm",
                "placeholder:text-muted-foreground",
                "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25",
                "disabled:bg-muted disabled:text-muted-foreground",
                className,
            )}
            onValueChange={(_, __, values) => {
                onChange(values?.float ?? null);
            }}
            onBlur={onBlur}
        />
    );
}
