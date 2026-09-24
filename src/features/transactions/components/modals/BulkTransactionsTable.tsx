"use client";

import { Trash2 } from "lucide-react";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import { cn } from "@/lib/utils";
import type { Account, Category } from "../../types/catalog.types";
import type { TransactionType } from "../../types/transactions.types";
import {
  BULK_FIELD_LABELS,
  getMissingFields,
  type BulkDraftField,
  type BulkDraftRow,
} from "../../types/bulk.types";

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "egreso", label: "Egreso" },
  { value: "ingreso", label: "Ingreso" },
  { value: "transferencia", label: "Transferencia" },
];

const fieldClass = (invalid: boolean) =>
  cn(
    "h-9 w-full rounded-lg border bg-white px-2 text-sm text-foreground transition",
    "focus:outline-none focus:ring-2 focus:ring-accent/25",
    invalid
      ? "border-red-300 focus:border-red-400"
      : "border-border focus:border-accent",
  );

export interface BulkTransactionsTableProps {
  rows: BulkDraftRow[];
  categories: Category[];
  accounts: Account[];
  onChange: (id: string, patch: Partial<BulkDraftRow>) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  /** Marca en rojo los campos vacíos (tras intentar confirmar). */
  showErrors?: boolean;
}

/** Categorías compatibles con el tipo elegido, como en el formulario individual. */
function categoriesForType(
  categories: Category[],
  type: TransactionType | null,
): Category[] {
  if (!type || type === "transferencia") return categories;
  return categories.filter((c) => (c.type ?? "egreso") === type);
}

export default function BulkTransactionsTable({
  rows,
  categories,
  accounts,
  onChange,
  onRemove,
  disabled = false,
  showErrors = false,
}: BulkTransactionsTableProps) {
  /** Al cambiar el tipo, una categoría de otro tipo deja de ser válida. */
  const handleTypeChange = (row: BulkDraftRow, value: string) => {
    const type = (value || null) as TransactionType | null;
    const stillValid =
      !row.categoryId ||
      categoriesForType(categories, type).some((c) => c.id === row.categoryId);
    onChange(row.id, {
      type,
      ...(stillValid ? {} : { categoryId: null }),
    });
  };

  const isInvalid = (row: BulkDraftRow, field: BulkDraftField) =>
    showErrors && getMissingFields(row).includes(field);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Todavía no hay registros
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Dicta o escribe tus movimientos y aparecerán aquí para revisarlos.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Escritorio: tabla ── */}
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="w-8 px-2 py-2 text-xs font-semibold text-muted-foreground">
                #
              </th>
              {(
                [
                  ["type", "w-32"],
                  ["date", "w-36"],
                  ["amount", "w-32"],
                  ["categoryId", "w-40"],
                  ["accountId", "w-40"],
                  ["description", ""],
                ] as [BulkDraftField, string][]
              ).map(([field, width]) => (
                <th
                  key={field}
                  className={cn(
                    "px-2 py-2 text-xs font-semibold text-muted-foreground",
                    width,
                  )}
                >
                  {BULK_FIELD_LABELS[field]}
                </th>
              ))}
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b border-border/60 last:border-0">
                <td className="px-2 py-2 text-xs text-muted-foreground">
                  {index + 1}
                </td>
                <td className="px-2 py-2">
                  <select
                    value={row.type ?? ""}
                    onChange={(e) => handleTypeChange(row, e.target.value)}
                    disabled={disabled}
                    aria-label={`Tipo del registro ${index + 1}`}
                    className={fieldClass(isInvalid(row, "type"))}
                  >
                    <option value="">—</option>
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <input
                    type="date"
                    value={row.date ?? ""}
                    onChange={(e) =>
                      onChange(row.id, { date: e.target.value || null })
                    }
                    disabled={disabled}
                    aria-label={`Fecha del registro ${index + 1}`}
                    className={fieldClass(isInvalid(row, "date"))}
                  />
                </td>
                <td className="px-2 py-2">
                  <CurrencyField
                    value={row.amount}
                    onChange={(value) => onChange(row.id, { amount: value })}
                    disabled={disabled}
                    className={cn(
                      "h-9 rounded-lg px-2 py-0 shadow-none",
                      isInvalid(row, "amount") && "border-red-300",
                    )}
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={row.categoryId ?? ""}
                    onChange={(e) =>
                      onChange(row.id, { categoryId: e.target.value || null })
                    }
                    disabled={disabled}
                    aria-label={`Categoría del registro ${index + 1}`}
                    className={fieldClass(isInvalid(row, "categoryId"))}
                  >
                    <option value="">—</option>
                    {categoriesForType(categories, row.type).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <select
                    value={row.accountId ?? ""}
                    onChange={(e) =>
                      onChange(row.id, { accountId: e.target.value || null })
                    }
                    disabled={disabled}
                    aria-label={`Cuenta del registro ${index + 1}`}
                    className={fieldClass(isInvalid(row, "accountId"))}
                  >
                    <option value="">—</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={row.description ?? ""}
                    onChange={(e) =>
                      onChange(row.id, { description: e.target.value || null })
                    }
                    disabled={disabled}
                    maxLength={500}
                    placeholder="Opcional"
                    aria-label={`Descripción del registro ${index + 1}`}
                    className={fieldClass(false)}
                  />
                </td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    disabled={disabled}
                    aria-label={`Quitar el registro ${index + 1}`}
                    title="Quitar registro"
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Móvil: una tarjeta por registro ── */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <li key={row.id} className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Registro {index + 1}
              </span>
              <button
                type="button"
                onClick={() => onRemove(row.id)}
                disabled={disabled}
                aria-label={`Quitar el registro ${index + 1}`}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-1 text-xs text-muted-foreground">
                {BULK_FIELD_LABELS.type}
                <select
                  value={row.type ?? ""}
                  onChange={(e) => handleTypeChange(row, e.target.value)}
                  disabled={disabled}
                  className={cn("mt-1", fieldClass(isInvalid(row, "type")))}
                >
                  <option value="">—</option>
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="col-span-1 text-xs text-muted-foreground">
                {BULK_FIELD_LABELS.date}
                <input
                  type="date"
                  value={row.date ?? ""}
                  onChange={(e) =>
                    onChange(row.id, { date: e.target.value || null })
                  }
                  disabled={disabled}
                  className={cn("mt-1", fieldClass(isInvalid(row, "date")))}
                />
              </label>

              <label className="col-span-2 text-xs text-muted-foreground">
                {BULK_FIELD_LABELS.amount}
                <CurrencyField
                  value={row.amount}
                  onChange={(value) => onChange(row.id, { amount: value })}
                  disabled={disabled}
                  className={cn(
                    "mt-1 h-9 rounded-lg px-2 py-0 shadow-none",
                    isInvalid(row, "amount") && "border-red-300",
                  )}
                />
              </label>

              <label className="col-span-2 text-xs text-muted-foreground">
                {BULK_FIELD_LABELS.categoryId}
                <select
                  value={row.categoryId ?? ""}
                  onChange={(e) =>
                    onChange(row.id, { categoryId: e.target.value || null })
                  }
                  disabled={disabled}
                  className={cn("mt-1", fieldClass(isInvalid(row, "categoryId")))}
                >
                  <option value="">—</option>
                  {categoriesForType(categories, row.type).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="col-span-2 text-xs text-muted-foreground">
                {BULK_FIELD_LABELS.accountId}
                <select
                  value={row.accountId ?? ""}
                  onChange={(e) =>
                    onChange(row.id, { accountId: e.target.value || null })
                  }
                  disabled={disabled}
                  className={cn("mt-1", fieldClass(isInvalid(row, "accountId")))}
                >
                  <option value="">—</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="col-span-2 text-xs text-muted-foreground">
                {BULK_FIELD_LABELS.description}
                <input
                  type="text"
                  value={row.description ?? ""}
                  onChange={(e) =>
                    onChange(row.id, { description: e.target.value || null })
                  }
                  disabled={disabled}
                  maxLength={500}
                  placeholder="Opcional"
                  className={cn("mt-1", fieldClass(false))}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
