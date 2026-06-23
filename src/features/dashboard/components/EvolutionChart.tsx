"use client";

import { useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import { LineChart, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { EvolutionPoint } from "../utils/dashboard.utils";
import {
  CHART_EXPENSE,
  CHART_EXPENSE_FILL,
  CHART_MINT,
  CHART_MINT_FILL,
  DASHBOARD_CARD,
} from "../utils/dashboard.utils";
import {
  applySavviChartDefaults,
  formatChartCurrency,
  savviChartTitle,
  savviLegend,
  savviScaleX,
  savviScaleY,
  savviTooltip,
  verticalBarGradient,
} from "../utils/chartTheme";
import DashboardSectionHeading from "./DashboardSectionHeading";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin,
);

applySavviChartDefaults();

interface EvolutionChartProps {
  data: EvolutionPoint[];
}

export default function EvolutionChart({ data }: EvolutionChartProps) {
  const chartRef = useRef<ChartJS<"bar", number[], string> | null>(null);
  const [scaleType, setScaleType] = useState<"linear" | "logarithmic">("linear");

  const chartData = useMemo<ChartData<"bar", number[], string>>(
    () => ({
      labels: data.map((d) => d.label),
      datasets: [
        {
          label: "Ingresos",
          data: data.map((d) =>
            scaleType === "logarithmic" ? Math.max(d.ingresos, 1) : d.ingresos,
          ),
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            return verticalBarGradient(
              chart.ctx,
              chart.chartArea,
              "rgba(0, 196, 154, 0.92)",
              "rgba(0, 196, 154, 0.28)",
              CHART_MINT_FILL,
            );
          },
          hoverBackgroundColor: "rgba(0, 196, 154, 1)",
          borderColor: CHART_MINT,
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 36,
        },
        {
          label: "Gastos",
          data: data.map((d) =>
            scaleType === "logarithmic" ? Math.max(d.gastos, 1) : d.gastos,
          ),
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            return verticalBarGradient(
              chart.ctx,
              chart.chartArea,
              "rgba(244, 63, 94, 0.9)",
              "rgba(244, 63, 94, 0.22)",
              CHART_EXPENSE_FILL,
            );
          },
          hoverBackgroundColor: "rgba(244, 63, 94, 1)",
          borderColor: CHART_EXPENSE,
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 36,
        },
      ],
    }),
    [data, scaleType],
  );

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animations: {
        colors: false,
      },
      layout: { padding: { top: 4, right: 8, bottom: 0, left: 4 } },
      datasets: {
        bar: {
          barPercentage: 0.72,
          categoryPercentage: 0.78,
        },
      },
      plugins: {
        legend: savviLegend("top"),
        title: savviChartTitle("Ingresos vs. gastos"),
        tooltip: savviTooltip((ctx) => {
          const value = ctx.parsed.y ?? 0;
          return ` ${ctx.dataset.label}: ${formatChartCurrency(value)}`;
        }),
        zoom: {
          pan: { enabled: true, mode: "x", modifierKey: "shift" },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            drag: {
              enabled: true,
              backgroundColor: "rgba(0, 196, 154, 0.1)",
              borderColor: "rgba(0, 196, 154, 0.45)",
              borderWidth: 1,
            },
            mode: "x",
          },
        },
      },
      scales: {
        x: {
          ...savviScaleX({ hideGrid: true }),
          stacked: false,
        },
        y: {
          ...savviScaleY({
            type: scaleType,
            beginAtZero: scaleType === "linear",
            min: scaleType === "logarithmic" ? 1 : 0,
            currencyTicks: true,
          }),
        },
      },
    }),
    [scaleType],
  );

  const resetView = () => {
    const chart = chartRef.current as (ChartJS<"bar"> & { resetZoom?: () => void }) | null;
    chart?.resetZoom?.();
  };

  const zoomIn = () => {
    const chart = chartRef.current as (ChartJS<"bar"> & { zoom?: (n: number) => void }) | null;
    chart?.zoom?.(1.2);
  };

  const zoomOut = () => {
    const chart = chartRef.current as (ChartJS<"bar"> & { zoom?: (n: number) => void }) | null;
    chart?.zoom?.(0.8);
  };

  const toolBtn =
    "inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:border-mint/40 hover:bg-mint/5";

  return (
    <section>
      <DashboardSectionHeading
        title="Evolución en el tiempo"
        description="Comparativa de ingresos y gastos del periodo seleccionado"
        icon={LineChart}
      />
      <div className={`${DASHBOARD_CARD} p-4 sm:p-5`}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Escala</label>
          <select
            value={scaleType}
            onChange={(e) => setScaleType(e.target.value as "linear" | "logarithmic")}
            className="rounded-lg border border-gray-200 bg-gray-50/80 px-2 py-1.5 text-xs font-medium text-[#0B1829] focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
          >
            <option value="linear">Lineal</option>
            <option value="logarithmic">Logarítmica</option>
          </select>
          <button type="button" onClick={zoomIn} className={toolBtn}>
            <ZoomIn className="h-3.5 w-3.5" aria-hidden />
            Acercar
          </button>
          <button type="button" onClick={zoomOut} className={toolBtn}>
            <ZoomOut className="h-3.5 w-3.5" aria-hidden />
            Alejar
          </button>
          <button type="button" onClick={resetView} className={toolBtn}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Restablecer
          </button>
          <span className="ml-auto hidden text-[11px] text-gray-400 sm:inline">
            Rueda: zoom · Arrastrar: selección · Shift+arrastrar: desplazar
          </span>
        </div>
        <div className="h-[320px] w-full">
          <Bar ref={chartRef} data={chartData} options={options} />
        </div>
      </div>
    </section>
  );
}
