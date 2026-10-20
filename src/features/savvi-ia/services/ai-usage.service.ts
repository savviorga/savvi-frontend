import { getBearerAuthHeaders } from "@/lib/api-auth";
import { parseHttpErrorResponse } from "@/lib/parse-http-error-response";
import { requirePublicApiUrl } from "@/lib/api-fetch";
import type { UsageTotals } from "../utils/usage";

type ServerTotals = Omit<UsageTotals, "model">;

/** Consumo de IA guardado en el backend (todas las peticiones, de cualquier dispositivo). */
export interface AiUsageSummary {
  model: string | null;
  month: ServerTotals;
  lifetime: ServerTotals;
  quota: {
    spentTodayUsd: number;
    spentMonthUsd: number;
    dailyLimitUsd: number;
    monthlyLimitUsd: number;
  };
}

export const AiUsageService = {
  summary: async (): Promise<AiUsageSummary> => {
    const res = await fetch(`${requirePublicApiUrl()}/ai/usage/summary`, {
      headers: getBearerAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw await parseHttpErrorResponse(res);
    return res.json();
  },
};

export const toUsageTotals = (totals: ServerTotals, model: string | null): UsageTotals => ({ ...totals, model });
