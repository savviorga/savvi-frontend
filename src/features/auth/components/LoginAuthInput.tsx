"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AuthInputState = "idle" | "valid" | "error";

interface LoginAuthInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  id: string;
  label: string;
  icon: LucideIcon;
  className?: string;
  inputClassName?: string;
  /** Validación en vivo: tiñe borde, icono e indicador del campo. */
  state?: AuthInputState;
  /** Mensaje bajo el campo (error o ayuda). */
  message?: string;
  /** Acción al final del campo, p. ej. mostrar/ocultar contraseña. */
  trailing?: React.ReactNode;
}

export default function LoginAuthInput({
  id,
  label,
  icon: Icon,
  className,
  inputClassName,
  state = "idle",
  message,
  trailing,
  ...inputProps
}: LoginAuthInputProps) {
  const messageId = message ? `${id}-message` : undefined;
  const adornments = (state === "idle" ? 0 : 1) + (trailing ? 1 : 0);

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-600"
      >
        {label}
      </label>
      <div className="relative">
        <span
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
            state === "error"
              ? "text-rose-400"
              : state === "valid"
                ? "text-mint-dim"
                : "text-slate-400",
          )}
          aria-hidden
        >
          <Icon className="size-[18px] stroke-[1.75]" />
        </span>
        <input
          id={id}
          aria-invalid={state === "error" || undefined}
          aria-describedby={messageId}
          className={cn(
            "h-11 w-full rounded-lg border bg-white pl-10 text-sm text-slate-900 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:ring-2",
            adornments === 0 && "pr-3",
            adornments === 1 && "pr-11",
            adornments === 2 && "pr-[4.5rem]",
            state === "error"
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : state === "valid"
                ? "border-mint/60 focus:border-mint focus:ring-mint/20"
                : "border-slate-200 focus:border-mint/60 focus:ring-mint/20",
            inputClassName,
          )}
          {...inputProps}
        />
        {adornments > 0 && (
          <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {state !== "idle" && (
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full duration-200 animate-in fade-in zoom-in-75",
                  state === "valid"
                    ? "bg-mint/15 text-mint-dim"
                    : "bg-rose-100 text-rose-500",
                )}
                aria-hidden
              >
                {state === "valid" ? (
                  <Check className="size-3.5 stroke-[3]" />
                ) : (
                  <AlertCircle className="size-3.5" />
                )}
              </span>
            )}
            {trailing}
          </div>
        )}
      </div>
      {message && (
        <p
          id={messageId}
          className={cn(
            "text-xs leading-snug duration-200 animate-in fade-in slide-in-from-top-1",
            state === "error" ? "text-rose-600" : "text-slate-500",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
