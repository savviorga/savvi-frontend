import { getBearerAuthHeaders, getJsonAuthHeaders } from "@/lib/api-auth";
import { parseHttpErrorResponse } from "@/lib/parse-http-error-response";
import type { Account, Category } from "../types/catalog.types";

/** Campos deducidos de lo que dijo el usuario; `null` = no se detectó. */
export interface DetectedTransaction {
  type: "ingreso" | "egreso" | "transferencia" | null;
  amount: number | null;
  date: string | null;
  categoryId: string | null;
  accountId: string | null;
  description: string | null;
}

/**
 * Las peticiones van a los route handlers de Next (`/api/ai/**`), no a OpenAI:
 * la clave vive solo en el servidor.
 */
/** Movimiento de la lista en construcción; `id` lo asigna el navegador. */
export interface DetectedTransactionRow extends DetectedTransaction {
  id: string | null;
}

export const AiTransactionService = {
  transcribe: async (audio: Blob, fileName: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", audio, fileName);

    const res = await fetch("/api/ai/transcribe", {
      method: "POST",
      headers: getBearerAuthHeaders(),
      body: formData,
    });

    if (!res.ok) throw await parseHttpErrorResponse(res);
    const data = (await res.json()) as { text: string };
    return data.text;
  },

  parse: async (
    text: string,
    categories: Category[],
    accounts: Account[],
  ): Promise<DetectedTransaction> => {
    const res = await fetch("/api/ai/parse-transaction", {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({
        text,
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type ?? "egreso",
        })),
        accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
      }),
    });

    if (!res.ok) throw await parseHttpErrorResponse(res);
    const data = (await res.json()) as { detected: DetectedTransaction };
    return data.detected;
  },

  /**
   * Varios movimientos a la vez. `current` e `history` dan contexto para que un
   * mensaje nuevo corrija o complete la lista en lugar de empezar de cero.
   */
  parseMany: async (
    text: string,
    categories: Category[],
    accounts: Account[],
    options?: {
      current?: (DetectedTransaction & { id: string })[];
      history?: string[];
    },
  ): Promise<DetectedTransactionRow[]> => {
    const res = await fetch("/api/ai/parse-transactions", {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({
        text,
        current: options?.current ?? [],
        history: options?.history ?? [],
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type ?? "egreso",
        })),
        accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
      }),
    });

    if (!res.ok) throw await parseHttpErrorResponse(res);
    const data = (await res.json()) as { transactions: DetectedTransactionRow[] };
    return Array.isArray(data.transactions) ? data.transactions : [];
  },
};
