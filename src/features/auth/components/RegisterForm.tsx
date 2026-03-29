"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/shadcn-button";
import SavvyBannerLight from "@/components/Banner/SavvyBannerLight";
import { RegisterDto } from "../types/auth.type";

interface RegisterFormProps {
  onSubmit: (data: RegisterDto) => Promise<{ success: boolean }>;
  loading?: boolean;
}

export default function RegisterForm({
  onSubmit,
  loading = false,
}: RegisterFormProps) {
  const [form, setForm] = useState<RegisterDto>({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSubmit(form);
    if (result.success) return;
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <SavvyBannerLight
        title="Crear cuenta"
        subtitle="Regístrate para llevar el control de tus finanzas"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 block w-full rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm px-3 py-2"
            placeholder="Tu nombre"
            required
          />
        </div>

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
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
          />
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full rounded-xl"
          disabled={loading}
        >
          {loading ? "Creando cuenta…" : "Registrarme"}
        </Button>

        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Iniciar sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
