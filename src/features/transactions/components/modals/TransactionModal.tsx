import React, { useEffect, useState } from "react";
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

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTransactionDto, editingId?: string) => void;
  editData?: Transaction | null;
  categories: Category[];
  accounts: Account[];
  loading: boolean;
}

export default function TransactionModal({
  open,
  onClose,
  onSubmit,
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
  const [files, setFiles] = useState<
    (File | { name: string; url: string; size: number })[]
  >([]);

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
    } else {
      setForm({
        date: "",
        type: "",
        amount: null as number | null,
        category: "",
        account: "",
        description: "",
      });
    }

    // setFiles(preloadedFiles);
  }, [editData, open]);

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
            onSubmit(
              {
                ...form,
                amount: Number(form.amount),
                description: form.description || undefined,
                files: files,
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
