"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import SavvySelect from "@/components/Select/Select";
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
import type { Category } from "@/features/transactions/types/catalog.types";
import MobileReportView from "./MobileReportView";

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
  categories?: Category[];
};

const PRESET_OPTIONS = [
  { label: "Hoy", value: "today" },
  { label: "Ayer", value: "yesterday" },
  { label: "Este mes", value: "month" },
  { label: "Todo", value: "all" },
];

export default function ReportTransactions({ transactions, categories = [] }: ReportTransactionsProps) {
  const [fromDate, setFromDate] = useState(todayISO);
  const [toDate, setToDate] = useState(todayISO);
  const [preset, setPreset] = useState("today");

  const applyPreset = (value: string) => {
    setPreset(value);
    switch (value) {
      case "today":
        setFromDate(todayISO());
        setToDate(todayISO());
        break;
      case "yesterday": {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const iso = y.toISOString().slice(0, 10);
        setFromDate(iso);
        setToDate(iso);
        break;
      }
      case "month": {
        const now = new Date();
        setFromDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
        setToDate(todayISO());
        break;
      }
      case "all": {
        const dates = transactions.map((t) => t.date).filter(Boolean).sort();
        if (dates.length) {
          setFromDate(dates[0]);
          setToDate(dates[dates.length - 1]);
        }
        break;
      }
    }
  };

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

  const isSingleDay = fromDate === toDate;

  const heatmapDays = useMemo(() => {
    const days: { iso: string; label: string; dayNum: number; weekday: string; total: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTotals = new Map<string, number>();
    for (const tx of transactions) {
      const d = tx.date?.slice(0, 10) ?? "";
      if (!d) continue;
      dailyTotals.set(d, (dailyTotals.get(d) ?? 0) + Number(tx.amount || 0));
    }

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({
        iso,
        label: format(d, "d MMM", { locale: es }),
        dayNum: d.getDate(),
        weekday: format(d, "EEE", { locale: es }),
        total: dailyTotals.get(iso) ?? 0,
      });
    }
    return days;
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const grouped = new Map<string, { amount: number; type: string }>();
    for (const tx of filtered) {
      const cat = tx.category || "Sin categoría";
      const prev = grouped.get(cat);
      grouped.set(cat, {
        amount: (prev?.amount ?? 0) + Number(tx.amount || 0),
        type: prev?.type ?? tx.type,
      });
    }
    return Array.from(grouped.entries())
      .map(([name, { amount, type }]) => ({ name, amount, type }))
      .sort((a, b) => b.amount - a.amount);
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
    <>
    <MobileReportView transactions={transactions} categories={categories} />

    {/* Legacy desktop view — hidden, kept for reference */}
    <section className="hidden space-y-5" style={{ display: "none" }}>
      {/* Filtro por fecha */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <SavvySelect
            label="Período"
            value={preset}
            onChange={applyPreset}
            placeholder="Seleccionar período"
            options={PRESET_OPTIONS}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPreset(""); }}
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-[#00C49A] focus:ring-2 focus:ring-[#00C49A]/25"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPreset(""); }}
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-[#00C49A] focus:ring-2 focus:ring-[#00C49A]/25"
            />
          </div>

          <p className="flex h-10 items-center text-xs text-muted-foreground">
            {filtered.length} de {transactions.length}
          </p>
        </div>
      </div>

      {/* Heatmap semanal */}
      <WeeklyHeatmap
        days={heatmapDays}
        selectedDate={isSingleDay ? fromDate : null}
        onDayClick={(iso) => { setFromDate(iso); setToDate(iso); setPreset(""); }}
      />

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
          <p className="mb-3 text-sm font-medium text-foreground">
            {isSingleDay ? "Detalle del día" : "Evolución mensual (últimos 6)"}
          </p>
          <div className="h-[220px] sm:h-[280px]">
            {isSingleDay ? (
              categoryBreakdown.length > 0 ? (
                <CategoryBars items={categoryBreakdown} />
              ) : (
                <p className="text-sm text-muted-foreground">No hay transacciones este día.</p>
              )
            ) : monthlySeries.length > 0 ? (
              <Line data={lineData} options={lineOptions} />
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos para la gráfica aún.</p>
            )}
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-card p-3 sm:p-4">
          <p className="mb-3 text-sm font-medium text-foreground">
            {isSingleDay ? "Resumen por tipo" : "Distribución por tipo"}
          </p>
          {isSingleDay ? (
            <TypeSummaryList totals={totals} />
          ) : (
            <div className="mx-auto max-w-[220px] sm:max-w-[260px]">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          )}
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
    </>
  );
}

/* ── Sub-componentes ── */

const HEAT_LEVELS = [
  "bg-emerald-50 text-emerald-800",
  "bg-emerald-100 text-emerald-900",
  "bg-emerald-200 text-emerald-900",
  "bg-emerald-400 text-white",
  "bg-emerald-600 text-white",
];

function getHeatLevel(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted/40 text-muted-foreground";
  const ratio = value / max;
  if (ratio <= 0.2) return HEAT_LEVELS[0];
  if (ratio <= 0.4) return HEAT_LEVELS[1];
  if (ratio <= 0.6) return HEAT_LEVELS[2];
  if (ratio <= 0.8) return HEAT_LEVELS[3];
  return HEAT_LEVELS[4];
}

function WeeklyHeatmap({
  days,
  selectedDate,
  onDayClick,
}: {
  days: { iso: string; label: string; dayNum: number; weekday: string; total: number }[];
  selectedDate: string | null;
  onDayClick: (iso: string) => void;
}) {
  const maxTotal = Math.max(...days.map((d) => d.total), 1);
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <article className="rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Actividad últimos 14 días</p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Menor</span>
          <span className="inline-block h-3 w-3 rounded bg-muted/40" />
          <span className="inline-block h-3 w-3 rounded bg-emerald-100" />
          <span className="inline-block h-3 w-3 rounded bg-emerald-300" />
          <span className="inline-block h-3 w-3 rounded bg-emerald-500" />
          <span>Mayor</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const isToday = day.iso === todayStr;
          const isSelected = day.iso === selectedDate;
          return (
            <button
              key={day.iso}
              type="button"
              onClick={() => onDayClick(day.iso)}
              title={`${day.label} — ${formatMoney(day.total)}`}
              className={`group relative flex flex-col items-center rounded-lg px-0.5 py-1.5 transition sm:rounded-xl sm:px-1 sm:py-2 ${getHeatLevel(day.total, maxTotal)} ${
                isSelected
                  ? "ring-2 ring-[#00C49A] ring-offset-1"
                  : "hover:ring-2 hover:ring-border hover:ring-offset-1"
              }`}
            >
              <span className="text-[10px] font-medium leading-none opacity-70 sm:text-xs">
                {day.weekday}
              </span>
              <span className={`mt-0.5 text-sm font-bold leading-none sm:text-base ${isToday && !isSelected ? "underline decoration-2 underline-offset-2" : ""}`}>
                {day.dayNum}
              </span>
              {day.total > 0 && (
                <span className="mt-1 hidden text-[9px] font-semibold leading-none opacity-80 sm:block">
                  {day.total >= 1_000_000
                    ? `${(day.total / 1_000_000).toFixed(1)}M`
                    : day.total >= 1_000
                      ? `${(day.total / 1_000).toFixed(0)}K`
                      : formatMoney(day.total)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </article>
  );
}

const TYPE_COLORS: Record<string, string> = {
  ingreso: "bg-emerald-500",
  egreso: "bg-rose-500",
  transferencia: "bg-sky-500",
};

function CategoryBars({
  items,
}: {
  items: { name: string; amount: number; type: string }[];
}) {
  const max = Math.max(...items.map((i) => i.amount), 1);

  return (
    <div className="flex h-full flex-col justify-center gap-3 overflow-y-auto pr-1">
      {items.map((item) => (
        <div key={item.name}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {item.name}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {formatMoney(item.amount)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${TYPE_COLORS[item.type] ?? "bg-slate-400"}`}
              style={{ width: `${(item.amount / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TypeSummaryList({
  totals,
}: {
  totals: { ingreso: number; egreso: number; transferencia: number; balance: number };
}) {
  const rows = [
    { label: "Ingresos", value: totals.ingreso, color: "bg-emerald-500", text: "text-emerald-600" },
    { label: "Egresos", value: totals.egreso, color: "bg-rose-500", text: "text-rose-500" },
    { label: "Transferencias", value: totals.transferencia, color: "bg-sky-500", text: "text-sky-600" },
  ];

  return (
    <div className="flex flex-col justify-center gap-4">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className={`h-3 w-3 shrink-0 rounded-full ${r.color}`} />
          <span className="flex-1 text-sm text-muted-foreground">{r.label}</span>
          <span className={`text-sm font-semibold tabular-nums ${r.text}`}>
            {formatMoney(r.value)}
          </span>
        </div>
      ))}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Balance</span>
          <span className={`text-base font-bold tabular-nums ${totals.balance >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {formatMoney(totals.balance)}
          </span>
        </div>
      </div>
    </div>
  );
}
