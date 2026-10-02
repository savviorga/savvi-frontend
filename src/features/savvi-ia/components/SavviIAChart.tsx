"use client";

import { useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartEvent,
  type ActiveElement,
  type Plugin,
  type TooltipItem,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { AlertTriangle, CheckCircle2, Table2, TrendingUp } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { formatMoney } from "@/features/dashboard/utils/dashboard.utils";
import {
  applySavviChartDefaults,
  formatChartAxisTick,
  savviLegend,
  savviScaleX,
  savviScaleY,
  savviTooltip,
} from "@/features/dashboard/utils/chartTheme";
import type { AdvisorChart, AdvisorValueFormat } from "../types/proposal.types";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);
applySavviChartDefaults();

/**
 * Orden categórico fijo del chat (validado con el script de dataviz: CVD y
 * visión normal pasan en tema claro). Nunca se recicla: la dona agrupa en "Otros".
 */
const SERIES_COLORS = ["#00A884", "#6366F1", "#EA580C", "#C026D3", "#CA8A04", "#0284C7"];

/** Clases fijas: Tailwind no genera clases armadas en tiempo de ejecución. */
const TILE_COLUMNS: Record<number, string> = { 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" };

const withAlpha =(hex: string, alpha: number) => `${hex}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;

function formatValue(value: number, format: AdvisorValueFormat) {
  if (format === "porcentaje") return `${Math.round(value * 10) / 10}%`;
  if (format === "numero") return Math.round(value).toLocaleString("es-CO");
  return formatMoney(value);
}

function axisTick(value: unknown, format: AdvisorValueFormat) {
  if (format === "moneda") return formatChartAxisTick(value);
  return formatValue(Number(value), format);
}

interface SavviIAChartProps {
  chart: AdvisorChart;
  /** Tocar una barra, porción o tarjeta le pregunta al asesor por ese dato */
  onAsk?: (question: string) => void;
}

/** Retraso escalonado solo en la entrada: las barras crecen una tras otra. */
const staggered = {
  delay: (ctx: { type: string; mode: string; dataIndex: number; datasetIndex: number }) =>
    ctx.type === "data" && ctx.mode === "default" ? ctx.dataIndex * 70 + ctx.datasetIndex * 40 : 0,
};

function pointerOnHover(event: ChartEvent, elements: ActiveElement[]) {
  const target = event.native?.target as HTMLElement | undefined;
  if (target) target.style.cursor = elements.length ? "pointer" : "default";
}

function CartesianChart({ chart, onAsk }: SavviIAChartProps) {
  const horizontal = chart.type === "barras_horizontales";
  const multi = chart.series.length > 1;
  const ask = (index: number) => onAsk?.(`Cuéntame más sobre ${chart.labels[index]} (${chart.title})`);

  const tooltip = savviTooltip((item: TooltipItem<"bar" | "line" | "doughnut">) => {
    const raw = horizontal ? item.parsed.x : item.parsed.y;
    return `${item.dataset.label}: ${formatValue(Number(raw), chart.format)}`;
  });

  const valueScale = {
    ...savviScaleY({ currencyTicks: false }),
    ticks: { ...savviScaleY({ currencyTicks: false }).ticks, callback: (v: unknown) => axisTick(v, chart.format) },
  };

  const common = {
    responsive: true,
    maintainAspectRatio: false,
    animation: staggered,
    onHover: pointerOnHover,
    onClick: (_: ChartEvent, elements: ActiveElement[]) => elements[0] && ask(elements[0].index),
    plugins: {
      legend: multi ? savviLegend("top") : { display: false },
      tooltip,
    },
  };

  if (chart.type === "linea") {
    return (
      <div className="h-[220px]">
        <Line
          data={{
            labels: chart.labels,
            datasets: chart.series.map((s, i) => ({
              label: s.name,
              data: s.values,
              borderColor: SERIES_COLORS[i],
              backgroundColor: withAlpha(SERIES_COLORS[i], 0.1),
              fill: !multi,
              borderWidth: 2,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointHitRadius: 14,
              pointBackgroundColor: SERIES_COLORS[i],
              pointBorderColor: "#FFFFFF",
              pointBorderWidth: 2,
            })),
          }}
          options={{ ...common, scales: { x: savviScaleX({ hideGrid: false }), y: valueScale } }}
        />
      </div>
    );
  }

  const height = horizontal ? Math.max(160, chart.labels.length * 36 + 40) : 220;
  return (
    <div style={{ height }}>
      <Bar
        data={{
          labels: chart.labels,
          datasets: chart.series.map((s, i) => ({
            label: s.name,
            data: s.values,
            backgroundColor: SERIES_COLORS[i],
            hoverBackgroundColor: withAlpha(SERIES_COLORS[i], 0.85),
            borderRadius: 4,
            borderSkipped: "start" as const,
            maxBarThickness: 24,
            categoryPercentage: 0.7,
            barPercentage: multi ? 0.9 : 0.8,
          })),
        }}
        options={{
          ...common,
          indexAxis: horizontal ? "y" : "x",
          interaction: { mode: "index", intersect: false, axis: horizontal ? "y" : "x" },
          scales: horizontal
            ? { x: { ...valueScale, grid: { ...valueScale.grid } }, y: { ...savviScaleX({ hideGrid: false }), grid: { display: false } } }
            : { x: { ...savviScaleX({ hideGrid: false }), grid: { display: false } }, y: valueScale },
        }}
      />
    </div>
  );
}

function DoughnutChart({ chart, onAsk }: SavviIAChartProps) {
  const values = chart.series[0].values;
  const total = values.reduce((sum, v) => sum + v, 0);
  const ask = (index: number) => onAsk?.(`Cuéntame más sobre ${chart.labels[index]} (${chart.title})`);

  const centerText: Plugin<"doughnut"> = useMemo(
    () => ({
      id: "savviIACenter",
      afterDraw(instance) {
        const arc = instance.getDatasetMeta(0).data[0] as unknown as { x: number; y: number } | undefined;
        if (!arc) return;
        const { ctx } = instance;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#64748B";
        ctx.font = "500 11px var(--font-geist-sans), system-ui, sans-serif";
        ctx.fillText("Total", arc.x, arc.y - 11);
        ctx.fillStyle = "#0B1829";
        ctx.font = "700 14px var(--font-geist-sans), system-ui, sans-serif";
        ctx.fillText(formatValue(total, chart.format), arc.x, arc.y + 8);
        ctx.restore();
      },
    }),
    [total, chart.format],
  );

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="h-[180px] w-[180px] shrink-0">
        <Doughnut
          data={{
            labels: chart.labels,
            datasets: [
              {
                data: values,
                backgroundColor: chart.labels.map((_, i) => SERIES_COLORS[i]),
                borderWidth: 0,
                spacing: 2,
                hoverOffset: 6,
              },
            ],
          }}
          plugins={[centerText]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            animation: { animateRotate: true, duration: 900 },
            interaction: { mode: "nearest", intersect: true },
            onHover: pointerOnHover,
            onClick: (_, elements) => elements[0] && ask(elements[0].index),
            plugins: {
              legend: { display: false },
              tooltip: savviTooltip((item) => `${item.label}: ${formatValue(Number(item.raw), chart.format)}`),
            },
          }}
        />
      </div>

      {/* Leyenda con valor y porcentaje: la identidad nunca depende solo del color */}
      <ul className="w-full min-w-0 space-y-1">
        {chart.labels.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => ask(i)}
              disabled={!onAsk}
              className="savvi-msg-in flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs transition-colors hover:bg-slate-50 disabled:hover:bg-transparent"
              style={{ animationDelay: `${0.2 + i * 0.06}s` }}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: SERIES_COLORS[i] }} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-slate-700">{label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-800">{formatValue(values[i], chart.format)}</span>
              <span className="w-9 shrink-0 text-right tabular-nums text-slate-400">
                {total > 0 ? `${Math.round((values[i] / total) * 100)}%` : "—"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressChart({ chart, onAsk }: SavviIAChartProps) {
  const [spent, limit] = chart.series;

  return (
    <ul className="space-y-3">
      {chart.labels.map((label, i) => {
        const used = spent.values[i];
        const cap = limit.values[i];
        const pct = cap > 0 ? (used / cap) * 100 : 0;
        const state = pct > 100 ? "over" : pct >= 80 ? "near" : "ok";
        const tone = {
          ok: { bar: "bg-emerald-500", track: "bg-emerald-100", text: "text-emerald-700", label: "Vas bien", Icon: CheckCircle2 },
          near: { bar: "bg-amber-500", track: "bg-amber-100", text: "text-amber-700", label: "Cerca del límite", Icon: AlertTriangle },
          over: { bar: "bg-rose-500", track: "bg-rose-100", text: "text-rose-700", label: "Excedido", Icon: AlertTriangle },
        }[state];

        return (
          <li key={label} className="savvi-msg-in" style={{ animationDelay: `${i * 0.07}s` }}>
            <button
              type="button"
              onClick={() => onAsk?.(`¿Qué hago con mi presupuesto de ${label}?`)}
              disabled={!onAsk}
              className="group w-full rounded-lg text-left"
            >
              <span className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate font-medium text-slate-800 group-hover:text-emerald-700">{label}</span>
                <span className="shrink-0 tabular-nums text-slate-500">
                  <span className="font-semibold text-slate-800">{formatValue(used, chart.format)}</span> de{" "}
                  {formatValue(cap, chart.format)}
                </span>
              </span>
              <span className={`mt-1.5 block h-2 overflow-hidden rounded-full ${tone.track}`}>
                <span
                  className={`savvi-profile-fill block h-full rounded-full ${tone.bar}`}
                  style={{ width: `${Math.min(pct, 100)}%`, animationDelay: `${0.15 + i * 0.07}s` }}
                />
              </span>
              <span className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${tone.text}`}>
                <tone.Icon className="h-3 w-3" aria-hidden />
                {tone.label} · {Math.round(pct)}%
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Indicator({ label, value, format, index, onAsk }: {
  label: string;
  value: number;
  format: AdvisorValueFormat;
  index: number;
  onAsk?: (question: string) => void;
}) {
  const animated = useCountUp(value, 1100, 150 + index * 90);
  return (
    <button
      type="button"
      onClick={() => onAsk?.(`Cuéntame más sobre ${label}`)}
      disabled={!onAsk}
      className="savvi-msg-in group rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-sm disabled:hover:translate-y-0"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <span className="block truncate text-[11px] font-medium text-slate-500">{label}</span>
      <span className={`mt-1 block truncate text-lg font-bold tabular-nums ${value < 0 ? "text-rose-600" : "text-slate-900"}`}>
        {formatValue(animated, format)}
      </span>
    </button>
  );
}

function DataTable({ chart }: { chart: AdvisorChart }) {
  return (
    <div className="savvi-msg-in mt-3 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-3 py-2 font-semibold" />
            {chart.series.map((s) => (
              <th key={s.name} className="whitespace-nowrap px-3 py-2 text-right font-semibold">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.labels.map((label, i) => (
            <tr key={label} className="border-t border-slate-100">
              <td className="px-3 py-1.5 text-slate-700">{label}</td>
              {chart.series.map((s) => (
                <td key={s.name} className="px-3 py-1.5 text-right tabular-nums text-slate-800">
                  {formatValue(s.values[i], chart.format)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SavviIAChart({ chart, onAsk }: SavviIAChartProps) {
  const [showTable, setShowTable] = useState(false);
  const isTiles = chart.type === "indicadores";

  return (
    <figure className="savvi-msg-in mt-3 w-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <figcaption className="mb-3 flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900">{chart.title}</span>
            {chart.subtitle && <span className="block text-xs text-slate-500">{chart.subtitle}</span>}
          </span>
        </span>
        {!isTiles && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-pressed={showTable}
          >
            <Table2 className="h-3.5 w-3.5" aria-hidden />
            {showTable ? "Ocultar datos" : "Ver datos"}
          </button>
        )}
      </figcaption>

      {chart.type === "indicadores" ? (
        <div className={`grid grid-cols-2 gap-2 ${TILE_COLUMNS[Math.min(chart.labels.length, 4)] ?? ""}`}>
          {chart.labels.map((label, i) => (
            <Indicator key={label} label={label} value={chart.series[0].values[i]} format={chart.format} index={i} onAsk={onAsk} />
          ))}
        </div>
      ) : chart.type === "progreso" ? (
        <ProgressChart chart={chart} onAsk={onAsk} />
      ) : chart.type === "dona" ? (
        <DoughnutChart chart={chart} onAsk={onAsk} />
      ) : (
        <CartesianChart chart={chart} onAsk={onAsk} />
      )}

      {showTable && <DataTable chart={chart} />}
      {onAsk && chart.type !== "progreso" && chart.type !== "indicadores" && (
        <p className="mt-2 text-[11px] text-slate-400">Toca un dato para preguntarme por él.</p>
      )}
    </figure>
  );
}
