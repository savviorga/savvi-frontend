"use client";

import { useMemo } from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Eye } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { ProgressBar } from "@/components/ProgressBar";
import StatusBadge from "@/components/FeedBack/StatusBadge";
import { Button } from "@/components/ui/shadcn-button";
import type { Transaction } from "@/features/transactions/types/transactions.types";
import type { TransferTemplate } from "../types/transfer.types";
import {
  dueProgressVariant,
  frequencyLabel,
  getDueProgressInfo,
} from "../utils/schedule";

type AccountOption = { id: string; name: string };

/** Cantidad de pagos que se listan en el historial del detalle. */
const HISTORY_LIMIT = 5;

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatIsoDate(iso: string, pattern: string) {
  return format(parse(iso.slice(0, 10), "yyyy-MM-dd", new Date()), pattern, {
    locale: es,
  });
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/70 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

export default function TransferTemplateDetailModal({
  open,
  onClose,
  template,
  accounts,
  payments,
  onEdit,
  onExecute,
}: {
  open: boolean;
  onClose: () => void;
  template: TransferTemplate | null;
  accounts: AccountOption[];
  /** Transacciones generadas por esta plantilla. */
  payments: Transaction[];
  onEdit?: (template: TransferTemplate) => void;
  onExecute?: (template: TransferTemplate) => void;
}) {
  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => b.date.localeCompare(a.date)),
    [payments]
  );

  if (!template) return null;

  const { progressPercent, label, daysUntil } = getDueProgressInfo(
    template.nextDueDate,
    template.frequency,
    template.customIntervalDays
  );

  const fromAccountName =
    accounts.find((a) => a.id === template.fromAccountId)?.name ?? null;

  const totalPaid = sortedPayments.reduce(
    (acc, tx) => acc + Number(tx.amount || 0),
    0
  );
  const lastPayment = sortedPayments[0] ?? null;

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={template.name}
      description={`Pago recurrente a ${template.payeeName}`}
      className="md:max-w-2xl"
      headerIcon={<Eye className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />}
    >
      <div className="space-y-4">
        {/* Resumen */}
        <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Monto anterior</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {template.lastAmount == null
                  ? "—"
                  : formatMoney(Number(template.lastAmount))}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge active={template.isActive} />
              <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold ring-1 ring-emerald-600/20">
                {frequencyLabel(template)}
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
                {template.recurrenceType === "automatic"
                  ? "Automático"
                  : "Recordatorio"}
              </span>
            </div>
          </div>

          <div className="mt-4 border-t border-border/70 pt-4">
            <p className="mb-2 text-sm text-muted-foreground">
              Próximo vencimiento:{" "}
              <span className="font-semibold capitalize text-foreground">
                {formatIsoDate(template.nextDueDate, "EEEE d 'de' MMMM yyyy")}
              </span>
            </p>
            <ProgressBar
              label={label}
              value={progressPercent}
              variant={dueProgressVariant(daysUntil)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Section title="Destinatario">
            <div className="space-y-3">
              <Info label="Nombre" value={template.payeeName} />
              <Info label="Banco" value={template.payeeBank} />
              <Info label="Número de cuenta" value={template.payeeAccount} />
            </div>
          </Section>

          <Section title="Programación">
            <div className="space-y-3">
              <Info label="Cuenta origen" value={fromAccountName} />
              <Info label="Frecuencia" value={frequencyLabel(template)} />
              {template.frequency !== "custom" && (
                <Info
                  label="Día del mes"
                  value={String(template.dayOfMonth)}
                />
              )}
            </div>
          </Section>
        </div>

        <Section title="Historial de pagos">
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Info label="Pagos realizados" value={String(sortedPayments.length)} />
            <Info label="Total pagado" value={formatMoney(totalPaid)} />
            <Info
              label="Último pago"
              value={
                lastPayment
                  ? formatIsoDate(lastPayment.date, "d MMM yyyy")
                  : null
              }
            />
          </div>

          {sortedPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay pagos registrados para esta plantilla.
            </p>
          ) : (
            <ul className="divide-y divide-border/70 rounded-lg border border-border/70">
              {sortedPayments.slice(0, HISTORY_LIMIT).map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {formatIsoDate(tx.date, "d MMM yyyy")}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {accounts.find((a) => a.id === tx.account)?.name ??
                        tx.category}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-foreground">
                    {formatMoney(Number(tx.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {sortedPayments.length > HISTORY_LIMIT && (
            <p className="mt-2 text-xs text-muted-foreground">
              Mostrando los últimos {HISTORY_LIMIT} de {sortedPayments.length}{" "}
              pagos.
            </p>
          )}
        </Section>

        <p className="text-xs text-muted-foreground">
          Creada el {format(new Date(template.createdAt), "d MMM yyyy", { locale: es })}
          {" · "}
          Actualizada el{" "}
          {format(new Date(template.updatedAt), "d MMM yyyy", { locale: es })}
        </p>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          {onEdit ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onEdit(template)}
            >
              Editar
            </Button>
          ) : null}
          {onExecute ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!template.isActive}
              title={
                template.isActive
                  ? undefined
                  : "Activa la plantilla para poder pagar"
              }
              onClick={() => onExecute(template)}
            >
              Pagar ahora
            </Button>
          ) : null}
          <Button
            type="button"
            variant="default"
            className="rounded-xl"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
