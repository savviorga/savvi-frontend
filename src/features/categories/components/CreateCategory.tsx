"use client";

import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/shadcn-button";
import Modal from "@/components/Modal/Modal";
import { Category } from "../types/category.type";
import { CreateCategoryDto } from "../dto/create-category.dto";

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
    getInitialForm(editData),
  );

  useEffect(() => {
    if (open) {
      setForm(getInitialForm(editData));
    }
  }, [open, editData]);

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={editData ? "Editar categoría" : "Crear categoría"}
      description="Gestiona aquí tu categoría"
      className="max-w-md"
      headerIcon={
        <Tag className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />
      }
    >
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
            <span className="text-sm text-muted-foreground">Cargando…</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 block w-full rounded-xl border border-border bg-white px-3 py-2 text-sm transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/25 focus:ring-opacity-50"
              placeholder="Nombre de la categoría"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Tipo de categoría
            </label>
            <div className="mt-1 flex gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 transition has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:checked]:ring-2 has-[:checked]:ring-accent/30">
                <input
                  type="radio"
                  name="category-type"
                  value="ingreso"
                  checked={form.type === "ingreso"}
                  onChange={() => setForm((f) => ({ ...f, type: "ingreso" }))}
                  className="border-border text-accent focus:ring-accent"
                />
                <span className="text-sm font-medium text-foreground">Ingresos</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 transition has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 has-[:checked]:ring-2 has-[:checked]:ring-rose-200">
                <input
                  type="radio"
                  name="category-type"
                  value="egreso"
                  checked={form.type === "egreso"}
                  onChange={() => setForm((f) => ({ ...f, type: "egreso" }))}
                  className="border-border text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm font-medium text-foreground">Gastos</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Indica si esta categoría se usa para ingresos o para gastos.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Descripción
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value || undefined }))
              }
              className="mt-1 block w-full resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/25 focus:ring-opacity-50"
              rows={3}
              placeholder="Descripción de la categoría"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Color (hex, ej. #3B82F6)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={form.color ?? "#3b82f6"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, color: e.target.value }))
                }
                className="h-10 w-14 cursor-pointer rounded-lg border border-border"
              />
              <input
                type="text"
                value={form.color ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, color: e.target.value || undefined }))
                }
                className="block flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25"
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
              className="rounded border-border text-accent focus:ring-indigo-500"
            />
            <label
              htmlFor="create-category-active"
              className="text-sm text-foreground"
            >
              Activa
            </label>
          </div>

          <div className="flex justify-end space-x-3 border-t border-border pt-4">
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
    </Modal>
  );
}
