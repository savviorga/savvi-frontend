"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArcElement, Chart as ChartJS, Tooltip, type ChartData, type ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import AnimatedMoney from "./AnimatedMoney";
import { applySavviChartDefaults, savviTooltip } from "../utils/chartTheme";
import { CATEGORY_CHART_COLORS, formatMoney, type CategoryAmount } from "../utils/dashboard.utils";

ChartJS.register(ArcElement, Tooltip);
applySavviChartDefaults();

/** Categorías con nombre propio; el resto se junta en "Otras". */
const TOP = 5;
const OTHERS_COLOR = "#CBD5E1";

interface Slice {
  id: string;
  name: string;
  total: number;
  color: string;
}

/** En qué se va el dinero: dona con el total al centro y ranking con barras. */
export default function CategoryDonut({
  data,
  categories,
}: {
  data: CategoryAmount[];
  categories: { id: string; name: string; color?: string }[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const slices: Slice[] = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const head = data.slice(0, TOP).map((d, i) => ({
      id: d.categoryId,
      name: byId.get(d.categoryId)?.name ?? "Sin categoría",
      total: d.total,
      color: byId.get(d.categoryId)?.color ?? CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length],
    }));
    const rest = data.slice(TOP).reduce((sum, d) => sum + d.total, 0);
    return rest > 0 ? [...head, { id: "others", name: "Otras", total: rest, color: OTHERS_COLOR }] : head;
  }, [data, categories]);

  const total = slices.reduce((sum, s) => sum + s.total, 0);
  const focus = hovered !== null ? slices[hovered] : null;

  const chartData: ChartData<"doughnut"> = useMemo(
    () => ({
      labels: slices.map((s) => s.name),
      datasets: [
        {
          data: slices.map((s) => s.total),
          backgroundColor: slices.map((s) => s.color),
          borderWidth: 0,
          spacing: 3,
          borderRadius: 6,
          hoverOffset: 8,
        },
      ],
    }),
    [slices],
  );

  const options: ChartOptions<"doughnut"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "76%",
      layout: { padding: 8 },
      animation: { animateRotate: true, animateScale: true, duration: 1100, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: savviTooltip((item) => ` ${item.label}: ${formatMoney(Number(item.raw) || 0)}`),
      },
      onHover: (_event, elements) => setHovered(elements.length ? elements[0].index : null),
    }),
    [],
  );

  return (
    <section
      className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-500"
      style={{ animationDelay: "460ms" }}
    >
      <div className="mb-4">
        <h2 className="text-base font-bold text-[#0B1829]">¿En qué se va tu dinero?</h2>
        <p className="text-xs text-gray-500">Gastos por categoría del periodo</p>
      </div>

      {slices.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl bg-gray-50 text-center">
          <p className="text-sm text-gray-500">Aún no hay gastos en este periodo.</p>
          <Link
            href="/transactions"
            className="rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-cosmos shadow-sm transition hover:bg-mint-dim"
          >
            Registrar un gasto
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="relative h-48 w-48 shrink-0">
            <Doughnut data={chartData} options={options} aria-label="Gráfico de gastos por categoría" role="img" />
            {/* Centro: total, o la categoría que se señala */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="max-w-[7.5rem] truncate text-[11px] font-medium text-gray-500">
                {focus ? focus.name : "Total gastos"}
              </span>
              {focus ? (
                <span key={focus.id} className="text-lg font-bold text-[#0B1829] motion-safe:animate-in motion-safe:zoom-in-90">
                  {Math.round((focus.total / total) * 100)}%
                </span>
              ) : (
                <AnimatedMoney value={total} className="text-base font-bold text-[#0B1829]" />
              )}
            </div>
          </div>

          <ul className="w-full min-w-0 flex-1 space-y-3">
            {slices.map((s, i) => {
              const share = total > 0 ? (s.total / total) * 100 : 0;
              return (
                <li
                  key={s.id}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    "rounded-xl transition-opacity duration-200",
                    hovered !== null && hovered !== i && "opacity-45",
                  )}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                      <span className="truncate font-medium text-[#0B1829]">{s.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-gray-600">
                      {formatMoney(s.total)} <span className="text-xs text-gray-400">· {Math.round(share)}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="savvi-grow-x h-full rounded-full"
                      style={{ width: `${share}%`, backgroundColor: s.color, animationDelay: `${500 + i * 80}ms` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
