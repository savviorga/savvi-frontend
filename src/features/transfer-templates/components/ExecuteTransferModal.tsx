"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/shadcn-button";
import Modal from "@/components/Modal/Modal";
import FileUploader from "@/components/File/FileUploader";
import FileList from "@/components/File/FileList";
import { ProgressBar } from "@/components/ProgressBar";
import { CurrencyField } from "@/components/Inputs/CurrencyInput/CurrencyInput";
import { useS3Upload } from "@/hooks/useS3Upload";
import { TransactionService } from "@/features/transactions/services/transaction.service";
import ExpandableRow from "@/features/transactions/components/transaction-form/ExpandableRow";
import {
  DOCUMENT_ACCEPT,
  MAX_DOCUMENTS_PER_REQUEST,
  MAX_DOCUMENT_SIZE,
} from "@/lib/document-constraints";
import type { TransferTemplate } from "../types/transfer.types";
import { cleanTemplateName, formatIsoDate } from "../utils/schedule";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** `null` = el pago falló (el padre ya mostró el error) y el modal sigue abierto. */
export type ExecuteTransferResult = { transactionId?: string | null } | null;

export default function ExecuteTransferModal({
  open,
  onClose,
  template,
  initialAmount,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  template: TransferTemplate | null;
  initialAmount: number | null | undefined;
  /**
   * Registra el pago y devuelve la transacción creada. Los adjuntos los sube el
   * modal después (mismo flujo que al crear una transacción) y luego se cierra.
   */
  onConfirm: (payload: { amount: number; description?: string }) => Promise<ExecuteTransferResult>;
}) {
  const [amount, setAmount] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [docsOpen, setDocsOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const { uploadFiles, uploading, totalPercent } = useS3Upload();

  // Al abrir (o cambiar de plantilla) se reinicia el formulario. Se ajusta en
  // render, no en un efecto, para no pintar un frame con datos viejos.
  const sessionKey = `${open}:${template?.id ?? ""}`;
  const [lastSessionKey, setLastSessionKey] = useState("");
  if (open && lastSessionKey !== sessionKey) {
    setLastSessionKey(sessionKey);
    setAmount(initialAmount == null ? null : Number(initialAmount));
    setFiles([]);
    setDocsOpen(false);
  }

  const defaultDescription = useMemo(() => {
    if (!template) return undefined;
    return `Pago recurrente: ${template.name}`;
  }, [template]);

  const busy = paying || uploading;
  const canSubmit = !!template && amount != null && amount > 0 && !busy;

  const submit = async () => {
    if (!template || amount == null) return;
    if (files.length > MAX_DOCUMENTS_PER_REQUEST) {
      toast.error(`Máximo ${MAX_DOCUMENTS_PER_REQUEST} archivos por pago`);
      return;
    }

    setPaying(true);
    try {
      const result = await onConfirm({ amount, description: defaultDescription });
      if (!result) return;

      const transactionId = result.transactionId;
      if (files.length && transactionId) {
        try {
          const uploaded = await uploadFiles(files, `transactions/${transactionId}`);
          await TransactionService.confirmUpload(transactionId, uploaded);
          toast.success(
            files.length === 1 ? "Adjunto guardado" : `${files.length} adjuntos guardados`
          );
        } catch {
          // El pago ya quedó registrado: no se revierte por un adjunto.
          toast.error(
            "El pago quedó registrado, pero no se pudieron subir los adjuntos. Puedes agregarlos desde Transacciones."
          );
        }
      } else if (files.length) {
        toast.error(
          "El pago quedó registrado, pero no pudimos asociar los adjuntos. Agrégalos desde Transacciones."
        );
      }
      onClose();
    } finally {
      setPaying(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
      title="Confirmar pago"
      description={
        template
          ? `${cleanTemplateName(template.name)} — ${template.payeeName}`
          : undefined
      }
    >
      {!template ? null : (
        <div className="relative space-y-4">
          {uploading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/85 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-mint" />
              <div className="w-64 max-w-[80%]">
                <ProgressBar label="Subiendo adjuntos…" value={totalPercent} />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
            <p className="text-sm text-muted-foreground">
              Monto sugerido:{" "}
              <span className="font-semibold text-foreground">
                {initialAmount == null ? "-" : formatMoney(Number(initialAmount))}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Próxima fecha: {formatIsoDate(template.nextDueDate)}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Monto a pagar
            </label>
            <CurrencyField value={amount} onChange={(v) => setAmount(v)} disabled={busy} />
          </div>

          <ExpandableRow
            icon={Paperclip}
            iconClass={files.length ? "bg-mint/15 text-mint-dim" : undefined}
            title="Adjuntar comprobante"
            subtitle={
              files.length
                ? `${files.length} archivo(s) listos para subir`
                : "Factura, recibo, foto o audio"
            }
            open={docsOpen}
            onToggle={() => setDocsOpen((v) => !v)}
          >
            <div className="space-y-3">
              <FileUploader
                maxFiles={MAX_DOCUMENTS_PER_REQUEST}
                maxSize={MAX_DOCUMENT_SIZE}
                accept={DOCUMENT_ACCEPT}
                label="Arrastra aquí tu comprobante"
                currentFiles={files}
                disabled={busy}
                onFilesChange={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
              />
              <FileList
                files={files}
                onRemove={(index) =>
                  setFiles((current) => current.filter((_, i) => i !== index))
                }
              />
            </div>
          </ExpandableRow>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button onClick={() => void submit()} disabled={!canSubmit} className="rounded-xl">
              {uploading
                ? "Subiendo adjuntos…"
                : paying
                  ? "Procesando..."
                  : files.length
                    ? `Pagar y adjuntar (${files.length})`
                    : "Pagar"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
