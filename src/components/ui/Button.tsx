import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const variants = {
  primary:
    "bg-mint text-cosmos hover:bg-mint-dim",
  secondary:
    "bg-mint/10 text-mint border border-mint/20 hover:bg-mint/20",
  ghost:
    "bg-white/5 text-white/60 border border-white/8 hover:bg-white/10 hover:text-white",
  danger:
    "bg-red/10 text-red border border-red/20 hover:bg-red/20",
};

const sizes = {
  sm: "h-8 px-3.5 text-xs rounded-md",
  md: "h-[42px] px-5 text-sm rounded-[10px]",
  lg: "h-[52px] px-7 text-base rounded-2xl",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold font-body transition-all active:scale-[.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
