"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { PieChart } from "lucide-react";
import type { CategoryAmount } from "../utils/dashboard.utils";
import {
  CATEGORY_CHART_COLORS,
  DASHBOARD_CARD,
  formatMoney,
} from "../utils/dashboard.utils";
import {
  applySavviChartDefaults,
  doughnutCenterTextPlugin,
  formatChartAxisTick,
  horizontalBarGradient,
  savviChartTitle,
  savviLegend,
  savviScaleX,
  savviTooltip,
} from "../utils/chartTheme";
import DashboardSectionHeading from "./DashboardSectionHeading";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  doughnutCenterTextPlugin,
);

applySavviChartDefaults();

function toRgba(rgb: string, alpha: number): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;
  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
}

interface ExpensesByCategoryChartProps {
  data: CategoryAmount[];
  categoryNames: Record<string, string>;
}

export default function ExpensesByCategoryChart({
  data,
  categoryNames,
}: ExpensesByCategoryChartProps) {
  const labels = useMemo(
    () => data.map((d) => categoryNames[d.categoryId] ?? d.categoryId),
    [data, categoryNames],
  );
  const values = useMemo(() => data.map((d) => d.total), [data]);
  const total = useMemo(() => values.reduce((s, v) => s + v, 0), [values]);

  const backgroundColors = useMemo(
    () => data.map((_, i) => CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length]),
    [data],
  );

  const barData = useMemo<ChartData<"bar">>(
    () => ({
      labels,
      datasets: [
        {
          label: "Gastos",
          data: values,
          backgroundColor: (ctx) => {
            const base = backgroundColors[ctx.dataIndex] ?? CATEGORY_CHART_COLORS[0];
            const { chart } = ctx;
            return horizontalBarGradient(
              chart.ctx,
              chart.chartArea,
              toRgba(base, 0.45),
              toRgba(base, 0.95),
              toRgba(base, 0.8),
            );
          },
          hoverBackgroundColor: (ctx) =>
            backgroundColors[ctx.dataIndex] ?? CATEGORY_CHART_COLORS[0],
          borderColor: "transparent",
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: labels.length > 10 ? 18 : 22,
        },
      ],
    }),
    [labels, values, backgroundColors],
  );

  const doughnutData = useMemo<ChartData<"doughnut">>(
    () => ({
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: backgroundColors.map((c) => toRgba(c, 0.88)),
          hoverBackgroundColor: backgroundColors,
          borderColor: "#FFFFFF",
          borderWidth: 3,
          hoverBorderColor: "#FFFFFF",
          hoverOffset: 10,
          spacing: 3,
          borderRadius: 6,
        },
      ],
    }),
    [labels, values, backgroundColors],
  );

  const maxValue = useMemo(() => Math.max(...values, 0), [values]);
  const barChartHeight = useMemo(
    () => Math.max(320, labels.length * 36 + 72),
    [labels.length],
  );

  const barOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      layout: { padding: { top: 4, right: 16, bottom: 4, left: 0 } },
      datasets: {
        bar: {
          barPercentage: 0.82,
          categoryPercentage: 0.88,
        },
      },
      plugins: {
        legend: { display: false },
        title: savviChartTitle("Por categoría"),
        tooltip: savviTooltip((ctx) => {
          const value = ctx.parsed.x ?? 0;
          const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
          return ` ${ctx.label}: ${formatMoney(value)} (${pct}%)`;
        }),
      },
      scales: {
        x: {
          type: "linear",
          beginAtZero: true,
          suggestedMax: maxValue > 0 ? maxValue * 1.08 : undefined,
          grid: { color: "rgba(11, 24, 41, 0.06)", drawTicks: false },
          border: { display: false },
          ticks: {
            color: "#9CA3AF",
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 5,
            padding: 6,
            callback: (value) => formatChartAxisTick(value),
          },
        },
        y: {
          ...savviScaleX({ hideGrid: true }),
          ticks: {
            color: "#374151",
            font: { size: 11, weight: "normal" },
            padding: 8,
            autoSkip: false,
            callback(_value, index) {
              const label = labels[index] ?? "";
              return label.length > 22 ? `${label.slice(0, 20)}…` : label;
            },
          },
        },
      },
    }),
    [total, labels, maxValue],
  );

  const doughnutOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      layout: { padding: 8 },
      plugins: {
        legend: savviLegend(labels.length > 6 ? "bottom" : "right"),
        title: savviChartTitle("Distribución"),
        tooltip: savviTooltip((ctx) => {
          const value = Number(ctx.raw) || 0;
          const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
          return ` ${ctx.label}: ${formatMoney(value)} (${pct}%)`;
        }),
      },
    }),
    [total, labels.length],
  );

  if (data.length === 0) {
    return (
      <section>
        <DashboardSectionHeading
          title="Gastos por categoría"
          description="Desglose de egresos del periodo"
          icon={PieChart}
        />
        <div className={`${DASHBOARD_CARD} p-8 text-center`}>
          <PieChart className="mx-auto h-10 w-10 text-gray-300" aria-hidden />
          <p className="mt-3 text-sm text-gray-500">
            No hay gastos registrados en este periodo.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <DashboardSectionHeading
        title="Gastos por categoría"
        description="Desglose y proporción de tus egresos"
        icon={PieChart}
      />
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div
          className={`${DASHBOARD_CARD} p-4 sm:p-5`}
          style={{ minHeight: barChartHeight }}
        >
          <div style={{ height: barChartHeight - 40 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
        <div className={`${DASHBOARD_CARD} flex min-h-[320px] flex-col p-4 sm:min-h-[400px] sm:p-5`}>
          <div className="relative h-[320px] sm:h-[360px]">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </section>
  );
}
