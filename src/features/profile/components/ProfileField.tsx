"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
  /** Contenido a la derecha del input (p. ej. botón mostrar contraseña) */
  trailing?: React.ReactNode;
  className?: string;
}

export default function ProfileField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  error,
  hint,
  autoComplete,
  trailing,
  className,
}: ProfileFieldProps) {
  return (
    <div className={cn("group", className)}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border bg-white px-3.5 transition-all duration-200",
          "focus-within:border-mint focus-within:shadow-[0_0_0_4px_rgba(0,212,170,0.12)]",
          error ? "border-rose-300" : "border-gray-200 hover:border-gray-300",
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-focus-within:text-mint" />
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-help` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full bg-transparent text-sm text-[#0B1829] placeholder:text-gray-400 focus:outline-none"
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-help`} className="savvi-msg-in mt-1 text-xs text-rose-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-help`} className="mt-1 text-xs text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
