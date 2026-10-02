"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getFirstErrorMessage, isApiError } from "@/types/api-error.type";
import { useCooldown } from "../hooks/useCooldown";
import { AuthService } from "../services/auth.service";
import AuthCodeInput, { CODE_LENGTH } from "./AuthCodeInput";
import LoginAuthInput from "./LoginAuthInput";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import ResendCodeButton from "./ResendCodeButton";

interface ForgotPasswordFormProps {
  /** Se llama tras cambiar la contraseña; el usuario debe iniciar sesión de nuevo. */
  onSuccess: () => void;
}

type Step = "email" | "code" | "password";

const STEPS: readonly Step[] = ["email", "code", "password"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Antes de este tiempo el backend no reenvía el código, aunque responda 200. */
const RESEND_COOLDOWN_MS = 60_000;

const HEADERS: Record<Step, { eyebrow: string; title: string }> = {
  email: { eyebrow: "Recupera tu acceso", title: "¿Olvidaste tu contraseña?" },
  code: { eyebrow: "Revisa tu correo", title: "Ingresa el código" },
  password: { eyebrow: "Último paso", title: "Crea una nueva contraseña" },
};

export default function ForgotPasswordForm({
  onSuccess,
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<Step>("email");
  const [submitting, setSubmitting] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  /** Email al que se envió el último código; lo exige verify-reset-code. */
  const [sentTo, setSentTo] = useState("");

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();

  /** Solo en memoria: vale 15 min y un solo uso. */
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { secondsLeft: cooldownLeft, start: startCooldown } = useCooldown();

  const email = emailInput.trim();
  const emailError = !email
    ? "Escribe tu email"
    : !EMAIL_RE.test(email)
      ? "Ese email no parece válido"
      : null;

  const passwordErrors = useMemo(
    () => ({
      password: !password
        ? "Escribe una contraseña"
        : password.length < 6
          ? "La contraseña debe tener al menos 6 caracteres"
          : null,
      confirm: !confirm
        ? "Repite la contraseña"
        : confirm !== password
          ? "Las contraseñas no coinciden"
          : null,
    }),
    [password, confirm],
  );

  const requestCode = async (target: string): Promise<boolean> => {
    setSubmitting(true);
    try {
      await AuthService.forgotPassword({ email: target });
      setSentTo(target);
      startCooldown(RESEND_COOLDOWN_MS);
      setCode("");
      setCodeError(undefined);
      return true;
    } catch (error) {
      toast.error(
        isApiError(error) && error.statusCode >= 500
          ? "No pudimos enviar el email. Intenta más tarde."
          : getFirstErrorMessage(error, "No pudimos enviar el código. Intenta de nuevo."),
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError) {
      setEmailTouched(true);
      toast.error(emailError);
      return;
    }
    // Mismo email dentro del cooldown: el backend no reenvía y el código anterior sigue vigente.
    if (email === sentTo && cooldownLeft > 0) {
      setStep("code");
      return;
    }
    if (await requestCode(email)) setStep("code");
  };

  const handleResend = async () => {
    if (cooldownLeft > 0 || submitting) return;
    if (await requestCode(sentTo)) toast.success("Te enviamos un nuevo código");
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setCodeError(`El código tiene ${CODE_LENGTH} dígitos`);
      return;
    }
    setSubmitting(true);
    try {
      const { resetToken } = await AuthService.verifyResetCode({
        email: sentTo,
        code,
      });
      setResetToken(resetToken);
      setStep("password");
    } catch (error) {
      setCodeError(getFirstErrorMessage(error, "No pudimos verificar el código"));
    } finally {
      setSubmitting(false);
    }
  };

  const restartFlow = () => {
    setResetToken(null);
    setPassword("");
    setConfirm("");
    setPasswordTouched(false);
    setConfirmTouched(false);
    setCode("");
    setCodeError(undefined);
    setSentTo("");
    setStep("email");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstError = passwordErrors.password ?? passwordErrors.confirm;
    if (firstError) {
      setPasswordTouched(true);
      setConfirmTouched(true);
      toast.error(firstError);
      return;
    }
    if (!resetToken) {
      restartFlow();
      return;
    }
    setSubmitting(true);
    try {
      const { message } = await AuthService.resetPassword({
        resetToken,
        newPassword: password,
      });
      setResetToken(null);
      toast.success(message || "Contraseña actualizada. Inicia sesión.");
      onSuccess();
    } catch (error) {
      // Un 400 con mensaje de texto = token inválido, vencido o ya usado (los de validación vienen como array).
      if (
        isApiError(error) &&
        error.statusCode === 400 &&
        !Array.isArray(error.message)
      ) {
        toast.error("Tu solicitud venció o ya se usó. Pide un nuevo código.");
        restartFlow();
        return;
      }
      toast.error(
        getFirstErrorMessage(error, "No pudimos cambiar la contraseña. Intenta de nuevo."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);
  const header = HEADERS[step];

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      aria-pressed={showPassword}
      className="flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40"
    >
      {showPassword ? (
        <EyeOff className="size-4" aria-hidden />
      ) : (
        <Eye className="size-4" aria-hidden />
      )}
    </button>
  );

  const submitClassName =
    "group flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-base font-semibold text-slate-900 shadow-sm transition-[box-shadow,background-color] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/30 disabled:pointer-events-none disabled:opacity-60";

  return (
    <div className="flex flex-col">
      {step === "code" ? (
        <button
          type="button"
          onClick={() => setStep("email")}
          className="mb-8 inline-flex w-fit items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Cambiar email
        </button>
      ) : (
        <Link
          href="/login"
          className="mb-8 inline-flex w-fit items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver a iniciar sesión
        </Link>
      )}

      <header className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">
          {header.eyebrow}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-[#0a1628] sm:text-[1.75rem]">
          {header.title}
        </h2>
        <p className="text-sm text-slate-500">
          {step === "email" &&
            "Escribe el email de tu cuenta y te enviaremos un código de 6 dígitos."}
          {step === "code" && (
            <>
              Si <span className="font-medium text-slate-700">{sentTo}</span>{" "}
              está registrado, te llegará un código. Vence en 15 minutos.
            </>
          )}
          {step === "password" &&
            "Después podrás iniciar sesión con tu nueva contraseña."}
        </p>
      </header>

      <div className="mb-7 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Recuperar contraseña</span>
          <span className="tabular-nums">
            Paso {stepIndex + 1} de {STEPS.length}
          </span>
        </div>
        <div
          className="flex gap-1"
          role="progressbar"
          aria-label="Progreso de la recuperación"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={stepIndex + 1}
        >
          {STEPS.map((s, index) => (
            <span
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                index <= stepIndex ? "bg-mint" : "bg-slate-100",
              )}
            />
          ))}
        </div>
      </div>

      {step === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-5" noValidate>
          <LoginAuthInput
            id="forgot-email"
            label="Email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="tu@email.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            state={
              !emailError ? "valid" : emailTouched ? "error" : "idle"
            }
            message={emailTouched && emailError ? emailError : undefined}
            autoFocus
          />

          <button type="submit" disabled={submitting} className={submitClassName}>
            {submitting ? "Enviando código…" : "Enviar código"}
            {!submitting && (
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            )}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleCodeSubmit} className="space-y-5" noValidate>
          <AuthCodeInput
            id="forgot-code"
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
            className={submitClassName}
          >
            {submitting ? "Verificando…" : "Verificar código"}
            {!submitting && (
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            )}
          </button>

          <ResendCodeButton
            secondsLeft={cooldownLeft}
            disabled={submitting}
            onClick={handleResend}
          />
          <p className="text-center text-xs text-slate-400">
            Revisa también la carpeta de spam. Pedir un código nuevo invalida el
            anterior.
          </p>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <LoginAuthInput
              id="forgot-password"
              label="Nueva contraseña"
              type={showPassword ? "text" : "password"}
              icon={Lock}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              state={
                !passwordErrors.password
                  ? "valid"
                  : passwordTouched
                    ? "error"
                    : "idle"
              }
              message={
                passwordTouched && passwordErrors.password
                  ? passwordErrors.password
                  : undefined
              }
              trailing={passwordToggle}
              autoFocus
            />
            {password.length > 0 && <PasswordStrengthMeter password={password} />}
          </div>

          <LoginAuthInput
            id="forgot-confirm"
            label="Confirmar contraseña"
            type={showPassword ? "text" : "password"}
            icon={Lock}
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
            state={
              !passwordErrors.confirm
                ? "valid"
                : confirmTouched
                  ? "error"
                  : "idle"
            }
            message={
              confirmTouched && passwordErrors.confirm
                ? passwordErrors.confirm
                : undefined
            }
          />

          <button type="submit" disabled={submitting} className={submitClassName}>
            {submitting ? "Guardando…" : "Cambiar contraseña"}
            {!submitting && (
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            )}
          </button>
        </form>
      )}

      <p className="mt-8 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-slate-400">
        <ShieldCheck
          className="mt-0.5 size-3.5 shrink-0 text-slate-400"
          aria-hidden
        />
        <span>
          Por seguridad, nunca te pediremos el código por teléfono ni por chat.
        </span>
      </p>
    </div>
  );
}
