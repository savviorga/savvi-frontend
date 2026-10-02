import type { AdvisorUsage } from "../types/proposal.types";

/** Acumulado de consumo del modelo (una conversación o el histórico del usuario). */
export type UsageTotals = Omit<AdvisorUsage, "model"> & { model: string | null };

export const EMPTY_USAGE: UsageTotals = {
  model: null,
  inputTokens: 0,
  cachedTokens: 0,
  outputTokens: 0,
  calls: 0,
  costUsd: 0,
  unpricedCalls: 0,
};

export const addToTotals = (totals: UsageTotals, usage: AdvisorUsage): UsageTotals => ({
  model: usage.model,
  inputTokens: totals.inputTokens + usage.inputTokens,
  cachedTokens: totals.cachedTokens + usage.cachedTokens,
  outputTokens: totals.outputTokens + usage.outputTokens,
  calls: totals.calls + usage.calls,
  costUsd: totals.costUsd + usage.costUsd,
  unpricedCalls: totals.unpricedCalls + usage.unpricedCalls,
});

export const totalTokens = (u: UsageTotals) => u.inputTokens + u.outputTokens;

/** "842", "12,4 mil", "1,2 M" */
export const formatTokens = (n: number) =>
  new Intl.NumberFormat("es-CO", { notation: n >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);

/** Centavos de dólar: con 4 decimales para que no se vea "US$ 0,00". */
export const formatUsd = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n > 0 && n < 1 ? 4 : 2,
    maximumFractionDigits: n > 0 && n < 1 ? 4 : 2,
  }).format(n);

/** Lee un acumulado guardado, descartando lo que no tenga la forma esperada. */
export function readTotals(raw: unknown): UsageTotals {
  if (typeof raw !== "object" || raw === null) return EMPTY_USAGE;
  const source = raw as Record<string, unknown>;
  const num = (key: keyof UsageTotals) => {
    const n = Number(source[key]);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  return {
    model: typeof source.model === "string" ? source.model : null,
    inputTokens: num("inputTokens"),
    cachedTokens: num("cachedTokens"),
    outputTokens: num("outputTokens"),
    calls: num("calls"),
    costUsd: num("costUsd"),
    unpricedCalls: num("unpricedCalls"),
  };
}
