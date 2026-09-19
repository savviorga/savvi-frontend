import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { TransactionService } from "../services/transaction.service";
import {
  Transaction,
  CreateTransactionDto,
  TransactionFormPayload,
  UploadedFileRef,
} from "../types/transactions.types";
import { isApiError, getErrorMessages } from "@/types/api-error.type";
import { useS3Upload } from "@/hooks/useS3Upload";

/** Más reciente primero (fecha desc; mismo día → id para orden estable). */
function sortTransactionsNewestFirst(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return b.id.localeCompare(a.id);
  });
}

function notifyError(error: unknown, fallback: string) {
  if (isApiError(error)) {
    getErrorMessages(error).forEach((msg) => toast.error(msg));
  } else {
    const msg = error instanceof Error ? error.message : fallback;
    toast.error(msg);
  }
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const s3Upload = useS3Upload();

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
        try {
          const folder = `transactions/${transaction.id}`;
          const results = await s3Upload.uploadFiles(payload.files, folder);
          await TransactionService.confirmUpload(transaction.id, results);
        } catch (uploadErr) {
          console.error("[useTransactions] Error en subida de archivos:", uploadErr);
          notifyError(
            uploadErr,
            "La transacción se guardó pero falló la subida de archivos.",
          );
          await load();
          setLoading(false);
          return false;
        }
      }
      await load();
      toast.success("Transacción creada exitosamente");
      return true;
    } catch (error) {
      notifyError(error, "Error al crear la transacción");
      setLoading(false);
      return false;
    }
  }

  /**
   * Edición completa: campos + adjuntos. Los archivos nuevos se suben a S3 antes
   * del PATCH y viajan como `filesToAdd`, junto con los `documentsToDelete`
   * marcados en el formulario, para que todo se aplique en una sola petición.
   */
  async function update(
    id: string,
    payload: Partial<TransactionFormPayload>,
  ): Promise<boolean> {
    const { files, documentsToDelete, ...fields } = payload;

    setLoading(true);

    let filesToAdd: UploadedFileRef[] = [];
    if (files?.length) {
      try {
        filesToAdd = await s3Upload.uploadFiles(files, `transactions/${id}`);
      } catch (uploadErr) {
        console.error("[useTransactions] Error en subida de archivos:", uploadErr);
        notifyError(uploadErr, "No se pudieron subir los archivos nuevos.");
        setLoading(false);
        return false;
      }
    }

    try {
      await TransactionService.update(id, {
        ...fields,
        ...(documentsToDelete?.length ? { documentsToDelete } : {}),
        ...(filesToAdd.length ? { filesToAdd } : {}),
      });
      await load();
      toast.success("Transacción actualizada exitosamente");
      return true;
    } catch (error) {
      notifyError(error, "Error al actualizar la transacción");
      if (filesToAdd.length) {
        // Las keys ya están en S3: reintentar solo el guardado las vincula.
        toast.error(
          "Los archivos ya se subieron pero no quedaron vinculados: vuelve a guardar.",
        );
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
      notifyError(error, "Error al obtener la transacción");
      return null;
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      const result = await TransactionService.remove(id);
      setTransactions((prev) =>
        sortTransactionsNewestFirst(prev.filter((t) => t.id !== id))
      );
      toast.success(
        result?.deletedDocuments
          ? `Transacción eliminada junto con ${result.deletedDocuments} archivo(s)`
          : "Transacción eliminada exitosamente",
      );
      return true;
    } catch (error) {
      notifyError(error, "Error al eliminar la transacción");
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
      notifyError(error, "Error al crear las transacciones");
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
    uploadProgress: s3Upload.progress,
    uploadTotalPercent: s3Upload.totalPercent,
    isUploading: s3Upload.uploading,
    abortUpload: s3Upload.abort,
  };
}
