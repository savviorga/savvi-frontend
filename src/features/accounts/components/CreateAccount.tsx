"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import SavvyBannerLight from "@/components/Banner/SavvyBannerLight";
import { Account, CreateAccountDto } from "../types/account.type";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";

interface CreateAccountProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAccountDto) => void;
  editData?: Account | null;
  loading?: boolean;
}

function getInitialForm(editData?: Account | null) {
  return {
    name: editData?.name ?? "",
    description: editData?.description ?? "",
    initialBalance: undefined as number | undefined,
    isCredit: editData?.isCredit ?? false,
    creditLimit: editData?.creditLimit ?? undefined,
    aprRate: editData?.aprRate ?? undefined,
    gracePeriodDays: editData?.gracePeriodDays ?? undefined,
    statementDay: editData?.statementDay ?? undefined,
    dueDay: editData?.dueDay ?? undefined,
    minPaymentPercent: editData?.minPaymentPercent ?? undefined,
    minPaymentAmount: editData?.minPaymentAmount ?? undefined,
  };
}

export default function CreateAccount({
  open,
  onClose,
  onSubmit,
  editData,
  loading = false,
}: CreateAccountProps) {
  const [form, setForm] = useState(() => getInitialForm(editData));

  const toOptionalNumber = (value: string) => {
    if (value.trim() === "") return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  };

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
        {/* Botón cerrar */}
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
          title={editData ? "Editar cuenta" : "Crear cuenta"}
          subtitle="Gestiona aquí tu cuenta"
        />

        {/* Formulario */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-4"
        >
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 block w-full rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 text-sm px-3 py-2 transition placeholder-gray-400 bg-white"
              placeholder="Nombre de la cuenta"
              
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saldo inicial (COP)
            </label>
            <CurrencyField
              value={form.initialBalance ?? null}
              onChange={(value) =>
                setForm((f: any) => ({ ...f, initialBalance: value ?? undefined }))
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">
                Cuenta de crédito
              </span>
              <span className="text-xs text-gray-500">
                Activa esta opción si es tarjeta/TC u otra cuenta de crédito.
              </span>
            </div>
            <input
              type="checkbox"
              checked={form.isCredit ?? false}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, isCredit: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
            />
          </div>

          {/* Campos extra para tarjeta de crédito */}
          {form.isCredit && (
            <div className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Límite de crédito (COP)
                </label>
                <CurrencyField
                  value={form.creditLimit ?? null}
                  onChange={(value) =>
                    setForm((f: any) => ({
                      ...f,
                      creditLimit: value ?? undefined,
                    }))
                  }
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    APR (%) anual
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.aprRate ?? ""}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        aprRate: toOptionalNumber(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="Ej. 35.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Periodo de gracia (días)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={form.gracePeriodDays ?? ""}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        gracePeriodDays: toOptionalNumber(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="Ej. 20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Día de corte (1-31)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={form.statementDay ?? ""}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        statementDay: toOptionalNumber(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Día de pago (1-31)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={form.dueDay ?? ""}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        dueDay: toOptionalNumber(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Pago mínimo (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.minPaymentPercent ?? ""}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        minPaymentPercent: toOptionalNumber(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Pago mínimo (monto, COP)
                  </label>
                  <CurrencyField
                    value={form.minPaymentAmount ?? null}
                    onChange={(value) =>
                      setForm((f: any) => ({
                        ...f,
                        minPaymentAmount: value ?? undefined,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-600">
                Estos datos se usarán luego para calcular intereses y proyecciones.
              </p>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 text-sm px-3 py-2 transition placeholder-gray-400 bg-white resize-none"
              rows={3}
              placeholder="Descripción de la cuenta"
            />
          </div>

          {/* Botones */}
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
