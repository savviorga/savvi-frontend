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
import type { EvolutionPoint } from "../utils/dashboard.utils";

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
  zoomPlugin
);

interface EvolutionChartProps {
  data: EvolutionPoint[];
}

export default function EvolutionChart({ data }: EvolutionChartProps) {
  const chartRef = useRef<ChartJS<"bar", number[], string> | null>(null);
  const [scaleType, setScaleType] = useState<"linear" | "logarithmic">(
    "linear"
  );

  const chartData = useMemo<ChartData<"bar", number[], string>>(
    () => ({
      labels: data.map((d) => d.label),
      datasets: [
        {
          label: "Ingresos",
          data: data.map((d) =>
            scaleType === "logarithmic" ? Math.max(d.ingresos, 1) : d.ingresos
          ),
          backgroundColor: "rgba(16, 185, 129, 0.6)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 1,
        },
        {
          label: "Gastos",
          data: data.map((d) =>
            scaleType === "logarithmic" ? Math.max(d.gastos, 1) : d.gastos
          ),
          backgroundColor: "rgba(244, 63, 94, 0.6)",
          borderColor: "rgb(244, 63, 94)",
          borderWidth: 1,
        },
      ],
    }),
    [data, scaleType]
  );

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Evolución en el tiempo",
        font: { size: 16 },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
          modifierKey: "shift",
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          drag: {
            enabled: true,
            backgroundColor: "rgba(59, 130, 246, 0.15)",
          },
          mode: "x",
        },
      },
    },
    scales: {
      y: {
        type: scaleType,
        beginAtZero: scaleType === "linear",
        min: scaleType === "logarithmic" ? 1 : 0,
        ticks: {
          callback: (value: unknown) => {
            const n = Number(value);
            const safe = Number.isFinite(n) ? n : 0;
            return new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            }).format(safe);
          },
        },
      },
    },
  }), [scaleType]);

  const resetView = () => {
    const chart = chartRef.current as (ChartJS<"bar"> & {
      resetZoom?: () => void;
    }) | null;
    chart?.resetZoom?.();
  };

  const zoomIn = () => {
    const chart = chartRef.current as (ChartJS<"bar"> & {
      zoom?: (amount: number) => void;
    }) | null;
    chart?.zoom?.(1.2);
  };

  const zoomOut = () => {
    const chart = chartRef.current as (ChartJS<"bar"> & {
      zoom?: (amount: number) => void;
    }) | null;
    chart?.zoom?.(0.8);
  };

  return (
    <div className="h-[280px] rounded-2xl border border-slate-200/60 bg-white p-4 shadow-lg shadow-slate-200/30">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium text-slate-600">Escala:</label>
        <select
          value={scaleType}
          onChange={(e) =>
            setScaleType(e.target.value as "linear" | "logarithmic")
          }
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
        >
          <option value="linear">Lineal</option>
          <option value="logarithmic">Logarítmica</option>
        </select>
        <button
          type="button"
          onClick={zoomIn}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
        >
          Zoom +
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
        >
          Zoom -
        </button>
        <button
          type="button"
          onClick={resetView}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
        >
          Reset vista
        </button>
        <span className="text-[11px] text-slate-500">
          Scroll para zoom, arrastre para seleccionar, Shift+drag para mover.
        </span>
      </div>
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
