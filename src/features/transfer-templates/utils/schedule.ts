import { differenceInCalendarDays, parse, startOfDay } from "date-fns";
import type { ProgressBarVariant } from "@/components/ProgressBar/ProgressBar";
import type { TransferTemplate } from "../types/transfer.types";

/** Días aproximados por ciclo según frecuencia (para la barra de avance al próximo vencimiento). */
export function frequencyToPeriodDays(
  frequency: TransferTemplate["frequency"],
  customIntervalDays?: number | null
): number {
  if (frequency === "custom" && customIntervalDays != null && customIntervalDays > 0) {
    return customIntervalDays;
  }
  switch (frequency) {
    case "weekly":
      return 7;
    case "biweekly":
      return 14;
    case "monthly":
      return 30;
    case "bimonthly":
      return 60;
    default:
      return 30;
  }
}

export function getDueProgressInfo(
  nextDueDateIso: string,
  frequency: TransferTemplate["frequency"],
  customIntervalDays?: number | null
) {
  const due = startOfDay(parse(nextDueDateIso, "yyyy-MM-dd", new Date()));
  const today = startOfDay(new Date());
  const daysUntil = differenceInCalendarDays(due, today);
  const periodDays = frequencyToPeriodDays(frequency, customIntervalDays);

  let progressPercent: number;
  if (daysUntil <= 0) {
    progressPercent = 100;
  } else {
    progressPercent = Math.min(
      100,
      Math.max(0, (1 - daysUntil / periodDays) * 100)
    );
  }

  let label: string;
  if (daysUntil < 0) {
    const n = Math.abs(daysUntil);
    label = n === 1 ? "Venció hace 1 día" : `Venció hace ${n} días`;
  } else if (daysUntil === 0) {
    label = "Vence hoy";
  } else if (daysUntil === 1) {
    label = "Falta 1 día";
  } else {
    label = `Faltan ${daysUntil} días`;
  }

  return { daysUntil, progressPercent, label, periodDays };
}

export function dueProgressVariant(daysUntil: number): ProgressBarVariant {
  if (daysUntil < 0) return "red";
  if (daysUntil === 3) return "red";
  if (daysUntil <= 5) return "orange";
  return "teal";
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
