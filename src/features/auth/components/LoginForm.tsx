"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SavvyBannerLight from "@/components/Banner/SavvyBannerLight";
import { LoginDto } from "../types/auth.type";

interface LoginFormProps {
  onSubmit: (data: LoginDto) => Promise<{ success: boolean }>;
  loading?: boolean;
}

export default function LoginForm({ onSubmit, loading = false }: LoginFormProps) {
  const [form, setForm] = useState<LoginDto>({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSubmit(form);
    if (result.success) return;
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <SavvyBannerLight
        title="Iniciar sesión"
        subtitle="Ingresa con tu email y contraseña"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1 block w-full rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm px-3 py-2"
            placeholder="tu@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            className="mt-1 block w-full rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm px-3 py-2"
            placeholder="••••••••"
            required
          />
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full rounded-xl"
          disabled={loading}
        >
          {loading ? "Entrando…" : "Entrar"}
        </Button>

        <p className="text-center text-sm text-gray-500">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}
