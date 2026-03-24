import React, { useState, Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import FileList from "@/components/File/FileList";
import { getBearerAuthHeaders } from "@/lib/api-auth";
import { FlowIconTransaction } from "../FlowIconTransaction";

type DocumentItem = {
  id: string;
  name: string;
  url: string;
  size: number;
};

function Info({
  label,
  value,
  strong = false,
}: {
  label: string;
  value?: string;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={strong ? "font-semibold text-gray-900" : "text-gray-700"}>
        {value || "-"}
      </p>
    </div>
  );
}

function getTypeClass(type: string) {
  const base = "inline-block px-2 py-0.5 rounded-full text-xs font-medium";
  if (type === "egreso")
    return `${base} bg-red-100 text-red-700 border border-red-300`;
  if (type === "ingreso")
    return `${base} bg-green-100 text-green-700 border border-green-300`;
  if (type === "transaccion")
    return `${base} bg-blue-100 text-blue-700 border border-blue-300`;
  return `${base} bg-gray-100 text-gray-600 border border-gray-300`;
}

export default function ViewModal({
  open,
  onClose,
  data,
  onDelete,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  data: any | null;
  onDelete?: (id: string) => void;
  accounts?: { id: string; name: string }[];
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [files, setFiles] = useState<DocumentItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    if (!open || !data?.id) return;

    const controller = new AbortController();

    const fetchDocuments = async () => {
      try {
        setLoadingFiles(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/transactions/${data.id}/documents`,
          {
            signal: controller.signal,
            headers: getBearerAuthHeaders(),
          }
        );

        if (!res.ok) throw new Error();

        const docs = await res.json();
        setFiles(docs);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error cargando documentos", error);
          setFiles([]);
        }
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchDocuments();

    return () => controller.abort();
  }, [open, data?.id]);

  if (!open || !data) return null;

  const description: string = data.description ?? "";
  const transferTemplateId =
    typeof description === "string"
      ? description.match(/transfer_template_id:([a-zA-Z0-9-]+)/)?.[1] ?? null
      : null;

  const accountId = data.account as string | undefined;
  const accountName =
    accounts?.find((a) => a.id === accountId)?.name ?? accountId ?? "-";

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="motion-safe:ease-out motion-safe:duration-300"
            enterFrom="opacity-0 translate-y-4 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="motion-safe:ease-in motion-safe:duration-200"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-4 scale-95"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="motion-safe:ease-out motion-safe:duration-300"
                enterFrom="opacity-0 translate-y-4 scale-95"
                enterTo="opacity-100 translate-y-0 scale-100"
                leave="motion-safe:ease-in motion-safe:duration-200"
                leaveFrom="opacity-100 translate-y-0 scale-100"
                leaveTo="opacity-0 translate-y-4 scale-95"
              >
                <Dialog.Panel className="relative bg-white rounded-lg shadow-lg w-full max-w-xl p-6 text-left">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Detalle de transacción
                      </h2>
                      <p className="text-sm text-gray-500 break-all">
                        ID: {data.id}
                      </p>
                    </div>
                    <div className="flex justify-center gap-2 align-center w-32">
                      <div>
                        <FlowIconTransaction type={data.type} />
                      </div>
                      <div>
                        <span className={getTypeClass(data.type)}>{data.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <Info label="Fecha" value={data.date?.slice(0, 10)} />
                    <Info
                      label="Monto"
                      value={new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                      }).format(data.amount)}
                      strong
                    />
                    <Info label="Categoría" value={data.category} />
                    <Info label="Cuenta" value={accountName} />
                    <Info label="Descripción" value={data.description ?? "-"} />
                    <Info
                      label="Plantilla recurrente"
                      value={transferTemplateId ?? "-"}
                    />
                  </div>

                  <div>
                    <FileList
                      files={files}
                      onRemove={(index) =>
                        setFiles((current) =>
                          current.filter((_, i) => i !== index)
                        )
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    {onDelete && (
                      <button
                        onClick={() => setDeleteOpen(true)}
                        className="px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="px-3 py-1 border rounded"
                    >
                      Cerrar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Delete Confirmation Modal */}
      <Transition.Root show={deleteOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setDeleteOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 text-center">
                <Dialog.Title className="text-lg font-semibold mb-2">
                  ¿Eliminar transacción?
                </Dialog.Title>
                <p className="mb-4 text-gray-600">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setDeleteOpen(false)}
                    className="px-4 py-1 border rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      setDeleteOpen(false);
                      onClose();
                      onDelete && onDelete(data.id);
                    }}
                    className="px-4 py-1 bg-red-600 text-white rounded"
                  >
                    Aceptar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
