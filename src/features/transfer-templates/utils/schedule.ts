import { differenceInCalendarDays, format, parse, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import type { TransferTemplate } from "../types/transfer.types";

/** Fecha `YYYY-MM-DD` en hora local (`new Date(iso)` la toma en UTC y puede correrla un día). */
export function parseIsoDate(iso: string): Date {
  return startOfDay(parse(iso.slice(0, 10), "yyyy-MM-dd", new Date()));
}

export function formatIsoDate(iso: string, pattern = "d MMM yyyy"): string {
  return format(parseIsoDate(iso), pattern, { locale: es });
}

export function daysUntilDue(nextDueDateIso: string): number {
  return differenceInCalendarDays(parseIsoDate(nextDueDateIso), startOfDay(new Date()));
}

/** Semáforo de vencimiento: vencido o ≤ 3 días, 4–10 días, más de 10 días. */
export type DueUrgency = "critical" | "soon" | "ok";

export function getDueStatus(nextDueDateIso: string): {
  daysUntil: number;
  urgency: DueUrgency;
  label: string;
} {
  const daysUntil = daysUntilDue(nextDueDateIso);
  const urgency: DueUrgency =
    daysUntil <= 3 ? "critical" : daysUntil <= 10 ? "soon" : "ok";

  let label: string;
  if (daysUntil < 0) {
    const n = Math.abs(daysUntil);
    label = n === 1 ? "Vencido hace 1 día" : `Vencido hace ${n} días`;
  } else if (daysUntil === 0) {
    label = "Vence hoy";
  } else if (daysUntil === 1) {
    label = "Vence mañana";
  } else if (urgency === "ok") {
    label = `Faltan ${daysUntil} días`;
  } else {
    label = `Vence en ${daysUntil} días`;
  }

  return { daysUntil, urgency, label };
}

export function frequencyLabel(t: TransferTemplate): string {
  if (t.frequency === "custom" && t.customIntervalDays != null && t.customIntervalDays > 0) {
    const d = t.customIntervalDays;
    return d === 1 ? "Cada 1 día" : `Cada ${d} días`;
  }
  switch (t.frequency) {
    case "weekly":
      return "Semanal";
    case "biweekly":
      return "Quincenal";
    case "monthly":
      return "Mensual";
    case "bimonthly":
      return "Bimestral";
    case "custom":
      return "Personalizado";
    default:
      return t.frequency;
  }
}

/** Nombre de la plantilla sin URLs pegadas (p. ej. el link del portal de pagos). */
export function cleanTemplateName(name: string): string {
  const cleaned = name.replace(/https?:\/\/\S+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || name;
}
