import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { TransactionService } from "../services/transaction.service";
import { TransactionDocument } from "../types/transactions.types";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

/**
 * Adjuntos de una transacción. Las URLs son prefirmadas y caducan en 1 hora,
 * por eso se recargan cada vez que se abre el detalle en lugar de cachearlas.
 *
 * @param transactionId transacción a consultar
 * @param enabled `false` (p. ej. modal cerrado) evita la petición
 */
export function useTransactionDocuments(
  transactionId: string | null | undefined,
  enabled = true,
) {
  const [documents, setDocuments] = useState<TransactionDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  /** Descarta respuestas de una transacción que ya no se está viendo. */
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    if (!transactionId || !enabled) {
      setDocuments([]);
      return;
    }

    const requestId = ++requestRef.current;
    try {
      setLoading(true);
      const docs = await TransactionService.getDocuments(transactionId);
      if (requestId === requestRef.current) setDocuments(docs);
    } catch (error) {
      console.error("Error cargando documentos", error);
      if (requestId === requestRef.current) {
        setDocuments([]);
        toast.error("No se pudieron cargar los archivos adjuntos");
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [transactionId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  /** Borrado definitivo (S3 + base de datos): confirmar con el usuario antes. */
  const removeDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      if (!transactionId) return false;
      try {
        setDeletingId(documentId);
        const result = await TransactionService.deleteDocument(
          transactionId,
          documentId,
        );
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        toast.success(`"${result.name}" eliminado`);
        return true;
      } catch (error) {
        if (isApiError(error)) {
          getErrorMessages(error).forEach((msg) => toast.error(msg));
        } else {
          toast.error("No se pudo eliminar el archivo");
        }
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [transactionId],
  );

  return { documents, loading, deletingId, removeDocument, reload: load };
}
