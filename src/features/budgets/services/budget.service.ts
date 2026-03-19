import { ApiError } from "@/types/api-error.type";
import type { Budget, CreateBudgetDto } from "../types/budget.type";

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
    const res = await fetch(API_BASE);
    return handleResponse<Budget[]>(res);
  },

  createOrUpdate: async (payload: CreateBudgetDto): Promise<Budget> => {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<Budget>(res);
  },

  remove: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error: ApiError = await res.json();
      throw error;
    }
  },
};

