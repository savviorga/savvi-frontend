import type {
  CreateTransferTemplateDto,
  ExecuteTransferDto,
  Reminder,
  TransferTemplate,
  UpdateTransferTemplateDto,
} from "../types/transfer.types";
import { ApiError } from "@/types/api-error.type";
import { getBearerAuthHeaders, getJsonAuthHeaders } from "@/lib/api-auth";

const API_TRANSFER_TEMPLATES_BASE = `${process.env.NEXT_PUBLIC_API_URL}/transfer-templates`;
const API_REMINDERS_BASE = `${process.env.NEXT_PUBLIC_API_URL}/reminders`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw error;
  }
  return res.json();
}

export const TransferTemplatesService = {
  getAll: async (): Promise<TransferTemplate[]> => {
    const res = await fetch(API_TRANSFER_TEMPLATES_BASE, {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<TransferTemplate[]>(res);
  },

  create: async (
    payload: CreateTransferTemplateDto
  ): Promise<TransferTemplate> => {
    const res = await fetch(API_TRANSFER_TEMPLATES_BASE, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<TransferTemplate>(res);
  },

  update: async (
    id: string,
    payload: UpdateTransferTemplateDto
  ): Promise<TransferTemplate> => {
    const res = await fetch(`${API_TRANSFER_TEMPLATES_BASE}/${id}`, {
      method: "PATCH",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<TransferTemplate>(res);
  },

  toggleActive: async (id: string): Promise<TransferTemplate> => {
    const res = await fetch(`${API_TRANSFER_TEMPLATES_BASE}/${id}/toggle`, {
      method: "PATCH",
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<TransferTemplate>(res);
  },

  execute: async (
    id: string,
    payload: ExecuteTransferDto
  ): Promise<{ transaction: unknown; template: TransferTemplate }> => {
    const res = await fetch(`${API_TRANSFER_TEMPLATES_BASE}/${id}/execute`, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ transaction: unknown; template: TransferTemplate }>(res);
  },
};

export const RemindersService = {
  getPending: async (): Promise<Reminder[]> => {
    const res = await fetch(API_REMINDERS_BASE, {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<Reminder[]>(res);
  },

  dismiss: async (id: string): Promise<unknown> => {
    const res = await fetch(`${API_REMINDERS_BASE}/${id}/dismiss`, {
      method: "PATCH",
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<unknown>(res);
  },
};
