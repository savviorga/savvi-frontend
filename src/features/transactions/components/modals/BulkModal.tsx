import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function BulkModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: any[]) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    let parsed;
    try {
      parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) throw new Error();
      setError(null);
      onSubmit(parsed);
    } catch {
      setError("JSON inválido. Debe ser un array de objetos.");
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 text-left">
                <button
                  type="button"
                  className="absolute top-3 right-3 text-gray-400 hover:text-muted-foreground"
                  onClick={onClose}
                  aria-label="Cerrar"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                <Dialog.Title className="text-lg font-semibold mb-4">
                  Carga masiva JSON
                </Dialog.Title>
                <p className="text-sm text-muted-foreground mb-2">
                  Pega un array JSON (ej. 10 transacciones).
                </p>
                <textarea
                  rows={12}
                  className="w-full border rounded p-2"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
                {error && (
                  <div className="text-red-600 text-sm mt-2">{error}</div>
                )}
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={onClose}
                    className="px-3 py-1 border rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-3 py-1 bg-primary text-white rounded"
                  >
                    Enviar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
