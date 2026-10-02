"use client";

import { KeyRound } from "lucide-react";
import LoginAuthInput from "./LoginAuthInput";

export const CODE_LENGTH = 6;

interface AuthCodeInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  autoFocus?: boolean;
}

/** Código de 6 dígitos enviado por email: solo números y autocompletado OTP. */
export default function AuthCodeInput({
  id,
  value,
  onChange,
  error,
  label = "Código de verificación",
  autoFocus,
}: AuthCodeInputProps) {
  return (
    <LoginAuthInput
      id={id}
      label={label}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      icon={KeyRound}
      autoComplete="one-time-code"
      placeholder="000000"
      maxLength={CODE_LENGTH}
      value={value}
      onChange={(e) =>
        onChange(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
      }
      state={error ? "error" : "idle"}
      message={error}
      inputClassName="font-mono text-base tracking-[0.5em]"
      autoFocus={autoFocus}
    />
  );
}
