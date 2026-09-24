"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  TriangleAlert,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { RegisterDto } from "../types/auth.type";
import LoginAuthInput from "./LoginAuthInput";
import GoogleGlyph from "./GoogleGlyph";

interface RegisterFormProps {
  onSubmit: (data: RegisterDto) => Promise<{ success: boolean }>;
  loading?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** La primera regla es obligatoria; las demás solo suman fuerza. */
const PASSWORD_RULES = [
  {
    id: "length",
    label: "Mínimo 6 caracteres",
    test: (v: string) => v.length >= 6,
  },
  {
    id: "case",
    label: "Mayúscula y minúscula",
    test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
  {
    id: "number",
    label: "Al menos un número",
    test: (v: string) => /\d/.test(v),
  },
  {
    id: "symbol",
    label: "Un símbolo (!, @, #…)",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
] as const;

const STRENGTH_LEVELS = [
  { label: "Muy débil", text: "text-rose-500", bar: "bg-rose-400" },
  { label: "Débil", text: "text-rose-500", bar: "bg-rose-400" },
  { label: "Aceptable", text: "text-amber-500", bar: "bg-amber-400" },
  { label: "Fuerte", text: "text-mint-dim", bar: "bg-mint" },
  { label: "Muy fuerte", text: "text-mint-dim", bar: "bg-mint" },
] as const;

type FieldName = "name" | "email" | "password" | "confirm";

const NO_FIELD_TOUCHED: Record<FieldName, boolean> = {
  name: false,
  email: false,
  password: false,
  confirm: false,
};

export default function RegisterForm({
  onSubmit,
  loading = false,
}: RegisterFormProps) {
  const [form, setForm] = useState<RegisterDto>({
    name: "",
    email: "",
    password: "",
  });
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(NO_FIELD_TOUCHED);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const name = form.name.trim();
  const email = form.email.trim();

  const errors = useMemo(
    () => ({
      name: !name
        ? "Escribe tu nombre"
        : name.length < 3
          ? "Usa al menos 3 caracteres"
          : null,
      email: !email
        ? "Escribe tu email"
        : !EMAIL_RE.test(email)
          ? "Ese email no parece válido"
          : null,
      password: !form.password
        ? "Escribe una contraseña"
        : form.password.length < 6
          ? "La contraseña debe tener al menos 6 caracteres"
          : null,
      confirm: !confirm
        ? "Repite la contraseña"
        : confirm !== form.password
          ? "Las contraseñas no coinciden"
          : null,
    }),
    [name, email, form.password, confirm],
  );

  const values: Record<FieldName, string> = {
    name: form.name,
    email: form.email,
    password: form.password,
    confirm,
  };

  /** Verde en cuanto el campo es válido; rojo solo tras tocarlo. */
  const stateOf = (field: FieldName) => {
    if (!errors[field] && values[field]) return "valid" as const;
    if (touched[field] && errors[field]) return "error" as const;
    return "idle" as const;
  };
  const messageOf = (field: FieldName) =>
    touched[field] && errors[field] ? errors[field]! : undefined;

  const markTouched = (field: FieldName) =>
    setTouched((t) => ({ ...t, [field]: true }));

  const rulesPassed = useMemo(
    () => PASSWORD_RULES.map((rule) => rule.test(form.password)),
    [form.password],
  );
  const strength = rulesPassed.filter(Boolean).length;
  const level = STRENGTH_LEVELS[form.password ? strength : 0];

  const steps = [
    !errors.name,
    !errors.email,
    !errors.password,
    !errors.confirm,
    acceptedTerms,
  ];
  const completed = steps.filter(Boolean).length;
  const progress = Math.round((completed / steps.length) * 100);
  const isValid = completed === steps.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setTouched({ name: true, email: true, password: true, confirm: true });
      const firstError =
        errors.name ??
        errors.email ??
        errors.password ??
        errors.confirm ??
        "Acepta los términos y la política de privacidad para continuar";
      toast.error(firstError);
      return;
    }
    await onSubmit({ name, email, password: form.password });
  };

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

  return (
    <div className="flex flex-col">
      <Link
        href="/"
        className="mb-8 inline-flex w-fit items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al inicio
      </Link>

      <header className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">
          Crea tu cuenta
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-[#0a1628] sm:text-[1.75rem]">
          Regístrate en Savvi
        </h2>
        <p className="text-sm text-slate-500">
          Toma el control de tus finanzas en menos de un minuto
        </p>
      </header>

      <div className="mb-7 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-500">Progreso del registro</span>
          <span
            className={cn(
              "tabular-nums transition-colors",
              isValid ? "text-mint-dim" : "text-slate-500",
            )}
          >
            {completed} de {steps.length}
          </span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Progreso del registro"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-mint transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <LoginAuthInput
          id="register-name"
          label="Nombre"
          type="text"
          icon={User}
          autoComplete="name"
          placeholder="Tu nombre"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          onBlur={() => markTouched("name")}
          state={stateOf("name")}
          message={messageOf("name")}
        />

        <LoginAuthInput
          id="register-email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="tu@email.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          onBlur={() => markTouched("email")}
          state={stateOf("email")}
          message={messageOf("email")}
        />

        <div className="space-y-2">
          <LoginAuthInput
            id="register-password"
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            icon={Lock}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => {
              setPasswordFocused(false);
              setCapsLock(false);
              markTouched("password");
            }}
            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
            state={stateOf("password")}
            message={messageOf("password")}
            trailing={passwordToggle}
          />

          {capsLock && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600 duration-200 animate-in fade-in">
              <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
              Bloq Mayús está activado
            </p>
          )}

          {(passwordFocused || form.password.length > 0) && (
            <div className="space-y-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 duration-200 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-3">
                <div className="flex flex-1 gap-1">
                  {PASSWORD_RULES.map((rule, index) => (
                    <span
                      key={rule.id}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors duration-300",
                        index < strength ? level.bar : "bg-slate-200",
                      )}
                    />
                  ))}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold transition-colors",
                    level.text,
                  )}
                  aria-live="polite"
                >
                  {level.label}
                </span>
              </div>

              <ul className="grid gap-1.5 sm:grid-cols-2">
                {PASSWORD_RULES.map((rule, index) => (
                  <li
                    key={rule.id}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] transition-colors",
                      rulesPassed[index] ? "text-mint-dim" : "text-slate-500",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full transition-colors",
                        rulesPassed[index]
                          ? "bg-mint/15 text-mint-dim"
                          : "bg-slate-200 text-slate-400",
                      )}
                      aria-hidden
                    >
                      <Check className="size-2.5 stroke-[3]" />
                    </span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <LoginAuthInput
          id="register-confirm"
          label="Confirmar contraseña"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => markTouched("confirm")}
          state={stateOf("confirm")}
          message={messageOf("confirm")}
        />

        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-600 select-none">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-mint focus:ring-mint/40"
          />
          <span>
            Acepto los{" "}
            <Link
              href="/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-mint hover:text-mint-dim hover:underline"
            >
              términos
            </Link>{" "}
            y la{" "}
            <Link
              href="/terminos#privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-mint hover:text-mint-dim hover:underline"
            >
              política de privacidad
            </Link>{" "}
            de Savvi
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-base font-semibold text-slate-900 shadow-sm transition-[box-shadow,background-color] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/30 disabled:pointer-events-none disabled:opacity-60"
        >
          {loading ? "Creando cuenta…" : "Crear mi cuenta"}
          {!loading && (
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          )}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-white px-3 text-slate-400">o regístrate con</span>
        </div>
      </div>

      <button
        type="button"
        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-base font-semibold text-slate-900 shadow-sm transition-[box-shadow,background-color] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/30"
        onClick={() =>
          toast("Registro con Google estará disponible pronto.", {
            icon: "ℹ️",
          })
        }
      >
        <GoogleGlyph className="size-5 shrink-0" />
        Continuar con Google
      </button>

      <p className="mt-8 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-semibold text-mint hover:text-mint-dim hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>

      <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-slate-400">
        <ShieldCheck
          className="mt-0.5 size-3.5 shrink-0 text-slate-400"
          aria-hidden
        />
        <span>
          Tu información está protegida con cifrado de extremo a extremo. Al
          crear la cuenta serás redirigido automáticamente.
        </span>
      </p>
    </div>
  );
}
