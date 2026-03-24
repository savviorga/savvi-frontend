export type IntervalUnit = "days" | "weeks" | "months" | "years";

export function intervalToDays(amount: number, unit: IntervalUnit): number {
  const n = Math.max(1, Math.floor(Number(amount)) || 1);
  switch (unit) {
    case "days":
      return n;
    case "weeks":
      return n * 7;
    case "months":
      return n * 30;
    case "years":
      return n * 365;
    default:
      return n;
  }
}

/** Convierte días guardados a cantidad + unidad legible para el formulario. */
export function daysToIntervalForm(days: number): {
  amount: number;
  unit: IntervalUnit;
} {
  if (days >= 365 && days % 365 === 0) {
    return { amount: days / 365, unit: "years" };
  }
  if (days >= 30 && days % 30 === 0) {
    return { amount: days / 30, unit: "months" };
  }
  if (days >= 7 && days % 7 === 0) {
    return { amount: days / 7, unit: "weeks" };
  }
  return { amount: days, unit: "days" };
}
