import type {
  CreateTransferTemplateDto,
  ExecuteTransferDto,
  Reminder,
  TransferTemplate,
  UpdateTransferTemplateDto,
} from "../types/transfer.types";
import { getBearerAuthHeaders, getJsonAuthHeaders } from "@/lib/api-auth";
import { apiFetch } from "@/lib/api-fetch";
import { parseHttpErrorResponse } from "@/lib/parse-http-error-response";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await parseHttpErrorResponse(res);
  }
  return res.json();
}

export const TransferTemplatesService = {
  getAll: async (): Promise<TransferTemplate[]> => {
    const res = await apiFetch("/transfer-templates", {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<TransferTemplate[]>(res);
  },

  create: async (
    payload: CreateTransferTemplateDto,
  ): Promise<TransferTemplate> => {
    const res = await apiFetch("/transfer-templates", {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<TransferTemplate>(res);
  },

  update: async (
    id: string,
    payload: UpdateTransferTemplateDto,
  ): Promise<TransferTemplate> => {
    const res = await apiFetch(`/transfer-templates/${id}`, {
      method: "PATCH",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<TransferTemplate>(res);
  },

  toggleActive: async (id: string): Promise<TransferTemplate> => {
    const res = await apiFetch(`/transfer-templates/${id}/toggle`, {
      method: "PATCH",
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<TransferTemplate>(res);
  },

  remove: async (id: string): Promise<void> => {
    const res = await apiFetch(`/transfer-templates/${id}`, {
      method: "DELETE",
      headers: getBearerAuthHeaders(),
    });
    if (!res.ok) {
      throw await parseHttpErrorResponse(res);
    }
  },

  execute: async (
    id: string,
    payload: ExecuteTransferDto,
  ): Promise<{ transaction: unknown; template: TransferTemplate }> => {
    const res = await apiFetch(`/transfer-templates/${id}/execute`, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ transaction: unknown; template: TransferTemplate }>(
      res,
    );
  },
};

export const RemindersService = {
  getPending: async (): Promise<Reminder[]> => {
    const res = await apiFetch("/reminders", {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<Reminder[]>(res);
  },

  dismiss: async (id: string): Promise<unknown> => {
    const res = await apiFetch(`/reminders/${id}/dismiss`, {
      method: "PATCH",
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<unknown>(res);
  },
};
