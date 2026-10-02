/**
 * Valida el gráfico que el modelo adjunta a un mensaje. Si no cumple la forma
 * (series con un valor por etiqueta, números finitos, límites de tamaño) se
 * descarta y el mensaje llega solo con texto. Solo servidor.
 */

import type {
  AdvisorChart,
  AdvisorChartType,
  AdvisorValueFormat,
} from "@/features/savvi-ia/types/proposal.types";

const TYPES: AdvisorChartType[] = ["barras", "barras_horizontales", "dona", "linea", "progreso", "indicadores"];
const FORMATS: AdvisorValueFormat[] = ["moneda", "porcentaje", "numero"];

const MAX_LABELS = 12;
const MAX_SERIES = 3;
/** Porciones de la dona; lo demás se agrupa en "Otros" (nunca se reciclan colores). */
const MAX_SLICES = 6;

const text = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

export function sanitizeChart(raw: unknown): AdvisorChart | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const source = raw as Record<string, unknown>;

  const type = TYPES.find((t) => t === source.tipo);
  const format = FORMATS.find((f) => f === source.formato) ?? "moneda";
  const title = text(source.titulo, 120);
  if (!type || !title) return undefined;

  let labels = (Array.isArray(source.etiquetas) ? source.etiquetas : [])
    .map((l) => text(l, 40) ?? "")
    .slice(0, MAX_LABELS);
  if (labels.length === 0 || labels.some((l) => !l)) return undefined;

  let series = (Array.isArray(source.series) ? source.series : [])
    .slice(0, MAX_SERIES)
    .map((s) => {
      const item = (s ?? {}) as Record<string, unknown>;
      const values = Array.isArray(item.valores) ? item.valores.slice(0, labels.length) : [];
      return { name: text(item.nombre, 40) ?? "Serie", values: values.map(Number) };
    });

  const valid = series.length > 0 && series.every((s) => s.values.length === labels.length && s.values.every(Number.isFinite));
  if (!valid) return undefined;

  if (type === "dona") {
    const values = series[0].values;
    if (values.some((v) => v < 0)) return undefined;
    series = [series[0]];
    if (labels.length > MAX_SLICES) {
      const order = values.map((v, i) => i).sort((a, b) => values[b] - values[a]);
      const keep = order.slice(0, MAX_SLICES - 1);
      const rest = order.slice(MAX_SLICES - 1).reduce((sum, i) => sum + values[i], 0);
      labels = [...keep.map((i) => labels[i]), "Otros"];
      series = [{ name: series[0].name, values: [...keep.map((i) => values[i]), rest] }];
    }
  }
  if (type === "progreso" && series.length < 2) return undefined;
  if (type === "indicadores") {
    labels = labels.slice(0, 4);
    series = [{ name: series[0].name, values: series[0].values.slice(0, 4) }];
  }

  return { type, title, subtitle: text(source.subtitulo, 120), labels, series, format };
}
