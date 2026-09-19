export type TransactionType = "ingreso" | "egreso" | "transferencia";

/** Adjunto de una transacción. `url` es prefirmada y caduca en 1 hora: no cachear. */
export interface TransactionDocument {
  id: string;
  name: string;
  size: number;
  url: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO date: YYYY-MM-DD
  type: TransactionType;
  amount: number; // se normaliza a number
  category: string;
  account: string; // accountId
  description?: string;
  /** Solo viene en el PATCH de edición; el listado no lo incluye. */
  documents?: TransactionDocument[];
}

export interface CreateTransactionDto {
  date: string;
  type: TransactionType;
  amount: number;
  category: string;
  account: string;
  description?: string;
  files?: File[];
}

/** Archivo ya subido a S3 por URL prefirmada, pendiente de vincular. */
export interface UploadedFileRef {
  key: string;
  name: string;
  size: number;
}

/**
 * PATCH parcial: solo se envía lo que cambió. `documentsToDelete` y `filesToAdd`
 * viajan en la misma petición que los campos (FRONT.md §4).
 */
export interface UpdateTransactionDto extends Partial<Omit<CreateTransactionDto, "files">> {
  /** IDs de adjuntos a eliminar de S3 y base de datos (máx. 50). */
  documentsToDelete?: string[];
  /** Archivos ya subidos a S3 a vincular (máx. 10). */
  filesToAdd?: UploadedFileRef[];
}

/** Lo que envía el formulario: campos + archivos nuevos + adjuntos marcados para borrar. */
export interface TransactionFormPayload extends CreateTransactionDto {
  documentsToDelete?: string[];
}

export interface DeleteTransactionResult {
  id: string;
  date: string;
  amount: number;
  /** Adjuntos eliminados junto con la transacción. */
  deletedDocuments: number;
}

export interface DeleteDocumentResult {
  transactionId: string;
  documentId: string;
  name: string;
  deleted: boolean;
}
