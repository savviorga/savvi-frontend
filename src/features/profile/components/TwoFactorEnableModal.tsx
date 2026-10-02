"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import AuthCodeInput, { CODE_LENGTH } from "@/features/auth/components/AuthCodeInput";
import ResendCodeButton from "@/features/auth/components/ResendCodeButton";
import type { MutationResult } from "../hooks/useProfile";

interface TwoFactorEnableModalProps {
  open: boolean;
  email: string;
  onClose: () => void;
  onConfirm: (code: string) => Promise<MutationResult>;
  /** Segundos hasta poder pedir otro código (antes el backend responde 429). */
  resendSecondsLeft: number;
  resending: boolean;
  onResend: () => void;
}

export default function TwoFactorEnableModal({
  open,
  email,
  onClose,
  onConfirm,
  resendSecondsLeft,
  resending,
  onResend,
}: TwoFactorEnableModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const close = () => {
    setCode("");
    setError(undefined);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== CODE_LENGTH || saving) return;
    setSaving(true);
    const result = await onConfirm(code);
    setSaving(false);
    if (result.ok) {
      close();
      return;
    }
    setError(result.messages.join(" "));
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title="Activar verificación en dos pasos"
      description="Confirma que recibes los códigos en tu email."
      className="max-w-md"
      headerIcon={<MailCheck className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <p className="text-sm text-gray-600">
          Enviamos un código de 6 dígitos a{" "}
          <span className="font-semibold text-[#0B1829]">{email}</span>. Hasta
          que lo ingreses, la verificación en dos pasos no quedará activa.
        </p>

        <AuthCodeInput
          id="two-factor-enable-code"
          value={code}
          onChange={(value) => {
            setCode(value);
            setError(undefined);
          }}
          error={error}
          autoFocus
        />

        <ResendCodeButton
          secondsLeft={resendSecondsLeft}
          disabled={resending}
          onClick={() => {
            setCode("");
            setError(undefined);
            onResend();
          }}
        />

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || code.length !== CODE_LENGTH}
            className="inline-flex h-10 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-[#0B1829] px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Verificando…" : "Activar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
