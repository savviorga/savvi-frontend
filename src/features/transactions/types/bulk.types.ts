import type { TransactionType } from "./transactions.types";

/** Fila en construcción de la carga masiva: todo puede estar vacío hasta confirmar. */
export interface BulkDraftRow {
  /** Identificador local (no existe en el backend); la IA lo usa para editar la fila. */
  id: string;
  type: TransactionType | null;
  amount: number | null;
  /** YYYY-MM-DD */
  date: string | null;
  categoryId: string | null;
  accountId: string | null;
  description: string | null;
}

export type BulkDraftField = keyof Omit<BulkDraftRow, "id">;

/** Campos obligatorios para poder crear la transacción. */
export const REQUIRED_BULK_FIELDS: BulkDraftField[] = [
  "type",
  "date",
  "amount",
  "categoryId",
  "accountId",
];

export const BULK_FIELD_LABELS: Record<BulkDraftField, string> = {
  type: "Tipo",
  date: "Fecha",
  amount: "Monto",
  categoryId: "Categoría",
  accountId: "Cuenta",
  description: "Descripción",
};

/** Campos que faltan por completar en una fila. */
export function getMissingFields(row: BulkDraftRow): BulkDraftField[] {
  return REQUIRED_BULK_FIELDS.filter((field) => {
    if (field === "amount") return !(row.amount != null && row.amount > 0);
    return !row[field];
  });
}

export function createEmptyRow(id: string): BulkDraftRow {
  return {
    id,
    type: null,
    amount: null,
    date: null,
    categoryId: null,
    accountId: null,
    description: null,
  };
}
