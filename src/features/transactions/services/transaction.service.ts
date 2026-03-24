import { ApiError } from "@/types/api-error.type";
import { Transaction, CreateTransactionDto } from "../types/transactions.types";
import { getBearerAuthHeaders, getJsonAuthHeaders } from "@/lib/api-auth";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/transactions`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw error;
  }
  return res.json();
}

export const TransactionService = {
  getAll: async (): Promise<Transaction[]> => {
    const res = await fetch(API_BASE, {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<Transaction[]>(res);
  },

  getById: async (id: string): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<Transaction>(res);
  },

  create: async (payload: CreateTransactionDto): Promise<Transaction> => {
    const res = await fetch(API_BASE, {
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
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Transaction>(res);
  },

  remove: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getBearerAuthHeaders(),
    });
    if (!res.ok) {
      const error: ApiError = await res.json();
      throw error;
    }
  },

  bulk: async (items: CreateTransactionDto[]): Promise<Transaction[]> => {
    const res = await fetch(`${API_BASE}/bulk`, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(items),
    });
    return handleResponse<Transaction[]>(res);
  },

  uploadFiles: async (transactionId: string, files: File[]): Promise<void> => {
    const formData = new FormData();
    formData.append("transactionId", transactionId);
    files.forEach((f) => formData.append("files", f));

    const res = await fetch(`${API_BASE}/upload-files`, {
      method: "POST",
      headers: getBearerAuthHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const error: ApiError = await res.json();
      throw error;
    }
  },
};
