"use client";

import { useCallback, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import {
  LoginDto,
  RegisterDto,
  TwoFactorChallenge,
  VerifyTwoFactorDto,
} from "../types/auth.type";
import {
  isApiError,
  getErrorMessages,
  getFirstErrorMessage,
} from "@/types/api-error.type";
import { isTwoFactorRestartError } from "../utils/two-factor";

export type VerifyTwoFactorResult =
  | { success: true; callbackUrl?: string }
  | { success: false; error: string; restart: boolean };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  const {
    user,
    loading,
    isAuthenticated,
    login: ctxLogin,
    verifyTwoFactor: ctxVerifyTwoFactor,
    register: ctxRegister,
    logout,
    getToken,
    updateUser,
  } = ctx;

  const login = useCallback(
    async (
      payload: LoginDto,
      options?: { callbackUrl?: string }
    ): Promise<{
      success: boolean;
      callbackUrl?: string;
      twoFactor?: TwoFactorChallenge;
    }> => {
      try {
        const result = await ctxLogin(payload, options);
        if (!result.success) {
          toast.success("Te enviamos un código a tu email");
          return result;
        }
        toast.success("Sesión iniciada. Redirigiendo…");
        return result;
      } catch (error) {
        if (isApiError(error)) {
          const messages = getErrorMessages(error);
          messages.forEach((msg) => toast.error(msg));
        } else {
          toast.error("Email o contraseña incorrectos");
        }
        return { success: false };
      }
    },
    [ctxLogin]
  );

  /** Los errores se devuelven (no se muestran) para pintarlos junto al campo del código. */
  const verifyTwoFactor = useCallback(
    async (
      payload: VerifyTwoFactorDto,
      options?: { callbackUrl?: string }
    ): Promise<VerifyTwoFactorResult> => {
      try {
        const result = await ctxVerifyTwoFactor(payload, options);
        toast.success("Sesión iniciada. Redirigiendo…");
        return { success: true, callbackUrl: result.callbackUrl };
      } catch (error) {
        return {
          success: false,
          error: getFirstErrorMessage(error, "No pudimos verificar el código"),
          restart: isTwoFactorRestartError(error),
        };
      }
    },
    [ctxVerifyTwoFactor]
  );

  const register = useCallback(
    async (
      payload: RegisterDto,
      options?: { callbackUrl?: string }
    ): Promise<{ success: boolean; callbackUrl?: string }> => {
      try {
        const result = await ctxRegister(payload, options);
        toast.success("Cuenta creada. Redirigiendo…");
        return result;
      } catch (error) {
        if (isApiError(error)) {
          const messages = getErrorMessages(error);
          messages.forEach((msg) => toast.error(msg));
        } else {
          toast.error("Error al registrar");
        }
        return { success: false };
      }
    },
    [ctxRegister]
  );

  return {
    user,
    loading,
    login,
    verifyTwoFactor,
    register,
    logout,
    isAuthenticated,
    getToken,
    updateUser,
    status: loading ? "loading" : isAuthenticated ? "authenticated" : "unauthenticated",
  };
}
