"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { applySavviChartDefaults, formatChartAxisTick, savviTooltip } from "../utils/chartTheme";
import { formatMoney, type EvolutionPoint } from "../utils/dashboard.utils";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip);
applySavviChartDefaults();

const MINT = "rgb(0, 196, 154)";
const ROSE = "rgb(244, 63, 94)";

/** Relleno que se desvanece hacia abajo bajo cada línea. */
function fade(color: string, alpha: number) {
  return (ctx: ScriptableContext<"line">) => {
    const { chartArea, ctx: canvas } = ctx.chart;
    if (!chartArea) return "transparent";
    const g = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`));
    g.addColorStop(1, color.replace("rgb(", "rgba(").replace(")", ", 0)"));
    return g;
  };
}

/** Ingresos vs gastos por mes, en curvas suaves y sin ruido visual. */
export default function FlowChart({ data, title }: { data: EvolutionPoint[]; title: string }) {
  const hasData = data.some((p) => p.ingresos > 0 || p.gastos > 0);

  const chartData: ChartData<"line"> = useMemo(
    () => ({
      labels: data.map((p) => p.label.charAt(0).toUpperCase() + p.label.slice(1)),
      datasets: [
        {
          label: "Ingresos",
          data: data.map((p) => p.ingresos),
          borderColor: MINT,
          backgroundColor: fade(MINT, 0.28),
          fill: "origin",
          tension: 0.42,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: MINT,
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 2,
        },
        {
          label: "Gastos",
          data: data.map((p) => p.gastos),
          borderColor: ROSE,
          backgroundColor: fade(ROSE, 0.14),
          fill: "origin",
          tension: 0.42,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: ROSE,
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 2,
        },
      ],
    }),
    [data],
  );

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1100, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: savviTooltip((item) => `${item.dataset.label}: ${formatMoney(Number(item.parsed.y) || 0)}`),
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: "#9CA3AF", font: { size: 11 }, maxRotation: 0 },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: "rgba(11, 24, 41, 0.05)", drawTicks: false },
          ticks: { color: "#9CA3AF", font: { size: 10 }, padding: 8, maxTicksLimit: 4, callback: formatChartAxisTick },
        },
      },
    }),
    [],
  );

  return (
    <section
      className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-500"
      style={{ animationDelay: "380ms" }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#0B1829]">Flujo de dinero</h2>
          <p className="text-xs text-gray-500">{title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs font-medium text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[rgb(0,196,154)]" aria-hidden />
            Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden />
            Gastos
          </span>
        </div>
      </div>
      <div className="relative h-56 sm:h-64">
        {hasData ? (
          <Line data={chartData} options={options} aria-label="Gráfico de ingresos y gastos por mes" role="img" />
        ) : (
          <p className="flex h-full items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-500">
            Cuando registres movimientos verás aquí su evolución.
          </p>
        )}
      </div>
    </section>
  );
}
