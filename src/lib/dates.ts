/**
 * Fechas de calendario (`YYYY-MM-DD`) sin corrimientos de zona horaria.
 * `new Date("2026-10-01")` es medianoche UTC = 30 de septiembre en Colombia, y
 * `date.toISOString().slice(0, 10)` da el día UTC (mañana después de las 7 p. m.).
 * Estas utilidades trabajan siempre en la hora local del navegador.
 */

import { format, parse, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

/** `YYYY-MM-DD` (o un ISO cuya parte de fecha importa) → Date local a medianoche. */
export function parseLocalDate(value: string): Date {
  return startOfDay(parse(value.slice(0, 10), "yyyy-MM-dd", new Date()));
}

/** Date → `YYYY-MM-DD` con el día local (no el UTC). */
export function toLocalISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Hoy en la hora local, `YYYY-MM-DD`. */
export function todayLocalISO(): string {
  return toLocalISODate(new Date());
}

/** Primer día del mes en curso, `YYYY-MM-DD`. */
export function monthStartLocalISO(date: Date = new Date()): string {
  return format(date, "yyyy-MM-01");
}

/** Fecha de calendario con formato legible en español (`d MMM yyyy` por defecto). */
export function formatLocalDate(value: string, pattern = "d MMM yyyy"): string {
  return format(parseLocalDate(value), pattern, { locale: es });
}

/** `YYYY-MM` → etiqueta del mes (`oct 2026` por defecto). */
export function formatMonthKey(key: string, pattern = "MMM yyyy"): string {
  return format(parseLocalDate(`${key.slice(0, 7)}-01`), pattern, { locale: es });
}
