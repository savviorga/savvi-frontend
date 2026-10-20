import type { User } from "@/features/auth/types/auth.type";
import type { ApiError } from "@/types/api-error.type";
import { getBearerAuthHeaders, getJsonAuthHeaders } from "@/lib/api-auth";
import type { CodeSentResponse } from "@/features/auth/types/auth.type";
import type { AuthResponse } from "@/features/auth/types/auth.type";
import type {
  ChangePasswordDto,
  ConfirmEmailChangeDto,
  ConfirmTwoFactorDto,
  DisableTwoFactorDto,
  ProfileSummary,
  RequestEmailChangeDto,
  RotatedSession,
  TwoFactorStatusResponse,
  UpdateProfileDto,
} from "../types/profile.type";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/profile`;
const TWO_FACTOR_BASE = `${process.env.NEXT_PUBLIC_API_URL}/auth/2fa`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw error;
  }
  return res.json();
}

export const ProfileService = {
  get: async (): Promise<User> => {
    const res = await fetch(API_BASE, { headers: getBearerAuthHeaders() });
    return handleResponse<User>(res);
  },

  update: async (payload: UpdateProfileDto): Promise<User> => {
    const res = await fetch(API_BASE, {
      method: "PATCH",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<User>(res);
  },

  changePassword: async (payload: ChangePasswordDto): Promise<{ message: string } & RotatedSession> => {
    const res = await fetch(`${API_BASE}/password`, {
      method: "PATCH",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string } & RotatedSession>(res);
  },

  /** Valida la contraseña y envía un código al email nuevo. */
  requestEmailChange: async (payload: RequestEmailChangeDto): Promise<CodeSentResponse> => {
    const res = await fetch(`${API_BASE}/email`, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<CodeSentResponse>(res);
  },

  /** Aplica el email nuevo; devuelve una sesión nueva (las demás quedan cerradas). */
  confirmEmailChange: async (payload: ConfirmEmailChangeDto): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/email/confirm`, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  getSummary: async (): Promise<ProfileSummary> => {
    const res = await fetch(`${API_BASE}/summary`, { headers: getBearerAuthHeaders() });
    return handleResponse<ProfileSummary>(res);
  },
  /** Envía un código al email; el 2FA no queda activo hasta confirmarlo. */
  enableTwoFactor: async (): Promise<CodeSentResponse> => {
    const res = await fetch(`${TWO_FACTOR_BASE}/enable`, {
      method: "POST",
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<CodeSentResponse>(res);
  },

  confirmTwoFactor: async (payload: ConfirmTwoFactorDto): Promise<TwoFactorStatusResponse> => {
    const res = await fetch(`${TWO_FACTOR_BASE}/enable/confirm`, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<TwoFactorStatusResponse>(res);
  },

  disableTwoFactor: async (payload: DisableTwoFactorDto): Promise<TwoFactorStatusResponse> => {
    const res = await fetch(`${TWO_FACTOR_BASE}/disable`, {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<TwoFactorStatusResponse>(res);
  },
};
