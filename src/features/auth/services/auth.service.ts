import { AuthResponse } from "../types/auth.type";
import { LoginDto } from "../types/auth.type";
import { RegisterDto } from "../types/auth.type";
import { ApiError } from "@/types/api-error.type";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/auth`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw error;
  }
  return res.json();
}

export const AuthService = {
  login: async (payload: LoginDto): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  register: async (payload: RegisterDto): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },
};
