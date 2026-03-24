import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import FileUploader from "@/components/File/FileUploader";
import FileList from "@/components/File/FileList";
import SavvyBannerLight from "@/components/Banner/SavvyBannerLight";
import SavvyDatePicker from "@/components/SavvyDatePicker/SavvyDatePicker";
import SavvySelect from "@/components/Select/Select";
import { CreateTransactionDto, Transaction } from "../../types/transactions.types";
import { Account, Category } from "../../types/catalog.types";
import { useCategories } from "../../../categories/hooks/useCategories";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import type { TransferFrequency, TransferRecurrenceType } from "@/features/transfer-templates/types/transfer.types";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTransactionDto, editingId?: string) => void;
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
}: TransactionModalProps) {
  const [form, setForm] = useState({
    date: "",
    type: "",
    amount: null as number | null,
    category: "",
    account: "",
    description: "",
  });
  // En el flujo actual los archivos precargados están deshabilitados,
  // por lo que trabajamos únicamente con File[].
  const [files, setFiles] = useState<File[]>([]);

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

  useEffect(() => {
    if (editData) {
      setForm({
        date: editData.date?.slice(0, 10) ?? "",
        type: editData.type,
        amount: editData.amount,
        category: editData.category,
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
      setForm({
        date: "",
        type: "",
        amount: null as number | null,
        category: "",
        account: "",
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

    // setFiles(preloadedFiles);
  }, [editData, open]);

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
          (c) => (c.type ?? "egreso") === v && (f.category === c.id || f.category === c.name)
        );
        if (!stillValid) next.category = "";
      }
      return next;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity">

      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-lg bg-white/70 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <span className="text-sm text-gray-600">Cargando…</span>
        </div>
      )}


      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 animate-scaleIn max-h-[90vh] overflow-y-auto scrollbar-clean">
        {/* Título */}


        <div className="flex justify-end w-full mb-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-lg transition cursor-pointer"
            title="Cerrar"
          >
            <XMarkIcon className="w-5 h-5 text-red-600" />
          </button>
        </div>

        <SavvyBannerLight
          title={editData ? "Editar transacción" : "Crear transacción"}
          subtitle="Gestiona aqui tu transaccion"
        />

        {/* Formulario */}
        <form
          onSubmit={(e) => {
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

              onSubmitRecurring(payload);
              return;
            }

            onSubmit(
              {
                ...form,
                amount,
                description,
                files,
                type: form.type as CreateTransactionDto["type"],
              },
              editData?.id
            );
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
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
              />
            </div>

            <div>
              <SavvySelect
                label="Tipo"
                value={form.type}
                onChange={handleTypeChange}
                placeholder="Selecciona un tipo"
                options={[
                  { label: "Ingreso", value: "ingreso" },
                  { label: "Egreso", value: "egreso" },
                  { label: "Transferencia", value: "transferencia" },
                ]}
              />
            </div>

            {/* Cuenta */}
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
              />
            </div>

            <div>
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
                  value: cat.name,
                }))}
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto
              </label>

              <CurrencyField
                value={form.amount}
                onChange={(value) =>
                  setForm((f) => ({ ...f, amount: value }))
                }
              />
            </div>
          </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-bold">
          Descripción
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          className="mt-1 block w-full rounded-xl border-1 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 text-sm px-3 py-2 transition placeholder-gray-400 bg-white resize-none"
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
              className="h-4 w-4 rounded border-gray-300 accent-emerald-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Pago recurrente
            </span>
          </label>

          {recurringEnabled && (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Destinatario
                </label>
                <input
                  type="text"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="Ej. Gas Natural"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Número de cuenta
                </label>
                <input
                  type="text"
                  value={payeeAccount}
                  onChange={(e) => setPayeeAccount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Banco
                </label>
                <input
                  type="text"
                  value={payeeBank}
                  onChange={(e) => setPayeeBank(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">
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
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {frequency === "custom" && (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <div className="min-w-[5rem] flex-1">
                      <label className="mb-1 block text-xs font-medium text-gray-600">
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
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      />
                    </div>
                    <div className="min-w-[8rem] flex-1">
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Unidad
                      </label>
                      <select
                        value={customIntervalUnit}
                        onChange={(e) =>
                          setCustomIntervalUnit(
                            e.target.value as typeof customIntervalUnit
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      >
                        <option value="days">Día(s)</option>
                        <option value="weeks">Semana(s)</option>
                        <option value="months">Mes(es) (30 días)</option>
                        <option value="years">Año(s) (365 días)</option>
                      </select>
                    </div>
                    <p className="w-full text-xs text-slate-600">
                      ≈{" "}
                      <span className="font-semibold text-emerald-800">
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
                <p className="mb-2 text-sm font-medium text-gray-700">
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
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {frequency !== "custom" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Día del mes (1-28)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col justify-center border-t border-gray-300">
        <h1 className="text-md font-bold py-2">Subir Documentos</h1>

        <FileUploader
          maxFiles={5}
          maxSize={10 * 1024 * 1024}
          accept={{
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              [".docx"],
            "image/*": [".jpg", ".jpeg", ".png"],
          }}
          label="Arrastra aquí tus PDFs, DOCX o imágenes"
          onFilesChange={(newFiles) =>
            setFiles((prev) => [...prev, ...newFiles])
          }
        />

        {/* Mostrar archivos seleccionados */}
        <FileList
          files={files}
          onRemove={(index) =>
            setFiles((current) => current.filter((_, i) => i !== index))
          }
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-300">
        <div>
          <Button
            onClick={onClose}
            variant="outline"
            className={`
              w-full justify-start text-left font-normal rounded-xl
            `}
          >
            Cancelar
          </Button>
        </div>

        <div>
          <Button
            type="submit"
            variant="default"
            className={`
              w-full justify-start text-left font-normal rounded-xl
            `}
          >
            Guardar
          </Button>
        </div>

      </div>
    </form>
      </div >
    </div >
  );
}
