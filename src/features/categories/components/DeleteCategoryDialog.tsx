"use client";

import { AlertTriangle, Ban, Layers, PiggyBank, Trash2 } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { Button } from "@/components/ui/shadcn-button";
import type { Category } from "../types/category.type";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Confirmación de borrado que explica las consecuencias antes de hacerlo:
 * con transacciones no se puede (se ofrece desactivar), un grupo suelta sus
 * subcategorías y los presupuestos se eliminan con la categoría.
 */
export default function DeleteCategoryDialog({
  category,
  childrenCount,
  saving,
  onClose,
  onConfirm,
  onDeactivate,
}: {
  category: Category | null;
  childrenCount: number;
  saving: boolean;
  onClose: () => void;
  onConfirm: (options: { releaseChildren: boolean }) => Promise<boolean>;
  onDeactivate: () => Promise<boolean>;
}) {
  const transactions = category?.transactionsCount ?? 0;
  const budgets = category?.budgetsCount ?? 0;
  const blocked = transactions > 0;

  return (
    <Modal
      open={Boolean(category)}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
      title={blocked ? "No se puede eliminar" : `¿Eliminar "${category?.name ?? ""}"?`}
      className="max-w-md"
      fullScreenOnSmallViewports={false}
      headerIcon={
        blocked ? (
          <Ban className="h-5 w-5 text-amber-500" />
        ) : (
          <Trash2 className="h-5 w-5 text-rose-500" />
        )
      }
    >
      {category && (
        <div className="space-y-4">
          {blocked ? (
            <p className="text-sm text-foreground">
              <strong>{category.name}</strong> tiene{" "}
              {plural(transactions, "transacción", "transacciones")}. Para no perder tu historial,
              cámbialas de categoría primero o desactívala: dejará de aparecer al registrar, pero
              sus transacciones se conservan.
            </p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {childrenCount > 0 && (
                <li className="flex gap-2.5 rounded-xl bg-sky-50 p-3 text-sky-900">
                  <Layers className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    Sus {plural(childrenCount, "subcategoría quedará", "subcategorías quedarán")} como
                    categorías principales, con todas sus transacciones.
                  </span>
                </li>
              )}
              {budgets > 0 && (
                <li className="flex gap-2.5 rounded-xl bg-amber-50 p-3 text-amber-900">
                  <PiggyBank className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    También se {budgets === 1 ? "eliminará" : "eliminarán"}{" "}
                    {plural(budgets, "presupuesto", "presupuestos")} de esta categoría.
                  </span>
                </li>
              )}
              <li className="flex gap-2.5 rounded-xl bg-rose-50 p-3 text-rose-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>Esta acción no se puede deshacer.</span>
              </li>
            </ul>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            {blocked ? (
              category.isActive && (
                <Button
                  className="rounded-xl"
                  disabled={saving}
                  onClick={async () => {
                    if (await onDeactivate()) onClose();
                  }}
                >
                  Desactivar
                </Button>
              )
            ) : (
              <Button
                className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                disabled={saving}
                onClick={async () => {
                  if (await onConfirm({ releaseChildren: childrenCount > 0 })) onClose();
                }}
              >
                {saving ? "Eliminando…" : childrenCount > 0 ? "Eliminar grupo" : "Eliminar"}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
