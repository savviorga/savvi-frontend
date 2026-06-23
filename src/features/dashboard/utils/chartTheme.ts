import { Chart as ChartJS, type ChartOptions, type TooltipItem } from "chart.js";
import { formatMoney } from "./dashboard.utils";

/** Navy Savvi */
export const CHART_NAVY = "#0B1829";
export const CHART_MUTED = "#9CA3AF";
export const CHART_GRID = "rgba(11, 24, 41, 0.06)";

const FONT =
  'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

let defaultsApplied = false;

/** Aplica defaults globales una sola vez (tipografía, animación, interacción). */
export function applySavviChartDefaults() {
  if (defaultsApplied) return;
  defaultsApplied = true;

  ChartJS.defaults.font.family = FONT;
  ChartJS.defaults.font.size = 12;
  ChartJS.defaults.color = CHART_MUTED;
  ChartJS.defaults.animation = {
    duration: 720,
    easing: "easeOutQuart",
  };
  ChartJS.defaults.interaction = {
    mode: "index",
    intersect: false,
    axis: "x",
    includeInvisible: false,
  };
  // Los degradados scriptables (CanvasGradient) no se pueden interpolar en animación.
  ChartJS.defaults.animations.colors = false;
  ChartJS.defaults.transitions.show.animations.colors = false;
  ChartJS.defaults.transitions.hide.animations.colors = false;
}

export function formatChartCurrency(value: unknown, compactFrom = 1_000_000): string {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
    notation: safe >= compactFrom ? "compact" : "standard",
  }).format(safe);
}

/** Etiquetas de eje: evita repetir "$ 1 M" en ticks cercanos. */
export function formatChartAxisTick(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const millions = n / 1_000_000;
    const rounded =
      Math.abs(millions) >= 10
        ? Math.round(millions)
        : Math.round(millions * 10) / 10;
    return `$ ${rounded} M`;
  }
  if (abs >= 1_000) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(n);
  }
  return formatChartCurrency(n, Number.POSITIVE_INFINITY);
}

export function savviChartTitle(text: string) {
  return {
    display: true as const,
    text,
    color: CHART_NAVY,
    font: { size: 13, weight: "bold" as const, family: FONT },
    padding: { top: 0, bottom: 16 },
  };
}

export function savviLegend(position: "top" | "bottom" | "right" = "top") {
  return {
    position,
    align: "end" as const,
    labels: {
      usePointStyle: true,
      pointStyle: "circle" as const,
      boxWidth: 8,
      boxHeight: 8,
      padding: 18,
      color: CHART_NAVY,
      font: { size: 12, weight: "normal" as const, family: FONT },
    },
  };
}

export function savviTooltip(
  labelFormatter?: (item: TooltipItem<"bar" | "line" | "doughnut">) => string,
) {
  return {
    backgroundColor: CHART_NAVY,
    titleColor: "#E5E7EB",
    bodyColor: "#FFFFFF",
    footerColor: "#9CA3AF",
    borderColor: "rgba(0, 196, 154, 0.35)",
    borderWidth: 1,
    cornerRadius: 10,
    padding: 12,
    boxPadding: 6,
    displayColors: true,
    usePointStyle: true,
    titleFont: { size: 12, weight: "bold" as const, family: FONT },
    bodyFont: { size: 13, weight: "bold" as const, family: FONT },
    footerFont: { size: 11, family: FONT },
    callbacks: labelFormatter
      ? {
          label: (ctx: TooltipItem<"bar" | "line" | "doughnut">) =>
            labelFormatter(ctx),
        }
      : {
          label: (ctx: TooltipItem<"bar" | "line" | "doughnut">) => {
            const raw = ctx.parsed.y ?? ctx.parsed.x ?? ctx.parsed;
            const value =
              typeof raw === "number"
                ? raw
                : typeof raw === "object" && raw !== null && "r" in raw
                  ? (raw as { r?: number }).r
                  : Number(ctx.raw);
            return `${ctx.dataset.label ?? ctx.label}: ${formatMoney(Number(value) || 0)}`;
          },
        },
  };
}

export function savviScaleX(options?: { hideGrid?: boolean }) {
  return {
    grid: {
      display: options?.hideGrid !== false,
      color: CHART_GRID,
      drawTicks: false,
    },
    border: { display: false },
    ticks: {
      color: CHART_MUTED,
      font: { size: 11, family: FONT },
      maxRotation: 0,
      autoSkip: true,
      maxTicksLimit: 12,
    },
  };
}

export function savviScaleY(options?: {
  type?: "linear" | "logarithmic";
  beginAtZero?: boolean;
  min?: number;
  currencyTicks?: boolean;
}) {
  return {
    type: options?.type ?? "linear",
    beginAtZero: options?.beginAtZero ?? true,
    min: options?.min,
    grid: {
      color: CHART_GRID,
      drawTicks: false,
    },
    border: { display: false },
    ticks: {
      color: CHART_MUTED,
      font: { size: 11, family: FONT },
      padding: 8,
      ...(options?.currencyTicks !== false
        ? {
            callback: (value: unknown) => formatChartCurrency(value),
          }
        : {}),
    },
  };
}

/** Gradiente vertical (barras verticales / columnas). */
export function verticalBarGradient(
  ctx: CanvasRenderingContext2D,
  chartArea: { top: number; bottom: number } | undefined,
  topColor: string,
  bottomColor: string,
  fallback: string,
): string | CanvasGradient {
  if (!chartArea) return fallback;
  const g = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  g.addColorStop(0, bottomColor);
  g.addColorStop(1, topColor);
  return g;
}

/** Gradiente horizontal (barras horizontales). */
export function horizontalBarGradient(
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number } | undefined,
  startColor: string,
  endColor: string,
  fallback: string,
): string | CanvasGradient {
  if (!chartArea) return fallback;
  const g = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
  g.addColorStop(0, startColor);
  g.addColorStop(1, endColor);
  return g;
}

/** Total en el centro del doughnut (solo gráficos doughnut/pie). */
export const doughnutCenterTextPlugin = {
  id: "savviDoughnutCenter",
  afterDraw(chart: ChartJS) {
    const type = chart.config.type;
    if (type !== "doughnut" && type !== "pie") return;

    const dataset = chart.data.datasets[0];
    if (!dataset?.data?.length) return;

    const total = (dataset.data as number[]).reduce(
      (sum, v) => sum + (Number(v) || 0),
      0,
    );
    const meta = chart.getDatasetMeta(0);
    const el = meta.data[0] as { x: number; y: number } | undefined;
    if (!el) return;

    const { ctx } = chart;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = CHART_NAVY;
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText("Total gastos", el.x, el.y - 14);
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillStyle = "#00C49A";
    ctx.fillText(formatMoney(total), el.x, el.y + 8);
    ctx.restore();
  },
};

export type SavviBarChartOptions = ChartOptions<"bar">;
