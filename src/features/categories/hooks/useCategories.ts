import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CategoryService } from "../services/category.service";
import { Category } from "../types/category.type";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

function showError(error: unknown) {
  if (isApiError(error)) {
    getErrorMessages(error).forEach((msg) => toast.error(msg));
  } else {
    toast.error("Ocurrió un error inesperado");
  }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await CategoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
      toast.error("Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  async function run(action: () => Promise<void>, success: string): Promise<boolean> {
    try {
      setSaving(true);
      await action();
      toast.success(success);
      return true;
    } catch (error) {
      showError(error);
      return false;
    } finally {
      await load();
      setSaving(false);
    }
  }

  const create = (payload: CreateCategoryDto) =>
    run(
      () => CategoryService.create(payload).then(() => undefined),
      payload.parentId ? "Subcategoría creada" : "Categoría creada",
    );

  const update = (id: string, payload: Partial<CreateCategoryDto>) =>
    run(() => CategoryService.update(id, payload).then(() => undefined), "Cambios guardados");

  const setActive = (category: Category, isActive: boolean) =>
    run(
      () => CategoryService.update(category.id, { isActive }).then(() => undefined),
      isActive ? `"${category.name}" activada` : `"${category.name}" desactivada`,
    );

  const remove = (category: Category, options?: { releaseChildren?: boolean }) =>
    run(
      () => CategoryService.remove(category.id, options),
      `"${category.name}" eliminada`,
    );

  /**
   * Mete una categoría en otra (o la saca con `null`). Se ve al instante y, si
   * el servidor lo rechaza, vuelve a su lugar y se muestra el motivo.
   */
  const move = useCallback(
    async (category: Category, parentId: string | null): Promise<boolean> => {
      const previousParentId = category.parentId ?? null;
      const setParent = (value: string | null) =>
        setCategories((list) =>
          list.map((c) => (c.id === category.id ? { ...c, parentId: value } : c)),
        );

      setParent(parentId);
      try {
        await CategoryService.update(category.id, { parentId });
        void load();
        return true;
      } catch (error) {
        setParent(previousParentId);
        showError(error);
        return false;
      }
    },
    [load],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    categories,
    loading,
    saving,
    create,
    update,
    setActive,
    remove,
    move,
    reload: load,
  };
}
