import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BudgetService } from "../services/budget.service";
import type { Budget, CreateBudgetDto } from "../types/budget.type";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await BudgetService.getAll();
      setBudgets(data);
    } catch (error) {
      console.error("Error loading budgets:", error);
      setBudgets([]);
      toast.error("Error al cargar los presupuestos");
    } finally {
      setLoading(false);
    }
  }

  async function createOrUpdate(payload: CreateBudgetDto): Promise<boolean> {
    try {
      setLoading(true);
      await BudgetService.createOrUpdate(payload);
      await load();
      toast.success("Presupuesto guardado correctamente");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al guardar el presupuesto");
      }
      setLoading(false);
      return false;
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      setLoading(true);
      await BudgetService.remove(id);
      await load();
      toast.success("Presupuesto eliminado");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al eliminar el presupuesto");
      }
      setLoading(false);
      return false;
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    budgets,
    loading,
    createOrUpdate,
    remove,
    reload: load,
  };
}

