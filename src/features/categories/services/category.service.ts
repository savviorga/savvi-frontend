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
  // DELETE responde sin cuerpo.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
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

  update: async (
    id: string,
    payload: Partial<CreateCategoryDto>,
  ): Promise<Category> => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Category>(res);
  },

  /**
   * Elimina la categoría. Con `releaseChildren`, si es un grupo, sus
   * subcategorías quedan como principales.
   */
  remove: async (
    id: string,
    options?: { releaseChildren?: boolean },
  ): Promise<void> => {
    const query = options?.releaseChildren ? "?releaseChildren=true" : "";
    const res = await fetch(`${API_BASE}/${id}${query}`, {
      method: "DELETE",
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<void>(res);
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
