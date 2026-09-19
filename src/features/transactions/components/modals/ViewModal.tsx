"use client";

import React, { useState } from "react";
import { Eye } from "lucide-react";
import FileList from "@/components/File/FileList";
import Modal from "@/components/Modal/Modal";
import { FlowIconTransaction } from "../FlowIconTransaction";
import { Button } from "@/components/ui/shadcn-button";
import { useTransactionDocuments } from "../../hooks/useTransactionDocuments";

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
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={strong ? "font-semibold text-foreground" : "text-foreground"}>
        {value || "-"}
      </p>
    </div>
  );
}

// type: string = "ingreso" | "egreso" | "transaccion" | string;
// type: TransactionType = "ingreso" | "egreso" | "transaccion";

function getTypeClass(type: string) {
  const base = "inline-block rounded-full px-2 py-0.5 text-xs font-medium";
  if (type === "egreso")
    return `${base} border border-red-300 bg-red-100 text-red-700`;
  if (type === "ingreso")
    return `${base} border border-accent/40 bg-accent/15 text-accent`;
  if (type === "transaccion")
    return `${base} border border-border bg-muted text-foreground`;
  return `${base} border border-border bg-muted text-muted-foreground`;
}

export default function ViewModal({
  open,
  onClose,
  data,
  onDelete,
  onEdit,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  data: any | null;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  accounts?: { id: string; name: string }[];
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  /** Adjunto pendiente de confirmar borrado (el borrado aquí es inmediato). */
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const {
    documents,
    loading: loadingFiles,
    deletingId,
    removeDocument,
  } = useTransactionDocuments(data?.id, open && Boolean(data?.id));

  if (!data) return null;

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
      <Modal
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title="Detalle de transacción"
        description={data.id ? `ID: ${data.id}` : undefined}
        className="max-w-xl"
        headerIcon={
          <Eye className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />
        }
      >
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0" />
          <div className="flex shrink-0 items-center gap-2">
            <FlowIconTransaction type={data.type} />
            <span className={getTypeClass(data.type)}>{data.type}</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
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

        <div className="mb-6">
          <p className="text-sm font-semibold text-foreground">Documentos</p>
          {loadingFiles ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Cargando archivos…
            </p>
          ) : documents.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Esta transacción no tiene archivos adjuntos.
            </p>
          ) : (
            <FileList
              files={documents.map((doc) => ({
                name: doc.name,
                size: doc.size,
                url: doc.url,
              }))}
              onRemove={(index) => {
                const doc = documents[index];
                if (doc) setDocumentToDelete({ id: doc.id, name: doc.name });
              }}
            />
          )}
          {deletingId ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Eliminando archivo…
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          {onDelete ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
            >
              Eliminar
            </Button>
          ) : null}
          {onEdit ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                onClose();
                onEdit(data.id);
              }}
            >
              Editar
            </Button>
          ) : null}
          <Button type="button" variant="default" className="rounded-xl" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(documentToDelete)}
        onOpenChange={(next) => {
          if (!next) setDocumentToDelete(null);
        }}
        title="¿Eliminar archivo?"
        description={
          documentToDelete
            ? `"${documentToDelete.name}" se borrará definitivamente del almacenamiento.`
            : undefined
        }
        className="max-w-sm"
        headerIcon={null}
      >
        <div className="flex justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setDocumentToDelete(null)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl"
            disabled={Boolean(deletingId)}
            onClick={async () => {
              const target = documentToDelete;
              setDocumentToDelete(null);
              if (target) await removeDocument(target.id);
            }}
          >
            Eliminar
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar transacción?"
        description="Esta acción no se puede deshacer."
        className="max-w-sm"
        headerIcon={null}
      >
        <div className="flex justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setDeleteOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl"
            onClick={() => {
              setDeleteOpen(false);
              onClose();
              onDelete?.(data.id);
            }}
          >
            Aceptar
          </Button>
        </div>
      </Modal>
    </>
  );
}
