"use client";

import { useState } from "react";
import { Check, KeyRound, Loader2, Mail, RotateCcw, User } from "lucide-react";
import toast from "react-hot-toast";
import { useCooldown } from "@/features/auth/hooks/useCooldown";
import type { CodeSentResponse } from "@/features/auth/types/auth.type";
import { cn } from "@/lib/utils";
import type { User as AuthUser } from "@/features/auth/types/auth.type";
import type { MutationResult } from "../hooks/useProfile";
import type { UpdateProfileDto } from "../types/profile.type";
import ProfileField from "./ProfileField";
import EmailChangeModal from "./EmailChangeModal";

/** Segundos antes de poder reenviar el código (el backend responde 429 antes). */
const RESEND_COOLDOWN_MS = 60_000;

interface ProfileEditFormProps {
  user: AuthUser;
  onSave: (payload: UpdateProfileDto) => Promise<MutationResult<AuthUser>>;
  onRequestEmailChange: (newEmail: string, currentPassword: string) => Promise<MutationResult<CodeSentResponse>>;
  onConfirmEmailChange: (code: string) => Promise<MutationResult<string>>;
}

type FormState = { name: string; email: string; password: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function validate(form: FormState, emailChanged: boolean): FormErrors {
  const errors: FormErrors = {};
  if (form.name.trim().length < 2) errors.name = "Ingresa tu nombre completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Ingresa un correo válido.";
  if (emailChanged && !form.password) errors.password = "Ingresa tu contraseña actual para cambiar el email.";
  return errors;
}

export default function ProfileEditForm({
  user,
  onSave,
  onRequestEmailChange,
  onConfirmEmailChange,
}: ProfileEditFormProps) {
  const [base, setBase] = useState<FormState>({ name: user.name, email: user.email, password: "" });
  const [form, setForm] = useState<FormState>(base);
  /** Email nuevo esperando el código (abre el modal de confirmación). */
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const { secondsLeft, start: startCooldown } = useCooldown();
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const emailChanged = normalizeEmail(form.email) !== normalizeEmail(base.email);
  const dirty = form.name.trim() !== base.name || emailChanged;

  const set = (key: keyof FormState) => (value: string) => {
    setSaved(false);
    setServerErrors([]);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const requestEmailCode = async (): Promise<boolean> => {
    const result = await onRequestEmailChange(normalizeEmail(form.email), form.password);
    if (result.ok) {
      startCooldown(RESEND_COOLDOWN_MS);
      return true;
    }
    if (result.status === 409) {
      setErrors({ email: "Este correo ya está registrado en otra cuenta." });
    } else if (result.status === 401) {
      setErrors({ password: result.messages[0] ?? "La contraseña es incorrecta." });
    } else {
      setServerErrors(result.messages);
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(form, emailChanged);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    if (form.name.trim() !== base.name) {
      const result = await onSave({ name: form.name.trim() });
      if (!result.ok) {
        setSaving(false);
        setServerErrors(result.messages);
        return;
      }
      setBase((prev) => ({ ...prev, name: result.data.name }));
    }
    // El email no cambia aquí: se confirma con un código enviado al nuevo.
    if (emailChanged && (await requestEmailCode())) {
      setPendingEmail(normalizeEmail(form.email));
    } else if (!emailChanged) {
      setSaved(true);
    }
    setSaving(false);
  };

  const resendEmailCode = async () => {
    setResending(true);
    if (await requestEmailCode()) toast.success("Te enviamos un nuevo código");
    setResending(false);
  };

  const confirmEmailCode = async (code: string) => {
    const result = await onConfirmEmailChange(code);
    if (result.ok) {
      const next = { name: form.name.trim(), email: result.data, password: "" };
      setBase(next);
      setForm(next);
      setSaved(true);
    }
    return result;
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="savvi-profile-rise rounded-2xl border border-gray-200/90 bg-white shadow-sm shadow-gray-200/25"
    >
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <h3 className="text-base font-semibold text-[#0B1829]">Información personal</h3>
        <p className="text-xs text-gray-500">
          Así te verás en Savvi. Cambiar el email requiere tu contraseña y un código enviado al correo nuevo.
        </p>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <ProfileField
          id="name"
          label="Nombre completo"
          icon={User}
          value={form.name}
          onChange={set("name")}
          error={errors.name}
          autoComplete="name"
        />
        <ProfileField
          id="email"
          label="Correo electrónico"
          icon={Mail}
          type="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
        />
        {emailChanged && (
          <div className="savvi-msg-in sm:col-span-2">
            <ProfileField
              id="current-password"
              label="Contraseña actual (para cambiar el email)"
              icon={KeyRound}
              type="password"
              value={form.password}
              onChange={set("password")}
              error={errors.password}
              autoComplete="current-password"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Te enviaremos un código al nuevo correo para confirmar el cambio.
            </p>
          </div>
        )}
        {serverErrors.length > 0 && (
          <ul className="savvi-msg-in space-y-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:col-span-2">
            {serverErrors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p
          className={cn(
            "text-xs transition-all duration-300",
            dirty ? "text-amber-600 opacity-100" : saved ? "text-mint opacity-100" : "opacity-0",
          )}
          aria-live="polite"
        >
          {dirty ? "Tienes cambios sin guardar" : saved ? "Cambios guardados" : "."}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => {
              setForm(base);
              setErrors({});
              setServerErrors([]);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Descartar
          </button>
          <button
            type="submit"
            disabled={!dirty || saving}
            className="inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-xl bg-[#0B1829] px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved && !dirty ? (
              <Check className="savvi-msg-in h-4 w-4 text-mint" />
            ) : null}
            {saving ? "Guardando…" : saved && !dirty ? "Guardado" : "Guardar cambios"}
          </button>
        </div>
      </div>

      <EmailChangeModal
        open={pendingEmail !== null}
        newEmail={pendingEmail ?? ""}
        onClose={() => setPendingEmail(null)}
        onConfirm={confirmEmailCode}
        resendSecondsLeft={secondsLeft}
        resending={resending}
        onResend={() => void resendEmailCode()}
      />
    </form>
  );
}
