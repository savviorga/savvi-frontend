"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import CustomTable, { Column } from "@/components/Table/CustomTable";
import LinearLoader from "@/components/Loaders/LinearLoader";
import { Transaction } from "../../types/transactions.types";
import { FlowIconTransaction } from "../FlowIconTransaction";

interface TransactionTableProps {
  items: Transaction[];
  loading: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onShow?: (id: string) => void;
}

/** Filas por página en escritorio y tamaño del lote de "Mostrar más" en móvil. */
const PAGE_SIZE = 10;

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
});

/** 'YYYY-MM-DD' → Date local (sin el corrimiento de zona que produce `new Date(iso)`). */
function toLocalDate(date: string): Date {
  return new Date(`${date.slice(0, 10)}T00:00:00`);
}

function formatDayHeading(date: string): string {
  const d = toLocalDate(date);
  if (Number.isNaN(d.getTime())) return date;
  if (isToday(d)) return "Hoy";
  if (isYesterday(d)) return "Ayer";
  return format(d, "EEEE d 'de' MMMM", { locale: es });
}

function formatAmount(item: Transaction): string {
  const sign = item.type === "ingreso" ? "+" : item.type === "egreso" ? "-" : "";
  return `${sign}${currency.format(item.amount)}`;
}

function amountClass(type: Transaction["type"]): string {
  if (type === "ingreso") return "text-emerald-600";
  if (type === "egreso") return "text-rose-600";
  return "text-foreground";
}

/** Agrupa por día conservando el orden recibido (ya viene de más reciente a más antiguo). */
function groupByDay(items: Transaction[]): { date: string; items: Transaction[] }[] {
  const groups: { date: string; items: Transaction[] }[] = [];
  for (const item of items) {
    const day = item.date.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last?.date === day) last.items.push(item);
    else groups.push({ date: day, items: [item] });
  }
  return groups;
}

export default function TransactionTable({
  items,
  loading,
  onShow,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Al cambiar de pestaña o de filtro se vuelve al inicio en ambas vistas.
  const listKey = `${items.length}:${items[0]?.id ?? ""}`;
  const [lastListKey, setLastListKey] = useState(listKey);
  if (lastListKey !== listKey) {
    setLastListKey(listKey);
    setPage(1);
    setVisibleCount(PAGE_SIZE);
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [items, currentPage],
  );

  const mobileItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );
  const mobileGroups = useMemo(() => groupByDay(mobileItems), [mobileItems]);
  const remaining = items.length - mobileItems.length;

  const handleDelete = (id: string) => {
    if (confirmId === id) {
      onDelete?.(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  };

  const columns: Column<Transaction>[] = [
    {
      key: "type",
      header: "Tipo",
      render: (item) => <FlowIconTransaction type={item.type} />,
    },
    {
      key: "date",
      header: "Fecha",
      render: (item) => (
        <span className="text-muted-foreground">{item.date}</span>
      ),
    },
    {
      key: "description",
      header: "Descripción",
      render: (item) => (
        <p
          className="max-w-xs truncate font-medium text-foreground"
          title={item.description}
        >
          {item.description}
        </p>
      ),
    },
    {
      key: "amount",
      header: "Monto ($)",
      className: "text-right",
      render: (item) => (
        <span className={`font-semibold tabular-nums ${amountClass(item.type)}`}>
          {formatAmount(item)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-accent px-4 py-1.5 text-sm font-medium transition hover:bg-accent/10"
            onClick={() => onShow?.(item.id)}
          >
            Ver
          </button>
          {onEdit && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
              onClick={() => onEdit(item.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                confirmId === item.id
                  ? "border border-red-500 bg-red-500 text-white hover:bg-red-600"
                  : "border border-red-200 text-red-500 hover:bg-red-50"
              }`}
              onClick={() => handleDelete(item.id)}
              onBlur={() => setConfirmId(null)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirmId === item.id ? "Confirmar" : "Eliminar"}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── Móvil: lista de movimientos agrupada por día ── */}
      <div className="md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-border/60 bg-white px-6 py-12 shadow-sm">
            <LinearLoader />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              No hay movimientos
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Los que registres aparecerán aquí
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
              {mobileGroups.map((group) => (
                <section key={group.date}>
                  <h3 className="sticky top-0 z-10 flex items-baseline justify-between gap-3 border-b border-border/60 bg-muted/80 px-4 py-2 backdrop-blur">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatDayHeading(group.date)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "movimiento" : "movimientos"}
                    </span>
                  </h3>

                  <ul className="divide-y divide-border/40">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onShow?.(item.id)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted/60"
                        >
                          <FlowIconTransaction type={item.type} />

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-foreground">
                              {item.description?.trim() || item.category || "Sin descripción"}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {item.category}
                            </span>
                          </span>

                          <span className="flex shrink-0 items-center gap-1">
                            <span
                              className={`text-sm font-semibold tabular-nums ${amountClass(item.type)}`}
                            >
                              {formatAmount(item)}
                            </span>
                            <ChevronRight
                              className="h-4 w-4 text-muted-foreground"
                              aria-hidden
                            />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {remaining > 0 && (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="mt-3 w-full rounded-xl border border-border bg-white py-3 text-sm font-semibold text-foreground transition active:bg-muted"
              >
                Mostrar {Math.min(PAGE_SIZE, remaining)} más
                <span className="ml-1 font-normal text-muted-foreground">
                  ({remaining} restantes)
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Escritorio: tabla ── */}
      <div className="hidden md:block">
        <CustomTable
          data={pageItems}
          columns={columns}
          loading={loading}
          rowKey={(item) => item.id}
          totalPages={totalPages}
          page={currentPage}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
