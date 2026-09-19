import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Receipt,
  RotateCcw,
} from "lucide-react";
import FileUploader from "@/components/File/FileUploader";
import FileList from "@/components/File/FileList";
import Modal from "@/components/Modal/Modal";
import SavvyDatePicker from "@/components/SavvyDatePicker/SavvyDatePicker";
import SavvySelect from "@/components/Select/Select";
import { ProgressBar } from "@/components/ProgressBar";
import {
  CreateTransactionDto,
  Transaction,
  TransactionFormPayload,
} from "../../types/transactions.types";
import { Account, Category } from "../../types/catalog.types";
import { Button } from "@/components/ui/shadcn-button";
import { cn } from "@/lib/utils";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import type { TransferFrequency, TransferRecurrenceType } from "@/features/transfer-templates/types/transfer.types";
import { useTransactionDocuments } from "../../hooks/useTransactionDocuments";
import {
  clearTransactionDefaults,
  loadTransactionDefaults,
  resolveTransactionDefaults,
  saveTransactionDefaults,
} from "../../utils/transactionDefaults";
import {
  DOCUMENT_ACCEPT,
  MAX_DOCUMENTS_PER_REQUEST,
  MAX_DOCUMENTS_TO_DELETE,
  MAX_DOCUMENT_SIZE,
} from "@/lib/document-constraints";

/** Tipos como botones: en móvil se elige de un toque, sin abrir un desplegable. */
const TYPE_OPTIONS = [
  {
    value: "ingreso",
    label: "Ingreso",
    icon: ArrowDownLeft,
    activeClass: "border-emerald-500 bg-emerald-50 text-emerald-700",
  },
  {
    value: "egreso",
    label: "Egreso",
    icon: ArrowUpRight,
    activeClass: "border-rose-500 bg-rose-50 text-rose-700",
  },
  {
    value: "transferencia",
    label: "Transferencia",
    icon: ArrowLeftRight,
    activeClass: "border-sky-500 bg-sky-50 text-sky-700",
  },
] as const;

/** Alto y tipografía cómodos en móvil (16px evita el zoom automático de iOS). */
const FIELD_MOBILE = "h-11 text-base sm:h-10 sm:text-sm";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    payload: TransactionFormPayload,
    editingId?: string,
    options?: { keepOpen?: boolean }
  ) => void | Promise<boolean | void>;
  onSubmitRecurring?: (payload: {
    amount: number;
    fromAccountId: string;
    templateName: string;
    payeeName: string;
    payeeAccount?: string;
    payeeBank?: string;
    recurrenceType: TransferRecurrenceType;
    frequency: TransferFrequency;
    /** Días entre vencimientos; solo aplica si frequency === "custom". */
    customIntervalDays?: number;
    dayOfMonth: number; // 1-28
    transactionType: "ingreso" | "egreso" | "transferencia";
    description?: string;
    files?: File[];
  }) => void | Promise<void>;
  editData?: Transaction | null;
  categories: Category[];
  accounts: Account[];
  loading: boolean;
  /** Subida de adjuntos a S3 en curso (bloquea el guardado y muestra el avance). */
  uploading?: boolean;
  /** Avance total de la subida, 0–100. */
  uploadPercent?: number;
}

export default function TransactionModal({
  open,
  onClose,
  onSubmit,
  onSubmitRecurring,
  editData,
  categories,
  accounts,
  loading,
  uploading = false,
  uploadPercent = 0,
}: TransactionModalProps) {
  const [form, setForm] = useState({
    date: "",
    type: "",
    amount: null as number | null,
    category: "",
    account: "",
    description: "",
  });
  /** Archivos nuevos: se suben a S3 al guardar y viajan como `filesToAdd`. */
  const [files, setFiles] = useState<File[]>([]);
  /** Adjuntos marcados para borrar; se envían en `documentsToDelete` al guardar. */
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([]);

  // Los adjuntos pendientes se reinician al abrir/cerrar o al cambiar de transacción.
  // Se ajusta en render (y no en un efecto sobre el mismo `useEffect` del formulario)
  // para no perder lo que el usuario arrastró cuando llegan los catálogos.
  const attachmentsKey = `${open ? "open" : "closed"}:${editData?.id ?? "new"}`;
  const [lastAttachmentsKey, setLastAttachmentsKey] = useState(attachmentsKey);
  if (lastAttachmentsKey !== attachmentsKey) {
    setLastAttachmentsKey(attachmentsKey);
    setFiles([]);
    setDocumentsToDelete([]);
  }

  // Adjuntos ya guardados (solo en edición). Las URLs caducan en 1 h, así que se
  // piden cada vez que se abre el modal.
  const {
    documents: savedDocuments,
    loading: loadingDocuments,
  } = useTransactionDocuments(editData?.id, open && Boolean(editData?.id));

  const keptDocuments = useMemo(
    () => savedDocuments.filter((doc) => !documentsToDelete.includes(doc.id)),
    [savedDocuments, documentsToDelete],
  );
  const markedDocuments = useMemo(
    () => savedDocuments.filter((doc) => documentsToDelete.includes(doc.id)),
    [savedDocuments, documentsToDelete],
  );

  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [payeeName, setPayeeName] = useState("");
  const [payeeAccount, setPayeeAccount] = useState("");
  const [payeeBank, setPayeeBank] = useState("");
  const [recurrenceType, setRecurrenceType] =
    useState<TransferRecurrenceType>("reminder");
  const [frequency, setFrequency] = useState<TransferFrequency>("monthly");
  /** Solo UI: se convierte a días al enviar si frequency === "custom". */
  const [customIntervalAmount, setCustomIntervalAmount] = useState(1);
  const [customIntervalUnit, setCustomIntervalUnit] = useState<
    "days" | "weeks" | "months" | "years"
  >("years");
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [keepOpenAfterSave, setKeepOpenAfterSave] = useState(false);
  /** El formulario de creación se abrió con los datos de la última transacción. */
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (editData) {
      const rawCat = editData.category;
      const categoryId =
        categories.find((c) => c.id === rawCat)?.id ??
        categories.find((c) => c.name === rawCat)?.id ??
        "";

      setPrefilled(false);
      setForm({
        date: editData.date?.slice(0, 10) ?? "",
        type: editData.type,
        amount: editData.amount,
        category: categoryId,
        account: editData.account,
        description: editData.description ?? "",
      });

      // Para no romper el flujo de edición, el módulo recurrente se deshabilita en edición.
      setRecurringEnabled(false);
      setPayeeName("");
      setPayeeAccount("");
      setPayeeBank("");
      setRecurrenceType("reminder");
      setFrequency("monthly");
      setCustomIntervalAmount(1);
      setCustomIntervalUnit("years");
      setDayOfMonth(1);
    } else {
      // Creación: se reponen fecha, tipo, cuenta y categoría del último registro
      // (monto y descripción siempre en blanco).
      const defaults = resolveTransactionDefaults(
        loadTransactionDefaults(),
        accounts,
        categories,
      );
      setPrefilled(
        Boolean(
          defaults.date ||
            defaults.type ||
            defaults.account ||
            defaults.category,
        ),
      );

      setForm({
        date: defaults.date,
        type: defaults.type,
        amount: null as number | null,
        category: defaults.category,
        account: defaults.account,
        description: "",
      });

      setRecurringEnabled(false);
      setPayeeName("");
      setPayeeAccount("");
      setPayeeBank("");
      setRecurrenceType("reminder");
      setFrequency("monthly");
      setCustomIntervalAmount(1);
      setCustomIntervalUnit("years");
      setDayOfMonth(1);
    }

  }, [editData, open, categories, accounts]);

  const markDocumentForDelete = (documentId: string) =>
    setDocumentsToDelete((prev) =>
      prev.includes(documentId) ? prev : [...prev, documentId],
    );

  const restoreDocument = (documentId: string) =>
    setDocumentsToDelete((prev) => prev.filter((id) => id !== documentId));

  function customIntervalToDays(amount: number, unit: typeof customIntervalUnit): number {
    const n = Math.max(1, Math.floor(Number(amount)) || 1);
    switch (unit) {
      case "days":
        return n;
      case "weeks":
        return n * 7;
      case "months":
        return n * 30;
      case "years":
        return n * 365;
      default:
        return n;
    }
  }

  // Categorías filtradas por tipo: ingreso → solo categorías tipo ingreso, egreso → solo tipo egreso, transferencia → todas
  const filteredCategories = React.useMemo(() => {
    if (!form.type || form.type === "transferencia") return categories;
    return categories.filter((cat) => (cat.type ?? "egreso") === form.type);
  }, [categories, form.type]);

  // Al cambiar el tipo, limpiar categoría si ya no está en la lista filtrada
  const handleTypeChange = (v: string) => {
    setForm((f) => {
      const next = { ...f, type: v };
      if (v === "ingreso" || v === "egreso") {
        const stillValid = categories.some(
          (c) => (c.type ?? "egreso") === v && f.category === c.id,
        );
        if (!stillValid) next.category = "";
      }
      return next;
    });
  };

  /** Vacía el formulario y olvida el contexto recordado hasta el próximo guardado. */
  const clearPrefill = () => {
    clearTransactionDefaults();
    setPrefilled(false);
    setForm({
      date: "",
      type: "",
      amount: null,
      category: "",
      account: "",
      description: "",
    });
  };

  const resetFormForNextTransaction = () => {
    setForm((prev) => ({
      ...prev,
      amount: null,
      description: "",
    }));
    setFiles([]);
    setDocumentsToDelete([]);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={editData ? "Editar transacción" : "Crear transacción"}
      description="Gestiona aquí tu transacción"
      className="max-w-xl"
      headerIcon={
        <Receipt className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />
      }
    >
      <div className="relative">
        {(loading || uploading) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
            {uploading ? (
              <div className="w-64 max-w-[80%]">
                <ProgressBar label="Subiendo archivos…" value={uploadPercent} />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Cargando…</span>
            )}
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const amount = Number(form.amount);
            const description = form.description || undefined;

            if (recurringEnabled && !editData && onSubmitRecurring) {
              if (!Number.isFinite(amount) || amount <= 0) {
                toast.error("Ingresa un monto válido para la transferencia");
                return;
              }
              if (!form.account) {
                toast.error("Selecciona una cuenta para la transferencia");
                return;
              }
              if (!payeeName.trim()) {
                toast.error("El destinatario es requerido");
                return;
              }

              if (frequency === "custom") {
                const days = customIntervalToDays(
                  customIntervalAmount,
                  customIntervalUnit
                );
                if (days < 1 || days > 3660) {
                  toast.error("El intervalo debe estar entre 1 y 3660 días");
                  return;
                }
              }

              const templateName =
                (description?.trim() ? description.trim() : payeeName.trim()).slice(
                  0,
                  200
                );

              const payload = {
                amount,
                fromAccountId: form.account,
                templateName,
                payeeName: payeeName.trim(),
                payeeAccount: payeeAccount.trim() || undefined,
                payeeBank: payeeBank.trim() || undefined,
                recurrenceType,
                frequency,
                customIntervalDays:
                  frequency === "custom"
                    ? customIntervalToDays(
                        customIntervalAmount,
                        customIntervalUnit
                      )
                    : undefined,
                dayOfMonth,
                transactionType: form.type as "ingreso" | "egreso" | "transferencia",
                description,
                files,
              };

              await onSubmitRecurring(payload);
              return;
            }

            if (files.length > MAX_DOCUMENTS_PER_REQUEST) {
              toast.error(
                `Máximo ${MAX_DOCUMENTS_PER_REQUEST} archivos nuevos por guardado`,
              );
              return;
            }
            if (documentsToDelete.length > MAX_DOCUMENTS_TO_DELETE) {
              toast.error(
                `Máximo ${MAX_DOCUMENTS_TO_DELETE} adjuntos a eliminar por guardado`,
              );
              return;
            }

            const categoryName =
              categories.find((c) => c.id === form.category)?.name ??
              form.category;

            const submitResult = await onSubmit(
              {
                ...form,
                category: categoryName,
                amount,
                description,
                files,
                ...(documentsToDelete.length ? { documentsToDelete } : {}),
                type: form.type as CreateTransactionDto["type"],
              },
              editData?.id,
              { keepOpen: keepOpenAfterSave && !editData }
            );

            const success = submitResult !== false;

            if (success && !editData) {
              // El próximo "crear transacción" arranca con este mismo contexto.
              saveTransactionDefaults({
                date: form.date,
                type: form.type,
                account: form.account,
                category: form.category,
              });
            }

            if (success && keepOpenAfterSave && !editData) {
              resetFormForNextTransaction();
            }
          }}
          className="space-y-4"
        >
          {!editData && prefilled && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Datos de tu última transacción. Revisa la fecha antes de guardar.
              </p>
              <button
                type="button"
                onClick={clearPrefill}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-foreground transition hover:bg-white/60"
              >
                Limpiar
              </button>
            </div>
          )}

          <div>
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Tipo
            </span>
            <div
              role="radiogroup"
              aria-label="Tipo de transacción"
              className="grid grid-cols-3 gap-2"
            >
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = form.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => handleTypeChange(opt.value)}
                    className={cn(
                      "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition",
                      "sm:min-h-0 sm:flex-row sm:gap-1.5 sm:py-2.5",
                      isActive
                        ? opt.activeClass
                        : "border-border bg-white text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Monto
            </label>
            <CurrencyField
              value={form.amount}
              onChange={(value) =>
                setForm((f) => ({ ...f, amount: value }))
              }
              className="h-12 text-lg font-semibold tabular-nums sm:h-10 sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <SavvyDatePicker
                label="Fecha"
                value={form.date ? new Date(`${form.date}T00:00:00`) : null}
                onChange={(date) =>
                  setForm((f) => ({
                    ...f,
                    date: date ? date.toISOString().slice(0, 10) : "",
                  }))
                }
                triggerClassName={FIELD_MOBILE}
              />
            </div>

            <div>
              <SavvySelect
                label="Cuenta"
                value={form.account}
                onChange={(v) => setForm((f) => ({ ...f, account: v }))}
                placeholder="Selecciona una cuenta"
                options={accounts.map((acc) => ({
                  label: acc.name,
                  value: acc.id,
                }))}
                triggerClassName={FIELD_MOBILE}
              />
            </div>

            <div className="sm:col-span-2">
              <SavvySelect
                label="Categoría"
                value={form.category}
                onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                placeholder={
                  form.type
                    ? form.type === "transferencia"
                      ? "Selecciona una categoría"
                      : `Solo categorías de ${form.type === "ingreso" ? "ingresos" : "gastos"}`
                    : "Primero elige el tipo"
                }
                options={filteredCategories.map((cat) => ({
                  label: cat.name,
                  value: cat.id,
                }))}
                triggerClassName={FIELD_MOBILE}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Descripción
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Ej. Compra supermercado"
              className="block w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-base transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/25 sm:text-sm"
              rows={3}
            />
          </div>

      {/** Toggle recurrente (solo en creación, no en edición) */}
      {!editData && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={recurringEnabled}
              onChange={(e) => setRecurringEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-emerald-600"
            />
            <span className="text-sm font-medium text-foreground">
              Pago recurrente
            </span>
          </label>

          {recurringEnabled && (
            <div className="space-y-3 rounded-xl border border-accent/30 bg-accent/10 p-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Destinatario
                </label>
                <input
                  type="text"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-base focus:border-accent focus:ring-2 focus:ring-accent/30 sm:h-10 sm:text-sm"
                  placeholder="Ej. Gas Natural"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Número de cuenta
                </label>
                <input
                  type="text"
                  value={payeeAccount}
                  onChange={(e) => setPayeeAccount(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-base focus:border-accent focus:ring-2 focus:ring-accent/30 sm:h-10 sm:text-sm"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Banco
                </label>
                <input
                  type="text"
                  value={payeeBank}
                  onChange={(e) => setPayeeBank(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-base focus:border-accent focus:ring-2 focus:ring-accent/30 sm:h-10 sm:text-sm"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Frecuencia
                </p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { label: "Semanal", value: "weekly" },
                    { label: "Quincenal", value: "biweekly" },
                    { label: "Mensual", value: "monthly" },
                    { label: "Bimestral", value: "bimonthly" },
                    { label: "Personalizado", value: "custom" },
                  ] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setFrequency(opt.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        frequency === opt.value
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-white text-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {frequency === "custom" && (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <div className="min-w-[5rem] flex-1">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Cada
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={3660}
                        value={customIntervalAmount}
                        onChange={(e) =>
                          setCustomIntervalAmount(Number(e.target.value))
                        }
                        className="h-11 w-full rounded-xl border border-border bg-white px-3 text-base focus:border-accent focus:ring-2 focus:ring-accent/30 sm:h-10 sm:text-sm"
                      />
                    </div>
                    <div className="min-w-[8rem] flex-1">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Unidad
                      </label>
                      <select
                        value={customIntervalUnit}
                        onChange={(e) =>
                          setCustomIntervalUnit(
                            e.target.value as typeof customIntervalUnit
                          )
                        }
                        className="h-11 w-full rounded-xl border border-border bg-white px-3 text-base focus:border-accent focus:ring-2 focus:ring-accent/30 sm:h-10 sm:text-sm"
                      >
                        <option value="days">Día(s)</option>
                        <option value="weeks">Semana(s)</option>
                        <option value="months">Mes(es) (30 días)</option>
                        <option value="years">Año(s) (365 días)</option>
                      </select>
                    </div>
                    <p className="w-full text-xs text-muted-foreground">
                      ≈{" "}
                      <span className="font-semibold text-accent-foreground">
                        {customIntervalToDays(
                          customIntervalAmount,
                          customIntervalUnit
                        )}{" "}
                        días
                      </span>{" "}
                      entre cada vencimiento
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Tipo
                </p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { label: "Recordatorio", value: "reminder" },
                    { label: "Automático", value: "automatic" },
                  ] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setRecurrenceType(opt.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        recurrenceType === opt.value
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-white text-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {frequency !== "custom" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Día del mes (1-28)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-border bg-white px-3 text-base focus:border-accent focus:ring-2 focus:ring-accent/30 sm:h-10 sm:text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 border-t border-border pt-4">
        <p className="text-sm font-semibold text-foreground">Documentos</p>

        {/* Adjuntos ya guardados: se marcan para borrar y se eliminan al guardar,
            así cancelar la edición no pierde archivos. */}
        {editData && (
          <div className="space-y-2">
            {loadingDocuments ? (
              <p className="text-sm text-muted-foreground">
                Cargando archivos adjuntos…
              </p>
            ) : savedDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Esta transacción no tiene archivos adjuntos.
              </p>
            ) : null}

            {keptDocuments.length > 0 && (
              <FileList
                files={keptDocuments.map((doc) => ({
                  name: doc.name,
                  size: doc.size,
                  url: doc.url,
                }))}
                onRemove={(index) =>
                  markDocumentForDelete(keptDocuments[index].id)
                }
              />
            )}

            {markedDocuments.length > 0 && (
              <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-700">
                  {markedDocuments.length} archivo(s) se eliminarán al guardar
                </p>
                <ul className="space-y-1">
                  {markedDocuments.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-red-700 line-through">
                        {doc.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => restoreDocument(doc.id)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                        Restaurar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <FileUploader
          maxFiles={MAX_DOCUMENTS_PER_REQUEST}
          maxSize={MAX_DOCUMENT_SIZE}
          accept={DOCUMENT_ACCEPT}
          label="Arrastra aquí tus PDFs, DOCX, imágenes o audios"
          disabled={uploading}
          onFilesChange={(newFiles) =>
            setFiles((prev) => [...prev, ...newFiles])
          }
        />

        {/* Archivos nuevos pendientes de subir */}
        <FileList
          files={files}
          onRemove={(index) =>
            setFiles((current) => current.filter((_, i) => i !== index))
          }
        />
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        {!editData && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={keepOpenAfterSave}
              onChange={(e) => setKeepOpenAfterSave(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-emerald-600"
            />
            <span className="text-sm text-muted-foreground">
              Guardar y dejar este formulario abierto para agregar otra
            </span>
          </label>
        )}
      </div>

      {/* Acciones siempre a la vista en móvil: el formulario es largo y el botón
          principal quedaba al final del scroll. */}
      <div className="sticky bottom-0 -mx-6 -mb-6 flex gap-2 border-t border-border bg-white px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:mb-0 sm:justify-end sm:gap-3 sm:border-0 sm:px-0 sm:pb-0 sm:pt-0">
        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          className="h-11 flex-1 rounded-lg border-slate-200 font-normal text-foreground hover:bg-slate-50 sm:h-9 sm:flex-none"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="default"
          disabled={loading || uploading}
          className="h-11 flex-1 rounded-lg border-0 bg-[#0B1829] font-normal text-white hover:bg-[#0B1829]/90 focus-visible:ring-[#00C49A]/40 disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:flex-none"
        >
          {uploading
            ? "Subiendo archivos…"
            : editData
              ? "Guardar cambios"
              : keepOpenAfterSave
                ? "Guardar y agregar otra"
                : "Guardar"}
        </Button>
      </div>
    </form>
      </div>
    </Modal>
  );
}
