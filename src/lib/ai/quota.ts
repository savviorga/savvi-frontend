/**
 * Cuotas de IA por usuario, guardadas en el backend: se consulta antes de
 * llamar al modelo y se registra lo que costó cada petición. Solo servidor.
 */

import { backendGet, backendPost } from "@/lib/backend-server";
import { OpenAIError } from "@/lib/openai";
import type { AiSession } from "@/lib/ai-session";
import type { AdvisorUsage } from "@/features/savvi-ia/types/proposal.types";

export type AiEndpoint = "chat" | "transcribe" | "parse-transaction" | "parse-transactions" | "documents";

interface QuotaStatus {
  allowed: boolean;
  message: string | null;
}

/** Corta con 429 si el usuario superó su límite diario, mensual o por minuto. */
export async function assertAiQuota(session: AiSession): Promise<void> {
  const quota = await backendGet<QuotaStatus>("/ai/usage/quota", session.authorization);
  if (!quota.allowed) {
    throw new OpenAIError(quota.message ?? "Llegaste al límite de uso de Savvi IA.", 429);
  }
}

/** Registra el consumo de una petición. Nunca hace fallar la respuesta al usuario. */
export async function recordAiUsage(
  session: AiSession,
  endpoint: AiEndpoint,
  usage: AdvisorUsage | null | undefined,
): Promise<void> {
  if (!usage || usage.calls === 0) return;
  try {
    await backendPost("/ai/usage", session.authorization, {
      endpoint,
      model: usage.model.slice(0, 80),
      calls: usage.calls,
      inputTokens: usage.inputTokens,
      cachedTokens: usage.cachedTokens,
      outputTokens: usage.outputTokens,
      costUsd: Math.round(usage.costUsd * 1e6) / 1e6,
      unpricedCalls: usage.unpricedCalls,
    });
  } catch (error) {
    console.error("[ai] No se pudo registrar el consumo:", error);
  }
}
