import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { format, parse } from "date-fns";
import {
  CheckCircle2,
  Paperclip,
  Receipt,
  Repeat,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import FileUploader from "@/components/File/FileUploader";
import FileList from "@/components/File/FileList";
import Modal from "@/components/Modal/Modal";
import { ProgressBar } from "@/components/ProgressBar";
import {
  CreateTransactionDto,
  Transaction,
  TransactionFormPayload,
} from "../../types/transactions.types";
import { Account, Category } from "../../types/catalog.types";
import { Button } from "@/components/ui/shadcn-button";
import { cn } from "@/lib/utils";
import type { TransferFrequency, TransferRecurrenceType } from "@/features/transfer-templates/types/transfer.types";
import { intervalToDays } from "@/features/transfer-templates/utils/interval";
import { useTransactionDocuments } from "../../hooks/useTransactionDocuments";
import SmartTransactionCapture from "../SmartTransactionCapture";
import type { DetectedTransaction } from "../../services/ai-transaction.service";
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
import TypeSwitch from "../transaction-form/TypeSwitch";
import AmountHero from "../transaction-form/AmountHero";
import CategoryChips from "../transaction-form/CategoryChips";
import AccountChips from "../transaction-form/AccountChips";
import DateQuickPick from "../transaction-form/DateQuickPick";
import FormSection from "../transaction-form/FormSection";
import ExpandableRow from "../transaction-form/ExpandableRow";
import SwitchIndicator from "../transaction-form/Switch";
import RecurringFields, {
  EMPTY_RECURRING,
  type RecurringForm,
} from "../transaction-form/RecurringFields";
import {
  TYPE_THEME,
  enterAnimation,
  isTransactionKind,
} from "../transaction-form/theme";

/** Si no hay un tipo recordado se arranca en gasto: es el registro más común. */
const DEFAULT_TYPE = "egreso";

type FieldKey = "type" | "amount" | "category" | "account" | "date" | "payee";

const FIELD_LABELS: Record<FieldKey, string> = {
  type: "tipo",
  amount: "monto",
  category: "categoría",
  account: "cuenta",
  date: "fecha",
  payee: "destinatario",
};

const ACCOUNT_TITLES: Record<string, string> = {
  egreso: "¿Con qué cuenta pagaste?",
  ingreso: "¿A qué cuenta entró?",
  transferencia: "¿Desde qué cuenta?",
};

const FREQUENCY_LABELS: Record<TransferFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  bimonthly: "Bimestral",
  custom: "Personalizado",
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const todayIso = () => format(new Date(), "yyyy-MM-dd");

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
    /** Descripción de la plantilla (la de la transacción). */
    templateDescription?: string;
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

  // Lo que se reinicia al abrir/cerrar o al cambiar de transacción (adjuntos
  // pendientes, secciones abiertas, errores). Se ajusta en render y no en el
  // efecto del formulario para no perder lo que el usuario arrastró cuando
  // llegan los catálogos.
  const sessionKey = `${open ? "open" : "closed"}:${editData?.id ?? "new"}`;
  const [lastSessionKey, setLastSessionKey] = useState(sessionKey);
  const [aiOpen, setAiOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  /** Se intentó guardar con datos faltantes: se marcan las secciones. */
  const [showErrors, setShowErrors] = useState(false);
  if (lastSessionKey !== sessionKey) {
    setLastSessionKey(sessionKey);
    setFiles([]);
    setDocumentsToDelete([]);
    setAiOpen(false);
    setDocsOpen(false);
    setShowErrors(false);
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
  const [recurring, setRecurring] = useState<RecurringForm>(EMPTY_RECURRING);
  const [keepOpenAfterSave, setKeepOpenAfterSave] = useState(false);
  /** Sube al guardar y seguir: hace destellar el monto como confirmación. */
  const [savedFlash, setSavedFlash] = useState(0);
  /** El formulario de creación se abrió con los datos de la última transacción. */
  const [prefilled, setPrefilled] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // La recurrencia solo existe al crear; en edición queda apagada.
    setRecurringEnabled(false);
    setRecurring(EMPTY_RECURRING);

    if (editData) {
      setPrefilled(false);
      setForm({
        date: editData.date?.slice(0, 10) ?? "",
        type: editData.type,
        amount: editData.amount,
        category: editData.categoryId ?? "",
        account: editData.account,
        description: editData.description ?? "",
      });
      return;
    }

    // Creación: se reponen fecha, tipo, cuenta y categoría del último registro
    // (monto y descripción siempre en blanco).
    const defaults = resolveTransactionDefaults(
      loadTransactionDefaults(),
      accounts,
      categories.filter((c) => c.isActive !== false),
    );
    setPrefilled(
      Boolean(
        defaults.date || defaults.type || defaults.account || defaults.category,
      ),
    );

    setForm({
      date: defaults.date || todayIso(),
      type: defaults.type || DEFAULT_TYPE,
      amount: null as number | null,
      category: defaults.category,
      account: defaults.account,
      description: "",
    });
  }, [editData, open, categories, accounts]);

  const markDocumentForDelete = (documentId: string) =>
    setDocumentsToDelete((prev) =>
      prev.includes(documentId) ? prev : [...prev, documentId],
    );

  const restoreDocument = (documentId: string) =>
    setDocumentsToDelete((prev) => prev.filter((id) => id !== documentId));

  // Categorías filtradas por tipo: ingreso → solo categorías tipo ingreso, egreso → solo tipo egreso, transferencia → todas
  const activeCategories = React.useMemo(
    () => categories.filter((cat) => cat.isActive !== false),
    [categories],
  );

  // Las inactivas no se ofrecen, salvo la que ya tiene la transacción que se edita.
  const filteredCategories = React.useMemo(() => {
    const usable = categories.filter(
      (cat) => cat.isActive !== false || cat.id === editData?.categoryId,
    );
    if (!form.type || form.type === "transferencia") return usable;
    return usable.filter((cat) => (cat.type ?? "egreso") === form.type);
  }, [categories, form.type, editData?.categoryId]);

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
      date: todayIso(),
      type: DEFAULT_TYPE,
      amount: null,
      category: "",
      account: "",
      description: "",
    });
  };

  /** Vuelca en el formulario solo los campos que la IA logró deducir. */
  const applyDetected = (detected: DetectedTransaction) => {
    setForm((f) => ({
      ...f,
      ...(detected.type ? { type: detected.type } : {}),
      ...(detected.amount != null ? { amount: detected.amount } : {}),
      ...(detected.date ? { date: detected.date } : {}),
      ...(detected.accountId ? { account: detected.accountId } : {}),
      ...(detected.categoryId ? { category: detected.categoryId } : {}),
      ...(detected.description ? { description: detected.description } : {}),
    }));
    // El aviso de "última transacción" ya no describe lo que hay en pantalla.
    setPrefilled(false);
    // En móvil los campos quedan bajo el pliegue: se llevan a la vista para revisarlos.
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleRecurring = () => {
    if (!recurringEnabled && form.date) {
      // Por defecto vence el mismo día del mes que este pago (máx. 28).
      const day = parse(form.date, "yyyy-MM-dd", new Date()).getDate();
      setRecurring((r) => ({ ...r, dayOfMonth: Math.min(28, day || 1) }));
    }
    setRecurringEnabled(!recurringEnabled);
  };

  const resetFormForNextTransaction = () => {
    setForm((prev) => ({
      ...prev,
      amount: null,
      description: "",
    }));
    setFiles([]);
    setDocumentsToDelete([]);
    setShowErrors(false);
    setSavedFlash((n) => n + 1);
    document.getElementById("tx-amount")?.focus();
  };

  const isRecurring = recurringEnabled && !editData && Boolean(onSubmitRecurring);

  // Lo obligatorio según el modo: el pago recurrente se registra hoy y usa el
  // nombre del pago como categoría, así que pide destinatario en su lugar.
  const requiredFields: FieldKey[] = isRecurring
    ? ["type", "amount", "account", "payee"]
    : ["type", "amount", "category", "account", "date"];
  const missing = requiredFields.filter((key) => {
    switch (key) {
      case "type":
        return !form.type;
      case "amount":
        return !(Number(form.amount) > 0);
      case "category":
        return !form.category;
      case "account":
        return !form.account;
      case "date":
        return !form.date;
      case "payee":
        return !recurring.payeeName.trim();
    }
  });
  const hasError = (key: FieldKey) => showErrors && missing.includes(key);
  const progress = Math.round(
    ((requiredFields.length - missing.length) / requiredFields.length) * 100,
  );

  const theme = isTransactionKind(form.type) ? TYPE_THEME[form.type] : null;
  const amountValue = Number(form.amount);
  const submitLabel = uploading
    ? "Subiendo archivos…"
    : editData
      ? "Guardar cambios"
      : isRecurring
        ? "Guardar y programar"
        : `Guardar ${theme?.noun ?? "movimiento"}${
            amountValue > 0 ? ` · ${formatMoney(amountValue)}` : ""
          }`;

  const newFilesCount = files.length;
  const docsSubtitle = editData
    ? loadingDocuments
      ? "Cargando adjuntos…"
      : `${keptDocuments.length + newFilesCount} adjunto(s)${
          markedDocuments.length ? ` · ${markedDocuments.length} por eliminar` : ""
        }`
    : newFilesCount
      ? `${newFilesCount} archivo(s) listos para subir`
      : "Factura, recibo, foto o audio";

  const recurringSubtitle = recurringEnabled
    ? `${FREQUENCY_LABELS[recurring.frequency]} · ${
        recurring.payeeName.trim() || "falta a quién le pagas"
      }`
    : "Arriendo, servicios, suscripciones…";

  // Cada bloque entra un poco después del anterior al abrir el formulario.
  let enterIndex = 0;
  const enter = () => enterAnimation(enterIndex++, 50);
  const withEnter = (className: string) => {
    const { className: animation, style } = enter();
    return { className: cn(className, animation), style };
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={editData ? "Editar transacción" : "Nueva transacción"}
      description="Registra un gasto, ingreso o transferencia"
      className="max-w-xl"
      headerIcon={
        <Receipt className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />
      }
    >
      <div className="relative">
        {(loading || uploading) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-mint" />
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
          ref={formRef}
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();

            if (missing.length > 0) {
              setShowErrors(true);
              const first = missing[0];
              document
                .getElementById(`tx-section-${first}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
              if (first === "amount") document.getElementById("tx-amount")?.focus();
              if (first === "payee") document.getElementById("tx-payee")?.focus();
              return;
            }

            const amount = Number(form.amount);
            const description = form.description || undefined;

            if (isRecurring && onSubmitRecurring) {
              if (recurring.frequency === "custom") {
                const days = intervalToDays(
                  recurring.customIntervalAmount,
                  recurring.customIntervalUnit,
                );
                if (days < 1 || days > 3660) {
                  toast.error("El intervalo debe estar entre 1 y 3660 días");
                  return;
                }
              }

              // Nombre corto para listas; el texto largo va en la descripción.
              const templateName = (
                recurring.name.trim() || recurring.payeeName.trim()
              ).slice(0, 200);

              await onSubmitRecurring({
                amount,
                fromAccountId: form.account,
                templateName,
                templateDescription: description?.trim().slice(0, 1000) || undefined,
                payeeName: recurring.payeeName.trim(),
                payeeAccount: recurring.payeeAccount.trim() || undefined,
                payeeBank: recurring.payeeBank.trim() || undefined,
                recurrenceType: recurring.recurrenceType,
                frequency: recurring.frequency,
                customIntervalDays:
                  recurring.frequency === "custom"
                    ? intervalToDays(
                        recurring.customIntervalAmount,
                        recurring.customIntervalUnit,
                      )
                    : undefined,
                dayOfMonth: recurring.dayOfMonth,
                transactionType: form.type as "ingreso" | "egreso" | "transferencia",
                description,
                files,
              });
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

            const { category: categoryId, ...formFields } = form;

            const submitResult = await onSubmit(
              {
                ...formFields,
                categoryId,
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
          className="space-y-6"
        >
          {/* Atajo: dictar o describir el movimiento y que la IA llene el resto */}
          {!editData && (
            <div {...enter()}>
            <ExpandableRow
              icon={Sparkles}
              iconClass="bg-mint/15 text-mint-dim"
              title="Dilo con tu voz"
              subtitle="Cuéntalo y llenamos el formulario por ti"
              open={aiOpen}
              onToggle={() => setAiOpen((v) => !v)}
              highlight
            >
              <SmartTransactionCapture
                categories={activeCategories}
                accounts={accounts}
                onDetected={applyDetected}
                disabled={loading || uploading}
              />
            </ExpandableRow>
            </div>
          )}

          <div id="tx-section-type" {...withEnter("space-y-3")}>
            <TypeSwitch value={form.type} onChange={handleTypeChange} />
            {!editData && prefilled && (
              <div className="flex items-center justify-between gap-2 px-1 text-xs text-gray-500">
                <span>Usamos los datos de tu último registro.</span>
                <button
                  type="button"
                  onClick={clearPrefill}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-semibold text-gray-600 transition hover:bg-gray-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Empezar de cero
                </button>
              </div>
            )}
          </div>

          <div {...enter()}>
          <AmountHero
            type={form.type}
            flashKey={savedFlash}
            value={form.amount}
            onChange={(value) => setForm((f) => ({ ...f, amount: value }))}
            autoFocus={!editData}
            error={hasError("amount")}
          />
          </div>

          {!isRecurring && (
            <div {...enter()}>
            <CategoryChips
              categories={filteredCategories}
              value={form.category}
              onChange={(category) => setForm((f) => ({ ...f, category }))}
              error={hasError("category")}
            />
            </div>
          )}

          <div {...enter()}>
          <AccountChips
            accounts={accounts}
            value={form.account}
            onChange={(account) => setForm((f) => ({ ...f, account }))}
            title={ACCOUNT_TITLES[form.type] ?? "¿Qué cuenta?"}
            error={hasError("account")}
          />
          </div>

          {!isRecurring && (
            <div {...enter()}>
            <DateQuickPick
              value={form.date}
              onChange={(date) => setForm((f) => ({ ...f, date }))}
              error={hasError("date")}
            />
            </div>
          )}

          <div {...enter()}>
          <FormSection id="tx-section-description" title="Nota" hint="(opcional)">
            <textarea
              name="description"
              aria-labelledby="tx-section-description-title"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Ej. Mercado de la semana"
              rows={2}
              className="block max-h-48 min-h-[4.5rem] w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-base transition [field-sizing:content] placeholder:text-gray-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25 sm:text-sm"
            />
          </FormSection>
          </div>

          <div {...withEnter("space-y-3")}>
            {!editData && onSubmitRecurring && (
              <ExpandableRow
                icon={Repeat}
                iconClass={recurringEnabled ? "bg-mint/15 text-mint-dim" : undefined}
                title="Repetir este pago"
                subtitle={recurringSubtitle}
                open={recurringEnabled}
                onToggle={toggleRecurring}
                trailing={<SwitchIndicator checked={recurringEnabled} />}
                highlight={hasError("payee")}
              >
                <RecurringFields
                  value={recurring}
                  onChange={(patch) => setRecurring((r) => ({ ...r, ...patch }))}
                  payeeError={hasError("payee")}
                  namePlaceholder={form.description.trim().slice(0, 60) || undefined}
                />
                <p className="mt-4 rounded-xl bg-mint/[0.06] px-3 py-2 text-xs text-gray-600">
                  El primer pago se registra hoy y los siguientes quedan en Transferencias.
                </p>
              </ExpandableRow>
            )}

            <ExpandableRow
              icon={Paperclip}
              iconClass={
                newFilesCount || keptDocuments.length ? "bg-mint/15 text-mint-dim" : undefined
              }
              title="Adjuntar documentos"
              subtitle={docsSubtitle}
              open={docsOpen}
              onToggle={() => setDocsOpen((v) => !v)}
            >
              <div className="space-y-3">
                {/* Adjuntos ya guardados: se marcan para borrar y se eliminan al guardar,
                    así cancelar la edición no pierde archivos. */}
                {editData && (
                  <div className="space-y-2">
                    {!loadingDocuments && savedDocuments.length === 0 ? (
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
                  label="Arrastra aquí tus comprobantes"
                  currentFiles={files}
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
            </ExpandableRow>
          </div>

          {!editData && !isRecurring && (
            <button
              type="button"
              role="switch"
              aria-checked={keepOpenAfterSave}
              onClick={() => setKeepOpenAfterSave((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50"
            >
              <span className="text-sm text-gray-600">
                Registrar otro movimiento al guardar
              </span>
              <SwitchIndicator checked={keepOpenAfterSave} />
            </button>
          )}

          {/* Barra fija: progreso, qué falta y el botón principal siempre a la vista. */}
          <div className="sticky bottom-0 z-10 -mx-6 -mb-6 border-t border-border bg-white/95 px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <div className="mb-2.5 flex items-center gap-3" aria-live="polite">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn(
                    "relative h-full overflow-hidden rounded-full transition-[width,background-color] duration-500 ease-out",
                    missing.length ? "bg-mint" : "bg-emerald-500"
                  )}
                  style={{ width: `${progress}%` }}
                >
                  {/* Brillo que recorre la barra cuando todo está completo. */}
                  {missing.length === 0 && (
                    <span
                      aria-hidden
                      className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent motion-safe:animate-[savvi-shine_1.2s_ease-out_1] motion-reduce:hidden"
                    />
                  )}
                </div>
              </div>
              {missing.length > 0 ? (
                <span
                  key={missing.join(",")}
                  className={cn(
                    "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300",
                    "shrink-0 text-xs",
                    showErrors ? "font-semibold text-rose-600" : "text-gray-500",
                  )}
                >
                  Falta: {missing.map((key) => FIELD_LABELS[key]).join(", ")}
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 animate-in fade-in-0 zoom-in-95 duration-200">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Todo listo
                </span>
              )}
            </div>

            <div className="flex gap-2 sm:justify-end">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="h-12 rounded-xl border-slate-200 px-4 font-medium text-foreground hover:bg-slate-50 sm:h-10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={loading || uploading}
                className={cn(
                  "h-12 min-w-0 flex-1 rounded-xl border-0 bg-[#0B1829] px-4 font-semibold text-white transition-all duration-300 hover:bg-[#0B1829]/90 focus-visible:ring-[#00C49A]/40 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none sm:h-10 sm:flex-none",
                  // Listo para guardar: se ilumina con el mint de marca.
                  missing.length === 0 && "shadow-lg shadow-mint/30 ring-2 ring-mint/60"
                )}
              >
                {missing.length === 0 && !uploading ? (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-mint motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:spin-in-90 motion-safe:duration-300"
                    aria-hidden
                  />
                ) : null}
                <span
                  key={submitLabel}
                  className="truncate motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
                >
                  {submitLabel}
                </span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
