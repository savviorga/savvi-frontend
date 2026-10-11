"use client";

import { useState } from "react";
import { Check, Tag } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import ChipSelect from "@/components/Inputs/ChipSelect";
import { Button } from "@/components/ui/shadcn-button";
import SwitchIndicator from "@/features/transactions/components/transaction-form/Switch";
import { cn } from "@/lib/utils";
import type { Category, CategoryType } from "../types/category.type";
import type { CreateCategoryDto } from "../dto/create-category.dto";

/** Colores sugeridos: un toque y listo; el selector libre queda al final. */
const PALETTE = [
  "#00B892",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F43F5E",
  "#F59E0B",
  "#10B981",
  "#64748B",
];

const TYPE_OPTIONS = [
  { label: "Gastos", value: "egreso" },
  { label: "Ingresos", value: "ingreso" },
] as const;

const INPUT_CLASS =
  "block w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base transition placeholder:text-muted-foreground focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25 sm:text-sm";

interface FormState {
  name: string;
  type: CategoryType;
  color: string | undefined;
  description: string;
  isActive: boolean;
}

function initialState(
  editing: Category | null,
  parent: Category | null,
  defaultType?: CategoryType,
): FormState {
  return {
    name: editing?.name ?? "",
    type: parent?.type ?? editing?.type ?? defaultType ?? "egreso",
    color: editing?.color ?? parent?.color ?? undefined,
    description: editing?.description ?? "",
    isActive: editing?.isActive ?? true,
  };
}

/**
 * Crear o editar una categoría. Dentro de una categoría (`parent`) crea una
 * subcategoría, que toma el tipo de su categoría. Agrupar se hace arrastrando.
 */
export default function CategoryFormModal({
  open,
  onClose,
  editing,
  parent,
  defaultType,
  saving,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  editing: Category | null;
  /** Categoría a la que pertenece (o pertenecerá) la subcategoría. */
  parent: Category | null;
  defaultType?: CategoryType;
  saving: boolean;
  onSubmit: (payload: CreateCategoryDto) => Promise<boolean>;
}) {
  const [form, setForm] = useState<FormState>(() => initialState(editing, parent, defaultType));
  const [nameError, setNameError] = useState(false);

  // Al abrir (o cambiar lo que se edita) se reinicia el formulario. Se ajusta en
  // render, no en un efecto, para no pintar un frame con datos viejos.
  const sessionKey = `${open}:${editing?.id ?? "new"}:${parent?.id ?? ""}`;
  const [lastSessionKey, setLastSessionKey] = useState(sessionKey);
  if (open && lastSessionKey !== sessionKey) {
    setLastSessionKey(sessionKey);
    setForm(initialState(editing, parent, defaultType));
    setNameError(false);
  }

  const isSub = Boolean(parent);
  const title = editing
    ? isSub
      ? "Editar subcategoría"
      : "Editar categoría"
    : isSub
      ? `Nueva subcategoría en ${parent!.name}`
      : "Nueva categoría";

  const submit = async () => {
    const name = form.name.trim();
    if (!name) {
      setNameError(true);
      return;
    }
    const payload: CreateCategoryDto = {
      name,
      type: form.type,
      color: form.color,
      description: form.description.trim() || undefined,
      isActive: form.isActive,
      ...(editing ? {} : { parentId: parent?.id ?? null }),
    };
    if (await onSubmit(payload)) onClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
      title={title}
      description={
        isSub
          ? "Las subcategorías te dan más detalle sin perder el total de su categoría."
          : "Clasifica tus ingresos y gastos."
      }
      className="max-w-lg"
      headerIcon={<Tag className="h-5 w-5 text-mint-dim" strokeWidth={2} />}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-5"
      >
        <div>
          <label htmlFor="category-name" className="mb-1.5 block text-sm font-semibold text-foreground">
            Nombre
          </label>
          <input
            id="category-name"
            type="text"
            autoFocus
            maxLength={100}
            value={form.name}
            aria-invalid={nameError}
            onChange={(e) => {
              setNameError(false);
              setForm((f) => ({ ...f, name: e.target.value }));
            }}
            className={cn(INPUT_CLASS, nameError && "border-rose-400 ring-2 ring-rose-200 animate-shake")}
            placeholder={isSub ? "Ej. Plaza, Aseo, Tienda" : "Ej. Mercado, Transporte, Salario"}
          />
          {nameError && <p className="mt-1 text-xs font-medium text-rose-600">Escribe un nombre.</p>}
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-foreground">Tipo</p>
          <ChipSelect
            ariaLabel="Tipo de categoría"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(type) => setForm((f) => ({ ...f, type }))}
            disabled={isSub}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {isSub
              ? `Toma el tipo de "${parent!.name}".`
              : "Indica si se usa para ingresos o para gastos."}
          </p>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-foreground">Color</p>
          <div className="flex flex-wrap items-center gap-2">
            {PALETTE.map((color) => {
              const selected = form.color?.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  aria-label={`Color ${color}`}
                  aria-pressed={selected}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50 focus-visible:ring-offset-2",
                    selected && "ring-2 ring-offset-2 ring-[#0B1829]/70",
                  )}
                  style={{ backgroundColor: color }}
                >
                  {selected && <Check className="h-4 w-4 text-white animate-in zoom-in-50" aria-hidden />}
                </button>
              );
            })}
            <label
              className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border text-xs font-bold text-muted-foreground hover:border-mint/50"
              title="Otro color"
            >
              <span aria-hidden>+</span>
              <input
                type="color"
                value={form.color ?? "#00b892"}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Elegir otro color"
              />
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="category-description" className="mb-1.5 block text-sm font-semibold text-foreground">
            Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="category-description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={cn(INPUT_CLASS, "resize-none")}
            placeholder="¿Qué incluye?"
          />
        </div>

        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-white px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
          role="switch"
          aria-checked={form.isActive}
        >
          <span>
            <span className="block text-sm font-semibold text-foreground">Activa</span>
            <span className="block text-xs text-muted-foreground">
              Las inactivas no se ofrecen al registrar, pero conservan su historial.
            </span>
          </span>
          <SwitchIndicator checked={form.isActive} />
        </button>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" onClick={onClose} variant="outline" className="rounded-xl" disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" className="rounded-xl" disabled={saving}>
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
