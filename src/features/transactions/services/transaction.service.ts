import type { ApiError } from "@/types/api-error.type";
import {
  Transaction,
  TransactionDocument,
  CreateTransactionDto,
  UpdateTransactionDto,
  UploadedFileRef,
  DeleteTransactionResult,
  DeleteDocumentResult,
} from "../types/transactions.types";
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

/** `amount` llega como string por el `decimal` de Postgres: se castea antes de usarlo. */
function normalizeTransaction(raw: Transaction): Transaction {
  return { ...raw, amount: Number(raw.amount) };
}

export const TransactionService = {
  getAll: async (): Promise<Transaction[]> => {
    const res = await fetch(transactionsApi(), {
      headers: getBearerAuthHeaders(),
    });
    const data = await handleResponse<Transaction[]>(res);
    return data.map(normalizeTransaction);
  },

  getById: async (id: string): Promise<Transaction> => {
    const res = await fetch(`${transactionsApi()}/${id}`, {
      headers: getBearerAuthHeaders(),
    });
    return normalizeTransaction(await handleResponse<Transaction>(res));
  },

  create: async (payload: CreateTransactionDto): Promise<Transaction> => {
    const res = await fetch(transactionsApi(), {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return normalizeTransaction(await handleResponse<Transaction>(res));
  },

  /**
   * PATCH parcial. Además de los campos acepta `documentsToDelete` (adjuntos a borrar)
   * y `filesToAdd` (archivos ya subidos a S3). Devuelve la transacción con sus
   * documentos vigentes, así que sirve para repintar el detalle sin pedir la lista.
   */
  update: async (
    id: string,
    payload: UpdateTransactionDto
  ): Promise<Transaction> => {
    const res = await fetch(`${transactionsApi()}/${id}`, {
      method: "PATCH",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return normalizeTransaction(await handleResponse<Transaction>(res));
  },

  /** Elimina la transacción y todos sus adjuntos (S3 + base de datos). */
  remove: async (id: string): Promise<DeleteTransactionResult> => {
    const res = await fetch(`${transactionsApi()}/${id}`, {
      method: "DELETE",
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<DeleteTransactionResult>(res);
  },

  bulk: async (items: CreateTransactionDto[]): Promise<Transaction[]> => {
    const res = await fetch(`${transactionsApi()}/bulk`, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(items),
    });
    const data = await handleResponse<Transaction[]>(res);
    return data.map(normalizeTransaction);
  },

  /**
   * Adjuntos con URL de descarga temporal (válida 1 hora), del más reciente al más
   * antiguo. No cachear las URLs: pedir la lista cada vez que se abre el detalle.
   */
  getDocuments: async (
    transactionId: string,
  ): Promise<TransactionDocument[]> => {
    const res = await fetch(`${transactionsApi()}/${transactionId}/documents`, {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<TransactionDocument[]>(res);
  },

  /** Borrado definitivo de un adjunto (S3 + base de datos): pedir confirmación antes. */
  deleteDocument: async (
    transactionId: string,
    documentId: string,
  ): Promise<DeleteDocumentResult> => {
    const res = await fetch(
      `${transactionsApi()}/${transactionId}/documents/${documentId}`,
      {
        method: "DELETE",
        headers: getBearerAuthHeaders(),
      },
    );
    return handleResponse<DeleteDocumentResult>(res);
  },

  /**
   * Confirma archivos ya subidos a S3 vía presigned URL,
   * registrando los Document en el backend.
   */
  confirmUpload: async (
    transactionId: string,
    files: UploadedFileRef[],
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
   * Flujo alterno: multipart directo al backend. Pasa por el límite de payload del
   * hosting, por eso el flujo por defecto es presigned URL (useS3Upload + confirmUpload).
   * La respuesta no trae `url`: usa {@link TransactionService.getDocuments} después.
   */
  uploadDocuments: async (
    transactionId: string,
    files: File[],
  ): Promise<void> => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    const res = await fetch(`${transactionsApi()}/${transactionId}/documents`, {
      method: "POST",
      headers: getBearerAuthHeaders(),
      body: formData,
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
