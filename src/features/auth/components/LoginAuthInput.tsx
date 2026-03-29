"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface LoginAuthInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  id: string;
  label: string;
  icon: LucideIcon;
  className?: string;
  inputClassName?: string;
}

export default function LoginAuthInput({
  id,
  label,
  icon: Icon,
  className,
  inputClassName,
  ...inputProps
}: LoginAuthInputProps) {
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
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden
        >
          <Icon className="size-[18px] stroke-[1.75]" />
        </span>
        <input
          id={id}
          className={cn(
            "h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-mint/60 focus:ring-2 focus:ring-mint/20",
            inputClassName,
          )}
          {...inputProps}
        />
      </div>
    </div>
  );
}
