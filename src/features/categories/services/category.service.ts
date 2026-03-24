import { Category } from "../types/category.type";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { ApiError } from "@/types/api-error.type";
import { getBearerAuthHeaders, getJsonAuthHeaders } from "@/lib/api-auth";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/categories`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw error;
  }
  return res.json();
}

export const CategoryService = {
  getAll: async (): Promise<Category[]> => {
    const res = await fetch(API_BASE, {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<Category[]>(res);
  },

  create: async (payload: CreateCategoryDto): Promise<Category> => {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Category>(res);
  },

  updateBudget: async (id: string, budgetLimit: number): Promise<Category> => {
    const res = await fetch(`${API_BASE}/${id}/budget`, {
      method: "PATCH",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({ budgetLimit }),
    });
    return handleResponse<Category>(res);
  },
};
