"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MutationResult } from "../hooks/useProfile";
import type { ChangePasswordDto } from "../types/profile.type";
import ProfileField from "./ProfileField";

interface ProfileSecurityCardProps {
  onChangePassword: (payload: ChangePasswordDto) => Promise<MutationResult>;
}

const MIN_LENGTH = 6;
const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };
type FormState = typeof EMPTY;
type FormErrors = Partial<Record<keyof FormState, string>>;

/** 0–4, solo orientativo: backend exige únicamente ≥6 caracteres. */
function passwordStrength(value: string) {
  let score = 0;
  if (value.length >= MIN_LENGTH) score++;
  if (value.length >= 10) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

const STRENGTH = [
  { label: "Muy débil", color: "bg-rose-500", text: "text-rose-500" },
  { label: "Débil", color: "bg-rose-400", text: "text-rose-500" },
  { label: "Aceptable", color: "bg-amber-400", text: "text-amber-600" },
  { label: "Buena", color: "bg-teal-400", text: "text-teal-600" },
  { label: "Excelente", color: "bg-mint", text: "text-mint" },
];

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.currentPassword) errors.currentPassword = "Ingresa tu contraseña actual.";
  if (form.newPassword.length < MIN_LENGTH)
    errors.newPassword = `Debe tener al menos ${MIN_LENGTH} caracteres.`;
  else if (form.newPassword === form.currentPassword)
    errors.newPassword = "La nueva contraseña debe ser distinta de la actual.";
  if (form.confirmPassword !== form.newPassword) errors.confirmPassword = "Las contraseñas no coinciden.";
  return errors;
}

export default function ProfileSecurityCard({ onChangePassword }: ProfileSecurityCardProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const strength = passwordStrength(form.newPassword);
  const canSubmit = form.currentPassword && form.newPassword && form.confirmPassword && !saving;

  const set = (key: keyof FormState) => (value: string) => {
    setServerError(null);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    const result = await onChangePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    setSaving(false);

    if (result.ok) {
      setForm(EMPTY);
      setVisible(false);
      return;
    }
    if (result.status === 401) {
      setErrors({ currentPassword: "La contraseña actual no es correcta." });
    } else {
      setServerError(result.messages.join(" "));
    }
  };

  const toggle = (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:text-[#0B1829] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/40"
      aria-label={visible ? "Ocultar contraseñas" : "Mostrar contraseñas"}
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="savvi-profile-rise rounded-2xl border border-gray-200/90 bg-white shadow-sm shadow-gray-200/25 lg:col-span-3"
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0B1829]">Cambiar contraseña</h3>
            <p className="text-xs text-gray-500">No se cerrará tu sesión al cambiarla.</p>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <ProfileField
            id="currentPassword"
            label="Contraseña actual"
            icon={LockKeyhole}
            type={visible ? "text" : "password"}
            value={form.currentPassword}
            onChange={set("currentPassword")}
            error={errors.currentPassword}
            autoComplete="current-password"
            trailing={toggle}
          />

          <div>
            <ProfileField
              id="newPassword"
              label="Nueva contraseña"
              icon={LockKeyhole}
              type={visible ? "text" : "password"}
              value={form.newPassword}
              onChange={set("newPassword")}
              error={errors.newPassword}
              hint={`Mínimo ${MIN_LENGTH} caracteres.`}
              autoComplete="new-password"
            />
            {form.newPassword && (
              <div className="savvi-msg-in mt-2 flex items-center gap-3">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors duration-300",
                        i < strength ? STRENGTH[strength].color : "bg-slate-100",
                      )}
                    />
                  ))}
                </div>
                <span className={cn("text-[11px] font-semibold", STRENGTH[strength].text)}>
                  {STRENGTH[strength].label}
                </span>
              </div>
            )}
          </div>

          <ProfileField
            id="confirmPassword"
            label="Confirmar nueva contraseña"
            icon={LockKeyhole}
            type={visible ? "text" : "password"}
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          {serverError && (
            <p className="savvi-msg-in rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {serverError}
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 px-5 py-4 sm:px-6">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-[#0B1829] px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Actualizando…" : "Actualizar contraseña"}
          </button>
        </div>
      </form>

      <aside
        className="savvi-profile-rise h-fit rounded-2xl border border-mint/25 bg-gradient-to-br from-mint/10 via-white to-white p-5 sm:p-6 lg:col-span-2"
        style={{ animationDelay: "120ms" }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/15 text-mint">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#0B1829]">Consejos para una contraseña segura</h3>
        <ul className="mt-3 space-y-2 text-xs text-gray-600">
          <li className="flex gap-2"><span className="text-mint">•</span>Usa al menos 10 caracteres.</li>
          <li className="flex gap-2"><span className="text-mint">•</span>Combina mayúsculas, minúsculas, números y símbolos.</li>
          <li className="flex gap-2"><span className="text-mint">•</span>No la reutilices en otras apps, sobre todo en tu banco.</li>
          <li className="flex gap-2"><span className="text-mint">•</span>Evita datos personales como fechas o nombres.</li>
        </ul>
      </aside>
    </div>
  );
}
