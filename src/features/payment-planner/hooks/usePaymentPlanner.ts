import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PaymentPlannerService } from "../services/payment-planner.service";
import type {
  Debt,
  CreateDebtDto,
  UpdateDebtDto,
  RegisterPaymentDto,
} from "../types/debt.types";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

export function usePaymentPlanner() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const [debtsData, totalPaidData] = await Promise.all([
        PaymentPlannerService.getAll(),
        PaymentPlannerService.getTotalPaid(),
      ]);
      setDebts(debtsData);
      setTotalPaid(totalPaidData);
    } catch (error) {
      console.error("Error loading payment planner:", error);
      setDebts([]);
      setTotalPaid(0);
      toast.error("Error al cargar el planificador");
    } finally {
      setLoading(false);
    }
  }

  async function create(payload: CreateDebtDto): Promise<boolean> {
    try {
      setLoading(true);
      await PaymentPlannerService.create(payload);
      await load();
      toast.success("Obligación registrada");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al crear la obligación");
      }
      setLoading(false);
      return false;
    }
  }

  async function update(id: string, payload: UpdateDebtDto): Promise<boolean> {
    try {
      setLoading(true);
      await PaymentPlannerService.update(id, payload);
      await load();
      toast.success("Obligación actualizada");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al actualizar");
      }
      setLoading(false);
      return false;
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      setLoading(true);
      await PaymentPlannerService.remove(id);
      await load();
      toast.success("Obligación eliminada");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al eliminar");
      }
      setLoading(false);
      return false;
    }
  }

  async function registerPayment(
    debtId: string,
    payload: RegisterPaymentDto
  ): Promise<boolean> {
    try {
      setLoading(true);
      await PaymentPlannerService.registerPayment(debtId, payload);
      await load();
      toast.success("Pago registrado y transacción creada");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al registrar el pago");
      }
      setLoading(false);
      return false;
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    debts,
    totalPaid,
    loading,
    create,
    update,
    remove,
    registerPayment,
    reload: load,
  };
}
