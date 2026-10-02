/**
 * Precios de OpenAI por 1M de tokens (tier estándar), para estimar el gasto de
 * Savvi IA. Verificados en https://developers.openai.com/api/docs/pricing el
 * 2026-09-26: si OpenAI los cambia, actualiza la tabla o usa las variables
 * `IA_PRICE_INPUT`, `IA_PRICE_CACHED_INPUT` e `IA_PRICE_OUTPUT` (USD por 1M),
 * que aplican a cualquier modelo. Es una estimación: la factura real manda.
 * Solo servidor.
 */

import type { AdvisorUsage } from "@/features/savvi-ia/types/proposal.types";

export interface ModelPrice {
  input: number;
  cachedInput: number;
  output: number;
}

const PRICES: Record<string, ModelPrice> = {
  "gpt-4o-mini": { input: 0.15, cachedInput: 0.075, output: 0.6 },
  "gpt-4o": { input: 2.5, cachedInput: 1.25, output: 10 },
  "gpt-4.1-nano": { input: 0.1, cachedInput: 0.025, output: 0.4 },
  "gpt-4.1-mini": { input: 0.4, cachedInput: 0.1, output: 1.6 },
  "gpt-4.1": { input: 2, cachedInput: 0.5, output: 8 },
  "gpt-5-nano": { input: 0.05, cachedInput: 0.005, output: 0.4 },
  "gpt-5-mini": { input: 0.25, cachedInput: 0.025, output: 2 },
  "gpt-5": { input: 1.25, cachedInput: 0.125, output: 10 },
  "gpt-6-luna": { input: 0.1, cachedInput: 0.01, output: 0.5 },
  "gpt-6-sol": { input: 2, cachedInput: 0.2, output: 10 },
  "gpt-6-astra": { input: 10, cachedInput: 1, output: 50 },
};

function envPrice(): ModelPrice | null {
  const read = (name: string) => {
    const n = Number(process.env[name]);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const input = read("IA_PRICE_INPUT");
  const output = read("IA_PRICE_OUTPUT");
  if (input === null || output === null) return null;
  return { input, output, cachedInput: read("IA_PRICE_CACHED_INPUT") ?? input };
}

/**
 * OpenAI responde con el nombre fechado (`gpt-4o-mini-2024-07-18`): se busca el
 * prefijo conocido más largo para no confundir `gpt-4o` con `gpt-4o-mini`.
 */
export function priceFor(model: string): ModelPrice | null {
  const override = envPrice();
  if (override) return override;
  const name = model.toLowerCase();
  const match = Object.keys(PRICES)
    .filter((key) => name === key || name.startsWith(`${key}-`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PRICES[match] : null;
}

/** `usage` tal como lo devuelve `/chat/completions`. */
export interface OpenAIUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

export const emptyUsage = (model: string): AdvisorUsage => ({
  model,
  inputTokens: 0,
  cachedTokens: 0,
  outputTokens: 0,
  calls: 0,
  costUsd: 0,
  unpricedCalls: 0,
});

/** Suma una llamada al acumulado de la respuesta. */
export function addUsage(total: AdvisorUsage, model: string, usage: OpenAIUsage | undefined): void {
  const input = usage?.prompt_tokens ?? 0;
  const cached = Math.min(usage?.prompt_tokens_details?.cached_tokens ?? 0, input);
  const output = usage?.completion_tokens ?? 0;
  const price = priceFor(model);

  total.model = model;
  total.calls += 1;
  total.inputTokens += input;
  total.cachedTokens += cached;
  total.outputTokens += output;
  if (price) {
    total.costUsd += ((input - cached) * price.input + cached * price.cachedInput + output * price.output) / 1_000_000;
  } else {
    total.unpricedCalls += 1;
  }
}
