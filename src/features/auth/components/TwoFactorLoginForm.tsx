"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { getFirstErrorMessage } from "@/types/api-error.type";
import { useCooldown } from "../hooks/useCooldown";
import type { VerifyTwoFactorResult } from "../hooks/useAuth";
import { AuthService } from "../services/auth.service";
import { isTwoFactorRestartError } from "../utils/two-factor";
import AuthCodeInput, { CODE_LENGTH } from "./AuthCodeInput";
import ResendCodeButton from "./ResendCodeButton";

/** Antes de este tiempo el backend responde 429 al reenvío. */
const RESEND_COOLDOWN_MS = 60_000;

interface TwoFactorLoginFormProps {
  /** Solo en memoria; no es un JWT de sesión. */
  twoFactorToken: string;
  email: string;
  /** `Date.now()` de cuando el login envió el primer código. */
  codeSentAt: number;
  onVerify: (code: string) => Promise<VerifyTwoFactorResult>;
  /** Vuelve al formulario de login (reto vencido, sin intentos o el usuario cancela). */
  onRestart: () => void;
}

export default function TwoFactorLoginForm({
  twoFactorToken,
  email,
  codeSentAt,
  onVerify,
  onRestart,
}: TwoFactorLoginFormProps) {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const { secondsLeft, start: startCooldown } = useCooldown({
    startedAt: codeSentAt,
    ms: RESEND_COOLDOWN_MS,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (code.length !== CODE_LENGTH) {
      setCodeError(`El código tiene ${CODE_LENGTH} dígitos`);
      return;
    }
    setSubmitting(true);
    const result = await onVerify(code);
    setSubmitting(false);
    if (result.success) return;
    if (result.restart) {
      toast.error(result.error);
      onRestart();
      return;
    }
    setCodeError(result.error);
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || resending) return;
    setResending(true);
    try {
      await AuthService.resendTwoFactor({ twoFactorToken });
      startCooldown(RESEND_COOLDOWN_MS);
      setCode("");
      setCodeError(undefined);
      toast.success("Te enviamos un nuevo código");
    } catch (error) {
      toast.error(getFirstErrorMessage(error, "No pudimos reenviar el código"));
      if (isTwoFactorRestartError(error)) onRestart();
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onRestart}
        className="mb-8 inline-flex w-fit items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al inicio de sesión
      </button>

      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">
          Verificación en dos pasos
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-[#0a1628] sm:text-[1.75rem]">
          Ingresa el código
        </h2>
        <p className="text-sm text-slate-500">
          Enviamos un código de 6 dígitos a{" "}
          <span className="font-medium text-slate-700">{email}</span>. Vence en
          10 minutos.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthCodeInput
          id="two-factor-code"
          value={code}
          onChange={(value) => {
            setCode(value);
            setCodeError(undefined);
          }}
          error={codeError}
          autoFocus
        />

        <button
          type="submit"
          disabled={submitting || code.length !== CODE_LENGTH}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-base font-semibold text-slate-900 shadow-sm transition-[box-shadow,background-color] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/30 disabled:pointer-events-none disabled:opacity-60"
        >
          {submitting ? "Verificando…" : "Verificar e iniciar sesión"}
          {!submitting && (
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          )}
        </button>

        <ResendCodeButton
          secondsLeft={secondsLeft}
          disabled={resending}
          onClick={handleResend}
        />
        <p className="text-center text-xs text-slate-400">
          Revisa también la carpeta de spam. Al reenviar, el código anterior
          deja de servir.
        </p>
      </form>

      <p className="mt-8 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-slate-400">
        <ShieldCheck
          className="mt-0.5 size-3.5 shrink-0 text-slate-400"
          aria-hidden
        />
        <span>
          Tu cuenta tiene activa la verificación en dos pasos. Nunca compartas
          este código con nadie.
        </span>
      </p>
    </div>
  );
}
