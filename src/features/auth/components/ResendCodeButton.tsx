"use client";

import { RotateCw } from "lucide-react";

interface ResendCodeButtonProps {
  secondsLeft: number;
  disabled?: boolean;
  onClick: () => void;
}

export default function ResendCodeButton({
  secondsLeft,
  disabled,
  onClick,
}: ResendCodeButtonProps) {
  return (
    <p className="text-center text-sm text-slate-500">
      ¿No te llegó?{" "}
      <button
        type="button"
        onClick={onClick}
        disabled={secondsLeft > 0 || disabled}
        className="inline-flex items-center gap-1 font-semibold text-mint hover:text-mint-dim hover:underline disabled:pointer-events-none disabled:font-medium disabled:text-slate-400"
      >
        <RotateCw className="size-3.5" aria-hidden />
        {secondsLeft > 0 ? `Reenviar en ${secondsLeft} s` : "Reenviar código"}
      </button>
    </p>
  );
}
