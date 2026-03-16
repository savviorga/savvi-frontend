import { ApiError } from "@/types/api-error.type";
import type {
  Debt,
  CreateDebtDto,
  UpdateDebtDto,
  RegisterPaymentDto,
  RegisterPaymentResult,
} from "../types/debt.types";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/payment-planner`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw error;
  }
  return res.json();
}

export const PaymentPlannerService = {
  getAll: async (): Promise<Debt[]> => {
    const res = await fetch(API_BASE);
    return handleResponse<Debt[]>(res);
  },

  getPending: async (): Promise<Debt[]> => {
    const res = await fetch(`${API_BASE}/pending`);
    return handleResponse<Debt[]>(res);
  },

  getTotalPaid: async (): Promise<number> => {
    const res = await fetch(`${API_BASE}/total-paid`);
    return handleResponse<number>(res);
  },

  getById: async (id: string): Promise<Debt> => {
    const res = await fetch(`${API_BASE}/${id}`);
    return handleResponse<Debt>(res);
  },

  create: async (payload: CreateDebtDto): Promise<Debt> => {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<Debt>(res);
  },

  update: async (id: string, payload: UpdateDebtDto): Promise<Debt> => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<Debt>(res);
  },

  remove: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error: ApiError = await res.json();
      throw error;
    }
  },

  registerPayment: async (
    debtId: string,
    payload: RegisterPaymentDto
  ): Promise<RegisterPaymentResult> => {
    const res = await fetch(`${API_BASE}/${debtId}/register-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<RegisterPaymentResult>(res);
  },
};
