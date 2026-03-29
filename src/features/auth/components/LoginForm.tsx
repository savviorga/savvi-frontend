"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { LoginDto } from "../types/auth.type";
import LoginAuthInput from "./LoginAuthInput";
import GoogleGlyph from "./GoogleGlyph";

interface LoginFormProps {
  onSubmit: (data: LoginDto) => Promise<{ success: boolean }>;
  loading?: boolean;
}

export default function LoginForm({ onSubmit, loading = false }: LoginFormProps) {
  const [form, setForm] = useState<LoginDto>({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rememberMe) {
      try {
        localStorage.setItem("savvi_login_remember", "1");
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.removeItem("savvi_login_remember");
      } catch {
        /* ignore */
      }
    }
    const result = await onSubmit(form);
    if (result.success) return;
  };

  return (
    <div className="flex flex-col">
      <Link
        href="/"
        className="mb-8 inline-flex w-fit items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al inicio
      </Link>

      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">
          Bienvenido de nuevo
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-[#0a1628] sm:text-[1.75rem]">
          Iniciar sesión
        </h2>
        <p className="text-sm text-slate-500">
          Ingresa con tu email y contraseña
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <LoginAuthInput
          id="login-email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="tu@email.com"
          value={form.email}
          onChange={(e) =>
            setForm((f) => ({ ...f, email: e.target.value }))
          }
          required
        />

        <LoginAuthInput
          id="login-password"
          label="Contraseña"
          type="password"
          icon={Lock}
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) =>
            setForm((f) => ({ ...f, password: e.target.value }))
          }
          required
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-slate-300 text-mint focus:ring-mint/40"
            />
            Recordarme
          </label>
          <button
            type="button"
            className="text-sm font-medium text-mint hover:text-mint-dim hover:underline"
            onClick={() =>
              toast("Recuperación de contraseña disponible pronto.", {
                icon: "🔐",
              })
            }
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-semibold text-slate-900 shadow-sm transition-[box-shadow,background-color] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/30 disabled:pointer-events-none disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar a Savvi"}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-white px-3 text-slate-400">o continúa con</span>
        </div>
      </div>

      <button
        type="button"
        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-base font-semibold text-slate-900 shadow-sm transition-[box-shadow,background-color] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/30"
        onClick={() =>
          toast("Inicio de sesión con Google estará disponible pronto.", {
            icon: "ℹ️",
          })
        }
      >
        <GoogleGlyph className="size-5 shrink-0" />
        Continuar con Google
      </button>

      <p className="mt-8 text-center text-sm text-slate-500">
        ¿No tienes cuenta?{" "}
        <Link
          href="/register"
          className="font-semibold text-mint hover:text-mint-dim hover:underline"
        >
          Regístrate gratis
        </Link>
      </p>

      <p className="mt-8 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-slate-400">
        <Lock className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />
        <span>
          Tu información está protegida con cifrado de extremo a extremo. Al
          iniciar sesión serás redirigido automáticamente.
        </span>
      </p>
    </div>
  );
}
