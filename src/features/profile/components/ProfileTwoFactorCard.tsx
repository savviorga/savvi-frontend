"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useCooldown } from "@/features/auth/hooks/useCooldown";
import type { MutationResult } from "../hooks/useProfile";
import TwoFactorDisableModal from "./TwoFactorDisableModal";
import TwoFactorEnableModal from "./TwoFactorEnableModal";

/** Antes de este tiempo `POST /auth/2fa/enable` responde 429. */
const RESEND_COOLDOWN_MS = 60_000;

interface ProfileTwoFactorCardProps {
  enabled: boolean;
  email: string;
  onRequestEnable: () => Promise<MutationResult>;
  onConfirmEnable: (code: string) => Promise<MutationResult>;
  onDisable: (password: string) => Promise<MutationResult>;
}

export default function ProfileTwoFactorCard({
  enabled,
  email,
  onRequestEnable,
  onConfirmEnable,
  onDisable,
}: ProfileTwoFactorCardProps) {
  const [modal, setModal] = useState<"enable" | "disable" | null>(null);
  const [sending, setSending] = useState(false);
  const { secondsLeft, start: startCooldown } = useCooldown();

  const sendCode = async (): Promise<MutationResult> => {
    setSending(true);
    const result = await onRequestEnable();
    setSending(false);
    if (result.ok) startCooldown(RESEND_COOLDOWN_MS);
    else toast.error(result.messages.join(" "));
    return result;
  };

  const handleToggle = async () => {
    if (sending) return;
    if (enabled) {
      setModal("disable");
      return;
    }
    // Código enviado hace menos de 60 s: sigue vigente, no se pide otro.
    if (secondsLeft > 0) {
      setModal("enable");
      return;
    }
    const result = await sendCode();
    // 429 = ya hay un código reciente (p. ej. tras cambiar de pestaña): sigue sirviendo.
    if (result.ok || result.status === 429) setModal("enable");
  };

  const handleResend = async () => {
    if ((await sendCode()).ok) toast.success("Te enviamos un nuevo código");
  };

  return (
    <section
      className="savvi-profile-rise rounded-2xl border border-gray-200/90 bg-white shadow-sm shadow-gray-200/25"
      aria-labelledby="two-factor-title"
    >
      <div className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            enabled ? "bg-mint/15 text-mint" : "bg-slate-100 text-slate-500",
          )}
        >
          <ShieldCheck className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="two-factor-title" className="text-base font-semibold text-[#0B1829]">
              Verificación en dos pasos
            </h3>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                enabled ? "bg-mint/15 text-mint-dim" : "bg-slate-100 text-slate-500",
              )}
            >
              {enabled ? "Activa" : "Opcional"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {enabled ? (
              <>
                Al iniciar sesión te pediremos un código enviado a{" "}
                <span className="font-medium text-gray-700">{email}</span>.
              </>
            ) : (
              <>
                Además de tu contraseña, pide un código enviado a{" "}
                <span className="font-medium text-gray-700">{email}</span> al iniciar sesión.
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="two-factor-title"
          onClick={handleToggle}
          disabled={sending}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60",
            enabled ? "bg-mint" : "bg-gray-300",
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform duration-200",
              enabled ? "translate-x-6" : "translate-x-1",
            )}
          >
            {sending && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
          </span>
        </button>
      </div>

      <TwoFactorEnableModal
        open={modal === "enable"}
        email={email}
        onClose={() => setModal(null)}
        onConfirm={onConfirmEnable}
        resendSecondsLeft={secondsLeft}
        resending={sending}
        onResend={handleResend}
      />
      <TwoFactorDisableModal
        open={modal === "disable"}
        onClose={() => setModal(null)}
        onConfirm={onDisable}
      />
    </section>
  );
}
