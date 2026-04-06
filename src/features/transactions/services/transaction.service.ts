import type { ApiError } from "@/types/api-error.type";
import { Transaction, CreateTransactionDto } from "../types/transactions.types";
import { getBearerAuthHeaders, getJsonAuthHeaders } from "@/lib/api-auth";
import { parseHttpErrorResponse } from "@/lib/parse-http-error-response";
import { getPublicApiUrl } from "@/lib/public-api-url";

function transactionsApi(): string {
  const root = getPublicApiUrl();
  if (!root) {
    throw {
      message:
        "Falta NEXT_PUBLIC_API_URL. En Vercel: Project → Settings → Environment Variables (Production) y vuelve a desplegar.",
      error: "Config",
      statusCode: 500,
    } satisfies ApiError;
  }
  return `${root}/transactions`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await parseHttpErrorResponse(res);
  }
  return res.json();
}

export const TransactionService = {
  getAll: async (): Promise<Transaction[]> => {
    const res = await fetch(transactionsApi(), {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<Transaction[]>(res);
  },

  getById: async (id: string): Promise<Transaction> => {
    const res = await fetch(`${transactionsApi()}/${id}`, {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<Transaction>(res);
  },

  create: async (payload: CreateTransactionDto): Promise<Transaction> => {
    const res = await fetch(transactionsApi(), {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Transaction>(res);
  },

  update: async (
    id: string,
    payload: Partial<CreateTransactionDto>
  ): Promise<Transaction> => {
    const res = await fetch(`${transactionsApi()}/${id}`, {
      method: "PATCH",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Transaction>(res);
  },

  remove: async (id: string): Promise<void> => {
    const res = await fetch(`${transactionsApi()}/${id}`, {
      method: "DELETE",
      headers: getBearerAuthHeaders(),
    });
    if (!res.ok) {
      throw await parseHttpErrorResponse(res);
    }
  },

  bulk: async (items: CreateTransactionDto[]): Promise<Transaction[]> => {
    const res = await fetch(`${transactionsApi()}/bulk`, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(items),
    });
    return handleResponse<Transaction[]>(res);
  },

  /**
   * Confirma archivos ya subidos a S3 vía presigned URL,
   * registrando los Document en el backend.
   */
  confirmUpload: async (
    transactionId: string,
    files: Array<{ key: string; name: string; size: number }>,
  ): Promise<void> => {
    const res = await fetch(`${transactionsApi()}/confirm-upload`, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({ transactionId, files }),
    });

    if (!res.ok) {
      throw await parseHttpErrorResponse(res);
    }
  },

  /**
   * @deprecated Usa el flujo presigned URL (useS3Upload + confirmUpload) para evitar
   * el límite de payload de Vercel. Mantenido para compatibilidad.
   */
  uploadFiles: async (transactionId: string, files: File[]): Promise<void> => {
    const formData = new FormData();
    formData.append("transactionId", transactionId);
    files.forEach((f) => formData.append("files", f));

    let res: Response;
    try {
      res = await fetch(`${transactionsApi()}/upload-files`, {
        method: "POST",
        headers: getBearerAuthHeaders(),
        body: formData,
      });
    } catch (e) {
      if (e instanceof TypeError) {
        throw {
          message:
            "No se pudo subir: suele ser HTTPS obligatorio (sitio en Vercel = https; el API debe ser https:// público, no http://) o el API caído. Revisa NEXT_PUBLIC_API_URL y el despliegue del backend.",
          error: "Network",
          statusCode: 0,
        } satisfies ApiError;
      }
      throw e;
    }

    if (!res.ok) {
      throw await parseHttpErrorResponse(res);
    }
  },
};
