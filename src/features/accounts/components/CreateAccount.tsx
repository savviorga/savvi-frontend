"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/shadcn-button";
import Modal from "@/components/Modal/Modal";
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
      title={editData ? "Editar cuenta" : "Crear cuenta"}
      description="Gestiona aquí tu cuenta"
      className="max-w-lg"
      headerIcon={
        <Wallet className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />
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
              placeholder="Nombre de la cuenta"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Saldo inicial (COP)
            </label>
            <CurrencyField
              value={form.initialBalance ?? null}
              onChange={(value) =>
                setForm((f: any) => ({ ...f, initialBalance: value ?? undefined }))
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                Cuenta de crédito
              </span>
              <span className="text-xs text-muted-foreground">
                Activa esta opción si es tarjeta/TC u otra cuenta de crédito.
              </span>
            </div>
            <input
              type="checkbox"
              checked={form.isCredit ?? false}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, isCredit: e.target.checked }))
              }
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent/25"
            />
          </div>

          {form.isCredit && (
            <div className="space-y-4 rounded-2xl border border-indigo-200 bg-accent/10 p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
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
                  <label className="mb-1 block text-sm font-medium text-foreground">
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
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25"
                    placeholder="Ej. 35.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
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
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25"
                    placeholder="Ej. 20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
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
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
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
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
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
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/25"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
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

              <p className="text-xs text-muted-foreground">
                Estos datos se usarán luego para calcular intereses y proyecciones.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1 block w-full resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/25 focus:ring-opacity-50"
              rows={3}
              placeholder="Descripción de la cuenta"
            />
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
