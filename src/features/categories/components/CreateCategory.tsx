"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import SavvyBannerLight from "@/components/Banner/SavvyBannerLight";
import { Category } from "../types/category.type";
import { CreateCategoryDto } from "../dto/create-category.dto";
import type { CategoryType } from "../types/category.type";

interface CreateCategoryProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCategoryDto) => void;
  editData?: Category | null;
  loading?: boolean;
}

function getInitialForm(editData?: Category | null): CreateCategoryDto {
  return {
    name: editData?.name ?? "",
    type: editData?.type ?? "egreso",
    description: editData?.description ?? "",
    color: editData?.color ?? undefined,
    isActive: editData?.isActive ?? true,
  };
}

export default function CreateCategory({
  open,
  onClose,
  onSubmit,
  editData,
  loading = false,
}: CreateCategoryProps) {
  const [form, setForm] = useState<CreateCategoryDto>(() =>
    getInitialForm(editData)
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity">
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-lg bg-white/70 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <span className="text-sm text-gray-600">Cargando…</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-scaleIn">
        <div className="flex justify-end w-full mb-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-lg transition cursor-pointer"
            title="Cerrar"
          >
            <XMarkIcon className="w-5 h-5 text-red-600" />
          </button>
        </div>

        <SavvyBannerLight
          title={editData ? "Editar categoría" : "Crear categoría"}
          subtitle="Gestiona aquí tu categoría"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 block w-full rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 text-sm px-3 py-2 transition placeholder-gray-400 bg-white"
              placeholder="Nombre de la categoría"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de categoría
            </label>
            <div className="mt-1 flex gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 transition has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:ring-2 has-[:checked]:ring-emerald-200">
                <input
                  type="radio"
                  name="category-type"
                  value="ingreso"
                  checked={form.type === "ingreso"}
                  onChange={() => setForm((f) => ({ ...f, type: "ingreso" }))}
                  className="border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">Ingresos</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 transition has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 has-[:checked]:ring-2 has-[:checked]:ring-rose-200">
                <input
                  type="radio"
                  name="category-type"
                  value="egreso"
                  checked={form.type === "egreso"}
                  onChange={() => setForm((f) => ({ ...f, type: "egreso" }))}
                  className="border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm font-medium text-gray-700">Gastos</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Indica si esta categoría se usa para ingresos o para gastos.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value || undefined }))
              }
              className="mt-1 block w-full rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 text-sm px-3 py-2 transition placeholder-gray-400 bg-white resize-none"
              rows={3}
              placeholder="Descripción de la categoría"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color (hex, ej. #3B82F6)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={form.color ?? "#3b82f6"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, color: e.target.value }))
                }
                className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={form.color ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, color: e.target.value || undefined }))
                }
                className="mt-1 block flex-1 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm px-3 py-2"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-category-active"
              checked={form.isActive ?? true}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="create-category-active"
              className="text-sm text-gray-700"
            >
              Activa
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-300">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button type="submit" variant="default" className="rounded-xl">
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
