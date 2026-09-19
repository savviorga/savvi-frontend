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
};
