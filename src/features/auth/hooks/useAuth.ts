"use client";

import { useCallback, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { LoginDto, RegisterDto } from "../types/auth.type";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

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
    register: ctxRegister,
    logout,
    getToken,
  } = ctx;

  const login = useCallback(
    async (
      payload: LoginDto,
      options?: { callbackUrl?: string }
    ): Promise<{ success: boolean; callbackUrl?: string }> => {
      try {
        const result = await ctxLogin(payload, options);
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
    register,
    logout,
    isAuthenticated,
    getToken,
    status: loading ? "loading" : isAuthenticated ? "authenticated" : "unauthenticated",
  };
}
