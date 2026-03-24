import { Account } from "../types/account.type";
import { CreateAccountDto } from "../dto/create-account.dto";
import { ApiError } from "@/types/api-error.type";
import { getBearerAuthHeaders, getJsonAuthHeaders } from "@/lib/api-auth";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/accounts`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw error;
  }
  return res.json();
}

export const AccountService = {
  getAll: async (): Promise<Account[]> => {
    const res = await fetch(API_BASE, {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<Account[]>(res);
  },

  create: async (payload: CreateAccountDto): Promise<Account> => {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Account>(res);
  },
};
