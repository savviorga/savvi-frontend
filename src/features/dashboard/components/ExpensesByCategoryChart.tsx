"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import type { CategoryAmount } from "../utils/dashboard.utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const COLORS = [
  "rgb(16, 185, 129)",
  "rgb(6, 182, 212)",
  "rgb(139, 92, 246)",
  "rgb(244, 63, 94)",
  "rgb(251, 146, 60)",
  "rgb(234, 179, 8)",
  "rgb(99, 102, 241)",
  "rgb(236, 72, 153)",
];

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
  const labels = data.map((d) => categoryNames[d.categoryId] ?? d.categoryId);
  const values = data.map((d) => d.total);
  const backgroundColors = data.map((_, i) => COLORS[i % COLORS.length]);

  const barData = {
    labels,
    datasets: [
      {
        label: "Gastos ($)",
        data: values,
        backgroundColor: backgroundColors.map((c) => toRgba(c, 0.7)),
        borderColor: backgroundColors,
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors.map((c) => toRgba(c, 0.8)),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Gastos por categoría",
        font: { size: 16 },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
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
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const },
      title: {
        display: true,
        text: "Distribución por categoría",
        font: { size: 16 },
      },
    },
  };

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-slate-200/30">
        <h3 className="text-lg font-semibold text-slate-700">Gastos por categoría</h3>
        <p className="mt-4 text-slate-500">No hay gastos en este periodo.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-[320px] rounded-2xl border border-slate-200/60 bg-white p-4 shadow-lg shadow-slate-200/30">
        <Bar data={barData} options={barOptions} />
      </div>
      <div className="h-[320px] rounded-2xl border border-slate-200/60 bg-white p-4 shadow-lg shadow-slate-200/30">
        <Doughnut data={doughnutData} options={doughnutOptions} />
      </div>
    </div>
  );
}
