import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AccountService } from "../services/account.service";
import { Account } from "../types/account.type";
import { CreateAccountDto } from "../dto/create-account.dto";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await AccountService.getAll();
      setAccounts(data);
    } catch (error) {
      console.error("Error loading accounts:", error);
      setAccounts([]);
      toast.error("Error al cargar las cuentas");
    } finally {
      setLoading(false);
    }
  }

  async function create(payload: CreateAccountDto): Promise<boolean> {
    try {
      setLoading(true);
      await AccountService.create(payload);
      await load();
      toast.success("Cuenta creada exitosamente");
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
    accounts,
    loading,
    create,
    reload: load,
  };
}
