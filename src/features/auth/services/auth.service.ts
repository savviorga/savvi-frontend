import {
  AuthResponse,
  CodeSentResponse,
  ForgotPasswordDto,
  LoginDto,
  LoginResponse,
  MessageResponse,
  RegisterDto,
  ResendTwoFactorDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
  VerifyResetCodeResponse,
  VerifyTwoFactorDto,
} from "../types/auth.type";
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
  login: async (payload: LoginDto): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<LoginResponse>(res);
  },

  /** `twoFactorToken` no es un JWT de sesión: va en el body, nunca en `Authorization`. */
  verifyTwoFactor: async (payload: VerifyTwoFactorDto): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/2fa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  resendTwoFactor: async (payload: ResendTwoFactorDto): Promise<CodeSentResponse> => {
    const res = await fetch(`${API_BASE}/2fa/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<CodeSentResponse>(res);
  },

  register: async (payload: RegisterDto): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  forgotPassword: async (payload: ForgotPasswordDto): Promise<MessageResponse> => {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<MessageResponse>(res);
  },

  verifyResetCode: async (
    payload: VerifyResetCodeDto
  ): Promise<VerifyResetCodeResponse> => {
    const res = await fetch(`${API_BASE}/verify-reset-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<VerifyResetCodeResponse>(res);
  },

  /** `resetToken` no es un JWT de sesión: va en el body, nunca en `Authorization`. */
  resetPassword: async (payload: ResetPasswordDto): Promise<MessageResponse> => {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<MessageResponse>(res);
  },
};
