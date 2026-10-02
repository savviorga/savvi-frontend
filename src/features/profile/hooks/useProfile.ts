"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { User } from "@/features/auth/types/auth.type";
import { isApiError, getErrorMessages, type ApiError } from "@/types/api-error.type";
import { CategoryService } from "@/features/categories/services/category.service";
import { ProfileService } from "../services/profile.service";
import type { ChangePasswordDto, ProfileSummary, UpdateProfileDto } from "../types/profile.type";

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
  const { updateUser } = useAuth();
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Una sola llamada al entrar: el resumen ya trae el usuario.
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, categories] = await Promise.all([
        ProfileService.getSummary(),
        CategoryService.getAll().catch(() => []),
      ]);
      // Las transacciones guardan el id de la categoría: se muestra su nombre.
      const names = new Map(categories.map((c) => [c.id, c.name]));
      setSummary({
        ...data,
        topExpenseCategories: data.topExpenseCategories.map((c) => ({
          ...c,
          category: names.get(c.category) ?? c.category,
        })),
      });
      updateUser(data.user);
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
      const { message } = await ProfileService.changePassword(payload);
      toast.success(message || "Contraseña actualizada");
      return { ok: true, data: undefined };
    } catch (err) {
      return toFailure(err, "No pudimos cambiar la contraseña.");
    }
  };

  return { summary, loading, error, reload: load, update, changePassword };
}
