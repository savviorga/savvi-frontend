import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { TransactionService } from "../services/transaction.service";
import { Transaction, CreateTransactionDto } from "../types/transactions.types";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

/** Más reciente primero (fecha desc; mismo día → id para orden estable). */
function sortTransactionsNewestFirst(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return b.id.localeCompare(a.id);
  });
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await TransactionService.getAll();
      setTransactions(sortTransactionsNewestFirst(data));
    } catch (error) {
      console.error("Error loading transactions:", error);
      setTransactions([]);
      toast.error("Error al cargar las transacciones");
    } finally {
      setLoading(false);
    }
  }

  async function create(payload: CreateTransactionDto): Promise<boolean> {
    try {
      setLoading(true);
      const transaction = await TransactionService.create(payload);
      if (payload.files?.length) {
        await TransactionService.uploadFiles(transaction.id, payload.files);
      }
      await load();
      toast.success("Transacción creada exitosamente");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        const messages = getErrorMessages(error);
        messages.forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al crear la transacción");
      }
      setLoading(false);
      return false;
    }
  }

  async function update(id: string, payload: Partial<CreateTransactionDto>): Promise<boolean> {
    try {
      setLoading(true);
      await TransactionService.update(id, payload);
      await load();
      toast.success("Transacción actualizada exitosamente");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        const messages = getErrorMessages(error);
        messages.forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al actualizar la transacción");
      }
      setLoading(false);
      return false;
    }
  }

  async function show(id: string): Promise<Transaction | null> {
    try {
      const transaction = await TransactionService.getById(id);
      return transaction;
    } catch (error) {
      if (isApiError(error)) {
        const messages = getErrorMessages(error);
        messages.forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al obtener la transacción");
      }
      return null;
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await TransactionService.remove(id);
      setTransactions((prev) =>
        sortTransactionsNewestFirst(prev.filter((t) => t.id !== id))
      );
      toast.success("Transacción eliminada exitosamente");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        const messages = getErrorMessages(error);
        messages.forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al eliminar la transacción");
      }
      return false;
    }
  }

  async function bulk(items: CreateTransactionDto[]): Promise<boolean> {
    try {
      setLoading(true);
      await TransactionService.bulk(items);
      await load();
      toast.success(`${items.length} transacciones creadas exitosamente`);
      return true;
    } catch (error) {
      if (isApiError(error)) {
        const messages = getErrorMessages(error);
        messages.forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al crear las transacciones");
      }
      setLoading(false);
      return false;
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    transactions,
    loading,
    create,
    update,
    show,
    remove,
    bulk,
    reload: load,
  };
}
