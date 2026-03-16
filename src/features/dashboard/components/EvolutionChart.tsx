"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { EvolutionPoint } from "../utils/dashboard.utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EvolutionChartProps {
  data: EvolutionPoint[];
}

export default function EvolutionChart({ data }: EvolutionChartProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Ingresos",
        data: data.map((d) => d.ingresos),
        backgroundColor: "rgba(16, 185, 129, 0.6)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1,
      },
      {
        label: "Gastos",
        data: data.map((d) => d.gastos),
        backgroundColor: "rgba(244, 63, 94, 0.6)",
        borderColor: "rgb(244, 63, 94)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Evolución en el tiempo",
        font: { size: 16 },
      },
    },
    scales: {
      y: {
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

  return (
    <div className="h-[280px] rounded-2xl border border-slate-200/60 bg-white p-4 shadow-lg shadow-slate-200/30">
      <Bar data={chartData} options={options} />
    </div>
  );
}
