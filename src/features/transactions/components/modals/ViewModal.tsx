"use client";

import React, { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import FileList from "@/components/File/FileList";
import Modal from "@/components/Modal/Modal";
import { getBearerAuthHeaders } from "@/lib/api-auth";
import { FlowIconTransaction } from "../FlowIconTransaction";
import { Button } from "@/components/ui/shadcn-button";

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
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={strong ? "font-semibold text-foreground" : "text-foreground"}>
        {value || "-"}
      </p>
    </div>
  );
}

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
          },
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
          {loadingFiles ? (
            <p className="text-sm text-muted-foreground">Cargando archivos…</p>
          ) : null}
          <FileList
            files={files}
            onRemove={(index) =>
              setFiles((current) => current.filter((_, i) => i !== index))
            }
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
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
          <Button type="button" variant="default" className="rounded-xl" onClick={onClose}>
            Cerrar
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
