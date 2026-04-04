"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import type { Transaction } from "@/features/transactions/types/transactions.types";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const todayISO = () => new Date().toISOString().slice(0, 10);

type ReportTransactionsProps = {
  transactions: Transaction[];
};

export default function ReportTransactions({ transactions }: ReportTransactionsProps) {
  const [fromDate, setFromDate] = useState(todayISO);
  const [toDate, setToDate] = useState(todayISO);

  const filtered = useMemo(
    () =>
      transactions.filter((tx) => {
        const d = tx.date?.slice(0, 10) ?? "";
        return d >= fromDate && d <= toDate;
      }),
    [transactions, fromDate, toDate],
  );

  const totals = useMemo(() => {
    let ingreso = 0;
    let egreso = 0;
    let transferencia = 0;

    for (const tx of filtered) {
      const amount = Number(tx.amount || 0);
      if (tx.type === "ingreso") ingreso += amount;
      if (tx.type === "egreso") egreso += amount;
      if (tx.type === "transferencia") transferencia += amount;
    }

    return { ingreso, egreso, transferencia, balance: ingreso - egreso };
  }, [filtered]);

  const monthlySeries = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const tx of filtered) {
      const key = tx.date?.slice(0, 7) ?? "";
      if (!key) continue;
      grouped.set(key, (grouped.get(key) ?? 0) + Number(tx.amount || 0));
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, value]) => ({
        label: format(new Date(`${key}-01`), "MMM yyyy", { locale: es }),
        value,
      }));
  }, [filtered]);

  const typeDistribution = {
    labels: ["Ingresos", "Egresos", "Transferencias"],
    values: [totals.ingreso, totals.egreso, totals.transferencia],
  };

  const lineData = {
    labels: monthlySeries.map((item) => item.label),
    datasets: [
      {
        label: "Volumen mensual",
        data: monthlySeries.map((item) => item.value),
        borderColor: "rgb(11, 24, 41)",
        backgroundColor: "rgba(11, 24, 41, 0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const doughnutData = {
    labels: typeDistribution.labels,
    datasets: [
      {
        data: typeDistribution.values,
        backgroundColor: [
          "rgba(16, 185, 129, 0.85)",
          "rgba(244, 63, 94, 0.85)",
          "rgba(14, 165, 233, 0.85)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: unknown) => {
            const n = Number(value);
            return formatMoney(Number.isFinite(n) ? n : 0);
          },
        },
      },
    },
  };

  const doughnutOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, padding: 16, font: { size: 12 } },
      },
    },
  };

  return (
    <section className="space-y-4 sm:space-y-5">
      {/* Filtro por fecha */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Rango de fechas
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <div className="col-span-1">
            <label className="mb-1 block text-xs text-muted-foreground">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-mint/35 sm:w-auto sm:px-3"
            />
          </div>

          <div className="col-span-1">
            <label className="mb-1 block text-xs text-muted-foreground">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-mint/35 sm:w-auto sm:px-3"
            />
          </div>

          <div className="col-span-2 flex gap-2 sm:col-span-1">
            <button
              type="button"
              onClick={() => { setFromDate(todayISO()); setToDate(todayISO()); }}
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/60 sm:flex-none"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const iso = yesterday.toISOString().slice(0, 10);
                setFromDate(iso);
                setToDate(iso);
              }}
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/60 sm:flex-none"
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setFromDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
                setToDate(todayISO());
              }}
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/60 sm:flex-none"
            >
              Este mes
            </button>
            <button
              type="button"
              onClick={() => {
                const dates = transactions.map((t) => t.date).filter(Boolean).sort();
                if (dates.length) { setFromDate(dates[0]); setToDate(dates[dates.length - 1]); }
              }}
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/60 sm:flex-none"
            >
              Todo
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground sm:mt-3">
          {filtered.length} de {transactions.length} transacciones
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="rounded-2xl border border-border bg-card p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Total transacciones</p>
          <p className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{filtered.length}</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Ingresos</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600 sm:text-2xl">{formatMoney(totals.ingreso)}</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Egresos</p>
          <p className="mt-1 text-lg font-semibold text-rose-500 sm:text-2xl">{formatMoney(totals.egreso)}</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Balance neto</p>
          <p className={`mt-1 text-lg font-semibold sm:text-2xl ${totals.balance >= 0 ? "text-foreground" : "text-rose-500"}`}>
            {formatMoney(totals.balance)}
          </p>
        </article>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-3 sm:p-4 lg:col-span-2">
          <p className="mb-3 text-sm font-medium text-foreground">Evolución mensual (últimos 6)</p>
          <div className="h-[220px] sm:h-[280px]">
            {monthlySeries.length > 0 ? (
              <Line data={lineData} options={lineOptions} />
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos para la gráfica aún.</p>
            )}
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-card p-3 sm:p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Distribución por tipo</p>
          <div className="mx-auto max-w-[220px] sm:max-w-[260px]">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </article>
      </div>

      {/* Análisis */}
      <article className="rounded-2xl border border-border bg-card p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-foreground">Análisis rápido</h3>
        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
          <p>
            {totals.balance >= 0
              ? `Tu balance neto es positivo en ${formatMoney(totals.balance)}.`
              : `Tu balance neto es negativo en ${formatMoney(Math.abs(totals.balance))}.`}
          </p>
          <p>
            {filtered.length > 0
              ? `Se analizaron ${filtered.length} transacciones para este dashboard.`
              : "No hay transacciones en el rango seleccionado."}
          </p>
        </div>
      </article>
    </section>
  );
}
