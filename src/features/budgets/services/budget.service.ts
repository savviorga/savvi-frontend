import { ApiError } from "@/types/api-error.type";
import type {
  Budget,
  CreateBudgetDto,
  CreateBudgetDetailDto,
  UpdateBudgetDetailDto,
  BudgetDetail,
} from "../types/budget.type";
import { getBearerAuthHeaders, getJsonAuthHeaders } from "@/lib/api-auth";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/budgets`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw error;
  }
  return res.json();
}

export const BudgetService = {
  getAll: async (): Promise<Budget[]> => {
    const res = await fetch(API_BASE, {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<Budget[]>(res);
  },

  getById: async (id: string): Promise<Budget> => {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<Budget>(res);
  },

  createOrUpdate: async (payload: CreateBudgetDto): Promise<Budget> => {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Budget>(res);
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

  addDetail: async (
    budgetId: string,
    payload: CreateBudgetDetailDto
  ): Promise<BudgetDetail> => {
    const res = await fetch(`${API_BASE}/${budgetId}/details`, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<BudgetDetail>(res);
  },

  updateDetail: async (
    budgetId: string,
    detailId: string,
    payload: UpdateBudgetDetailDto
  ): Promise<BudgetDetail> => {
    const res = await fetch(`${API_BASE}/${budgetId}/details/${detailId}`, {
      method: "PATCH",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<BudgetDetail>(res);
  },

  removeDetail: async (budgetId: string, detailId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/${budgetId}/details/${detailId}`, {
      method: "DELETE",
      headers: getBearerAuthHeaders(),
    });
    if (!res.ok) {
      const error: ApiError = await res.json();
      throw error;
    }
  },
};
