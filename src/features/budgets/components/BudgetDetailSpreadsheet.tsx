"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import SavvyBannerHome, {
  type SavvyBannerHomeStat,
} from "@/components/Banner/SavvyBannerHome";
import CustomTable, { Column } from "@/components/Table/CustomTable";
import { Button } from "@/components/ui/shadcn-button";
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
        (a, b) => a.sortOrder - b.sortOrder,
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
    const sorted = [...budget.details].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    return sorted.map((d, i) => ({ ...d, rowNumber: i + 1 }));
  }, [budget?.details]);

  const totalEstimated = useMemo(() => {
    return detailRows.reduce((sum, r) => {
      const v = r.estimatedAmount;
      if (v == null || !Number.isFinite(Number(v))) return sum;
      return sum + Number(v);
    }, 0);
  }, [detailRows]);

  const budgetBannerStats: SavvyBannerHomeStat[] = useMemo(() => {
    if (!budget) {
      return [
        { label: "Límite mensual", value: formatCop(0), valueTone: "mint" },
        { label: "Suma estimada", value: formatCop(0), valueTone: "mint" },
      ];
    }
    const lim = Number.isFinite(Number(budget.amount))
      ? Number(budget.amount)
      : 0;
    const overLimit = lim > 0 && totalEstimated > lim;
    return [
      {
        label: "Límite mensual",
        tag: budget.amountAutoCalculated ? "Automático" : undefined,
        value: formatCop(lim),
        hint: budget.amountAutoCalculated
          ? "Suma de los montos estimados de las partidas (se actualiza al agregar o quitar)."
          : "Tope asignado a esta categoría",
        valueTone: "mint",
      },
      {
        label: "Suma estimada",
        value: formatCop(totalEstimated),
        hint: overLimit
          ? "Supera el límite (solo referencia)."
          : "Suma de montos de las partidas",
        valueTone: overLimit ? "amber" : "mint",
      },
    ];
  }, [budget, totalEstimated]);

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
        Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 1,
      ),
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
        count === 1 ? "Partida agregada" : `Se agregaron ${count} partidas`,
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
          (d) => d.id !== detailId,
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
        <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {row.rowNumber}
        </span>
      ),
    },
    {
      key: "label",
      header: "Partida",
      render: (row) => (
        <span className="font-medium text-foreground">{row.label}</span>
      ),
    },
    {
      key: "description",
      header: "Notas / ref.",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.description?.trim() ? (
            row.description
          ) : (
            <span className="text-muted-foreground">—</span>
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
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="font-medium tabular-nums">
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
          className="inline-flex rounded-lg p-2 text-muted-foreground transition hover:bg-rose-100 hover:text-rose-600 disabled:opacity-40"
          onClick={() => void handleRemove(row.id)}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Cargando…
      </p>
    );
  }

  if (notFound || !budget) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <p className="text-muted-foreground">
          No se encontró este presupuesto.
        </p>
        <Link
          href="/budget"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver a presupuestos
        </Link>
      </div>
    );
  }

  const categoryName = budget.category?.name ?? "Categoría";
  const periodLabel = `${String(budget.month).padStart(2, "0")}/${budget.year}`;

  return (
    <div className="space-y-6 pb-24 sm:pb-32">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/budget"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-accent/30 hover:bg-accent/10 hover:text-accent-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Presupuestos
        </Link>
      </div>

      <SavvyBannerHome
        title="Detalle del presupuesto"
        subtitle={`${categoryName} · ${periodLabel}`}
        badgeLabel="Presupuesto"
        stats={budgetBannerStats}
      />

      <section className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-white via-white to-slate-50/80 shadow-xl shadow-border/40 ring-1 ring-border">
        <div className="border-b border-border bg-white px-5 py-5 sm:px-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <PlusCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Agregar partida
              </h3>
              <p className="text-xs text-muted-foreground">
                Sumá facturas o conceptos (gas, luz, arriendo, etc.). Podés
                crear varias iguales a la vez con &quot;Cantidad de
                partidas&quot;.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddDetail} className="space-y-3">
            <div className="flex flex-col gap-4 rounded-xl border border-border/80 bg-muted/50 p-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1 sm:min-w-[180px]">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Nombre de la partida
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Ej. Almuerzo, Gas, Luz"
                  maxLength={200}
                  disabled={saving}
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  disabled={saving}
                />
              </div>
              <div className="min-w-0 flex-1 sm:min-w-[180px]">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Factura, proveedor, Nº…"
                  maxLength={500}
                  disabled={saving}
                />
              </div>
              <div className="w-full sm:w-44">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Monto estimado (opcional)
                </label>
                <CurrencyField
                  value={newAmount}
                  onChange={setNewAmount}
                  placeholder="0"
                  disabled={saving}
                  className="!rounded-xl !border-border !py-2.5"
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
            <p className="rounded-lg bg-accent/12 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-accent-foreground">
                Cantidad &gt; 1:
              </span>{" "}
              se crean varias partidas con el{" "}
              <strong>mismo monto estimado</strong> cada una. El nombre queda
              como &quot;Almuerzo 1&quot;, &quot;Almuerzo 2&quot;… y en la nota
              se concatena el número (ej. &quot;Factura enero 1&quot;). Si no
              hay nota, se usa &quot;Parte 1&quot;, &quot;Parte 2&quot;…
            </p>
          </form>
        </div>

        <div className="px-3 py-4 sm:px-4 sm:pb-8">
          <h3 className="mb-3 px-1 text-sm font-semibold text-foreground">
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
            <div className="mt-4 flex justify-end rounded-xl border border-border bg-muted/80 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Total estimado:
                </span>{" "}
                <span className="text-lg font-bold tabular-nums text-accent-foreground">
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
