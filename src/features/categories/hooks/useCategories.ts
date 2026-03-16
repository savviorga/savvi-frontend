import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CategoryService } from "../services/category.service";
import { Category } from "../types/category.type";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await CategoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
      toast.error("Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  }

  async function create(payload: CreateCategoryDto): Promise<boolean> {
    try {
      setLoading(true);
      await CategoryService.create(payload);
      await load();
      toast.success("Categoría creada exitosamente");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        const messages = getErrorMessages(error);
        messages.forEach((msg) => toast.error(msg));
      } else {
        toast.error("Ocurrió un error inesperado");
      }
      setLoading(false);
      return false;
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    categories,
    loading,
    create,
    reload: load,
  };
}
