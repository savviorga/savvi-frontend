"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CalculatorIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import SavvyBanner from "@/components/Banner/SavvyBanner";
import CustomTable, { Column } from "@/components/Table/CustomTable";
import { Button } from "@/components/ui/button";
import { BudgetService } from "../services/budget.service";
import type { Budget, BudgetDetail } from "../types/budget.type";
import toast from "react-hot-toast";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

function formatCop(n: number) {
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

type DetailTableRow = BudgetDetail & { rowNumber: number };

function sumEstimatedFromDetails(details: BudgetDetail[]): number {
  return details.reduce((s, d) => {
    const v = d.estimatedAmount;
    if (v == null || !Number.isFinite(Number(v))) return s;
    return s + Number(v);
  }, 0);
}

export function BudgetDetailSpreadsheet({ budgetId }: { budgetId: string }) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState<number | null>(null);
  /** Solo formulario: cuántas partidas iguales crear (cada una con número en nombre y nota). */
  const [partidaCount, setPartidaCount] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const b = await BudgetService.getById(budgetId);
      setBudget(b);
    } catch (e) {
      console.error(e);
      setBudget(null);
      setNotFound(true);
      toast.error("No se pudo cargar el presupuesto");
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

  /** Recarga datos sin pantalla de carga (evita parpadeo tras guardar / borrar). */
  const refreshSilently = useCallback(async () => {
    try {
      const b = await BudgetService.getById(budgetId);
      setBudget(b);
    } catch (e) {
      console.error(e);
    }
  }, [budgetId]);

  useEffect(() => {
    load();
  }, [load]);

  function mergeNewDetails(created: BudgetDetail[]) {
    setBudget((prev) => {
      if (!prev) return prev;
      const merged = [...(prev.details ?? []), ...created].sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
      const next: Budget = { ...prev, details: merged };
      if (prev.amountAutoCalculated) {
        next.amount = sumEstimatedFromDetails(merged);
      }
      return next;
    });
  }

  const detailRows: DetailTableRow[] = useMemo(() => {
    if (!budget?.details?.length) return [];
    const sorted = [...budget.details].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted.map((d, i) => ({ ...d, rowNumber: i + 1 }));
  }, [budget?.details]);

  const totalEstimated = useMemo(() => {
    return detailRows.reduce((sum, r) => {
      const v = r.estimatedAmount;
      if (v == null || !Number.isFinite(Number(v))) return sum;
      return sum + Number(v);
    }, 0);
  }, [detailRows]);

  async function handleAddDetail(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) {
      toast.error("Indica el nombre de la partida (ej. Gas, Luz)");
      return;
    }

    const rawCount = Number(partidaCount);
    const count = Math.max(
      1,
      Math.min(
        50,
        Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 1
      )
    );

    try {
      setSaving(true);
      const descBase = newDescription.trim();
      const created: BudgetDetail[] = [];

      for (let i = 1; i <= count; i++) {
        const labelPart = count > 1 ? `${label} ${i}` : label;
        let descriptionPart: string | undefined;
        if (count > 1) {
          descriptionPart = descBase ? `${descBase} ${i}` : `Parte ${i}`;
        } else {
          descriptionPart = descBase || undefined;
        }

        const detail = await BudgetService.addDetail(budgetId, {
          label: labelPart,
          description: descriptionPart,
          estimatedAmount: newAmount ?? undefined,
        });
        created.push(detail);
      }

      mergeNewDetails(created);
      toast.success(
        count === 1
          ? "Partida agregada"
          : `Se agregaron ${count} partidas`
      );
      setNewLabel("");
      setNewDescription("");
      setNewAmount(null);
      setPartidaCount(1);
    } catch (err) {
      if (isApiError(err)) {
        getErrorMessages(err).forEach((m) => toast.error(m));
      } else {
        toast.error("Error al agregar la partida");
      }
      await refreshSilently();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(detailId: string) {
    if (!confirm("¿Eliminar esta partida?")) return;
    try {
      setDeletingId(detailId);
      await BudgetService.removeDetail(budgetId, detailId);
      setBudget((prev) => {
        if (!prev) return prev;
        const nextDetails = (prev.details ?? []).filter(
          (d) => d.id !== detailId
        );
        const next: Budget = { ...prev, details: nextDetails };
        if (prev.amountAutoCalculated) {
          next.amount = sumEstimatedFromDetails(nextDetails);
        }
        return next;
      });
      toast.success("Partida eliminada");
    } catch (err) {
      if (isApiError(err)) {
        getErrorMessages(err).forEach((m) => toast.error(m));
      } else {
        toast.error("Error al eliminar");
      }
      await refreshSilently();
    } finally {
      setDeletingId(null);
    }
  }

  const columns: Column<DetailTableRow>[] = [
    {
      key: "rowNumber",
      header: "#",
      className: "w-14 text-center",
      render: (row) => (
        <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {row.rowNumber}
        </span>
      ),
    },
    {
      key: "label",
      header: "Partida",
      render: (row) => (
        <span className="font-medium text-slate-900">{row.label}</span>
      ),
    },
    {
      key: "description",
      header: "Notas / ref.",
      render: (row) => (
        <span className="text-slate-600">
          {row.description?.trim() ? (
            row.description
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </span>
      ),
    },
    {
      key: "estimatedAmount",
      header: "Monto est.",
      className: "text-right",
      render: (row) => {
        const v = row.estimatedAmount;
        if (v == null || !Number.isFinite(Number(v)) || Number(v) <= 0) {
          return <span className="text-slate-400">—</span>;
        }
        return (
          <span className="font-medium tabular-nums text-emerald-700">
            {formatCop(Number(v))}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-14 text-right",
      render: (row) => (
        <button
          type="button"
          title="Eliminar"
          disabled={deletingId === row.id}
          className="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600 disabled:opacity-40"
          onClick={() => void handleRemove(row.id)}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">Cargando…</p>
    );
  }

  if (notFound || !budget) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">No se encontró este presupuesto.</p>
        <Link
          href="/budget"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver a presupuestos
        </Link>
      </div>
    );
  }

  const categoryName = budget.category?.name ?? "Categoría";
  const periodLabel = `${String(budget.month).padStart(2, "0")}/${budget.year}`;
  const limit = Number(budget.amount);

  return (
    <div className="space-y-6 pb-24 sm:pb-32">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/budget"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-800"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Presupuestos
        </Link>
      </div>

      <SavvyBanner
        title="Detalle del presupuesto"
        subtitle={`${categoryName} · ${periodLabel}`}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/80 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100">
        <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/40 via-teal-50/30 to-cyan-50/40 px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-4 rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                <BanknotesIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Límite mensual
                  {budget.amountAutoCalculated ? (
                    <span className="ml-1.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold normal-case text-emerald-800">
                      Automático
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
                  {formatCop(Number.isFinite(limit) ? limit : 0)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {budget.amountAutoCalculated
                    ? "Suma de los montos estimados de las partidas (se actualiza al agregar o quitar)."
                    : "Tope asignado a esta categoría"}
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${
                  totalEstimated > limit && limit > 0
                    ? "from-amber-400 to-orange-500 text-white shadow-amber-400/25"
                    : "from-teal-500 to-emerald-600 text-white shadow-teal-500/25"
                }`}
              >
                <CalculatorIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Suma estimada
                </p>
                <p
                  className={`mt-0.5 text-xl font-bold tracking-tight ${
                    totalEstimated > limit && limit > 0
                      ? "text-amber-600"
                      : "text-emerald-700"
                  }`}
                >
                  {formatCop(totalEstimated)}
                </p>
                {limit > 0 && totalEstimated > limit ? (
                  <p className="mt-1 text-xs font-medium text-amber-600">
                    Supera el límite (solo referencia).
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    Suma de montos de las partidas
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <PlusCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Agregar partida
              </h3>
              <p className="text-xs text-slate-500">
                Sumá facturas o conceptos (gas, luz, arriendo, etc.). Podés crear
                varias iguales a la vez con &quot;Cantidad de partidas&quot;.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddDetail} className="space-y-3">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1 sm:min-w-[180px]">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Nombre de la partida
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Ej. Almuerzo, Gas, Luz"
                  maxLength={200}
                  disabled={saving}
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Cantidad de partidas
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={50}
                  value={partidaCount}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      setPartidaCount(1);
                      return;
                    }
                    const n = parseInt(v, 10);
                    if (Number.isFinite(n)) {
                      setPartidaCount(Math.min(50, Math.max(1, n)));
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  disabled={saving}
                />
              </div>
              <div className="min-w-0 flex-1 sm:min-w-[180px]">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Factura, proveedor, Nº…"
                  maxLength={500}
                  disabled={saving}
                />
              </div>
              <div className="w-full sm:w-44">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Monto estimado (opcional)
                </label>
                <CurrencyField
                  value={newAmount}
                  onChange={setNewAmount}
                  placeholder="0"
                  disabled={saving}
                  className="!rounded-xl !border-slate-200 !py-2.5"
                />
              </div>
              <div className="flex w-full sm:w-auto sm:pb-0.5">
                <Button
                  type="submit"
                  className="w-full rounded-xl sm:w-auto"
                  disabled={saving || !newLabel.trim()}
                >
                  {saving
                    ? "Guardando…"
                    : partidaCount > 1
                      ? `Agregar ${partidaCount} partidas`
                      : "Agregar partida"}
                </Button>
              </div>
            </div>
            <p className="rounded-lg bg-emerald-50/60 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
              <span className="font-medium text-emerald-800">
                Cantidad &gt; 1:
              </span>{" "}
              se crean varias partidas con el{" "}
              <strong>mismo monto estimado</strong> cada una. El nombre queda como
              &quot;Almuerzo 1&quot;, &quot;Almuerzo 2&quot;… y en la nota se
              concatena el número (ej. &quot;Factura enero 1&quot;). Si no hay
              nota, se usa &quot;Parte 1&quot;, &quot;Parte 2&quot;…
            </p>
          </form>
        </div>

        <div className="px-3 py-4 sm:px-4 sm:pb-8">
          <h3 className="mb-3 px-1 text-sm font-semibold text-slate-800">
            Partidas registradas
          </h3>
          <CustomTable
            data={detailRows}
            columns={columns}
            loading={false}
            rowKey={(row) => row.id}
            totalPages={1}
            onPageChange={() => {}}
          />
          {detailRows.length > 0 ? (
            <div className="mt-4 flex justify-end rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-700">Total estimado:</span>{" "}
                <span className="text-lg font-bold tabular-nums text-emerald-800">
                  {formatCop(totalEstimated)}
                </span>
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
