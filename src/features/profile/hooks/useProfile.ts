"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { User } from "@/features/auth/types/auth.type";
import { isApiError, getErrorMessages, type ApiError } from "@/types/api-error.type";
import { ProfileService } from "../services/profile.service";
import type { CodeSentResponse } from "@/features/auth/types/auth.type";
import type { ChangePasswordDto, ProfileSummary, RotatedSession, UpdateProfileDto } from "../types/profile.type";

/** Resultado de una mutación: `ok` o los mensajes del API para mostrarlos en el formulario. */
export type MutationFailure = { ok: false; status: number; messages: string[] };
export type MutationResult<T = undefined> = { ok: true; data: T } | MutationFailure;

function toFailure(error: unknown, fallback: string): MutationFailure {
  if (isApiError(error)) {
    return { ok: false, status: (error as ApiError).statusCode, messages: getErrorMessages(error) };
  }
  return { ok: false, status: 0, messages: [fallback] };
}

export function useProfile() {
  const { updateUser, replaceSession } = useAuth();

  /** Guarda la sesión nueva que llega tras un cambio de seguridad. */
  const keepSession = (session: RotatedSession) => {
    if (session.user && session.access_token) {
      replaceSession({ user: session.user, access_token: session.access_token });
      const user = session.user;
      setSummary((prev) => (prev ? { ...prev, user: { ...prev.user, ...user } } : prev));
    }
  };
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Una sola llamada al entrar: el resumen ya trae el usuario.
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProfileService.getSummary();
      // Si el resumen no trae el estado del 2FA, se toma de `GET /profile`.
      const user =
        data.user.twoFactorEnabled === undefined
          ? await ProfileService.get().catch(() => data.user)
          : data.user;
      setSummary({ ...data, user });
      updateUser(user);
    } catch (err) {
      console.error("Error loading profile summary:", err);
      setError(isApiError(err) ? getErrorMessages(err)[0] : "No pudimos cargar tu perfil.");
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (payload: UpdateProfileDto): Promise<MutationResult<User>> => {
    try {
      const user = await ProfileService.update(payload);
      updateUser(user);
      setSummary((prev) => (prev ? { ...prev, user } : prev));
      toast.success("Perfil actualizado");
      return { ok: true, data: user };
    } catch (err) {
      return toFailure(err, "No pudimos guardar los cambios.");
    }
  };

  const changePassword = async (payload: ChangePasswordDto): Promise<MutationResult> => {
    try {
      const { message, ...session } = await ProfileService.changePassword(payload);
      keepSession(session);
      toast.success(message || "Contraseña actualizada. Cerramos tus otras sesiones.");
      return { ok: true, data: undefined };
    } catch (err) {
      return toFailure(err, "No pudimos cambiar la contraseña.");
    }
  };

  const setTwoFactorEnabled = (twoFactorEnabled: boolean) => {
    if (!summary) return;
    const user = { ...summary.user, twoFactorEnabled };
    updateUser(user);
    setSummary((prev) => (prev ? { ...prev, user } : prev));
  };

  /** Envía el código de activación al email del usuario. */
  const requestTwoFactorEnable = async (): Promise<MutationResult> => {
    try {
      await ProfileService.enableTwoFactor();
      return { ok: true, data: undefined };
    } catch (err) {
      return toFailure(err, "No pudimos enviar el código.");
    }
  };

  const confirmTwoFactorEnable = async (code: string): Promise<MutationResult> => {
    try {
      const { message, twoFactorEnabled } = await ProfileService.confirmTwoFactor({ code });
      setTwoFactorEnabled(twoFactorEnabled);
      toast.success(message || "Verificación en dos pasos activada");
      return { ok: true, data: undefined };
    } catch (err) {
      return toFailure(err, "No pudimos verificar el código.");
    }
  };

  const disableTwoFactor = async (password: string): Promise<MutationResult> => {
    try {
      const { message, twoFactorEnabled, ...session } = await ProfileService.disableTwoFactor({ password });
      keepSession(session);
      setTwoFactorEnabled(twoFactorEnabled);
      toast.success(message || "Verificación en dos pasos desactivada");
      return { ok: true, data: undefined };
    } catch (err) {
      return toFailure(err, "No pudimos desactivar la verificación en dos pasos.");
    }
  };

  /** Paso 1 del cambio de email: contraseña actual + código al email nuevo. */
  const requestEmailChange = async (
    newEmail: string,
    currentPassword: string,
  ): Promise<MutationResult<CodeSentResponse>> => {
    try {
      const data = await ProfileService.requestEmailChange({ newEmail, currentPassword });
      return { ok: true, data };
    } catch (err) {
      return toFailure(err, "No pudimos enviar el código al email nuevo.");
    }
  };

  /** Paso 2: con el código correcto el email cambia y se renueva la sesión. */
  const confirmEmailChange = async (code: string): Promise<MutationResult<string>> => {
    try {
      const session = await ProfileService.confirmEmailChange({ code });
      keepSession(session);
      toast.success("Email actualizado. Cerramos tus otras sesiones.");
      return { ok: true, data: session.user.email };
    } catch (err) {
      return toFailure(err, "No pudimos verificar el código.");
    }
  };

  return {
    summary,
    loading,
    error,
    reload: load,
    update,
    changePassword,
    requestEmailChange,
    confirmEmailChange,
    requestTwoFactorEnable,
    confirmTwoFactorEnable,
    disableTwoFactor,
  };
}
