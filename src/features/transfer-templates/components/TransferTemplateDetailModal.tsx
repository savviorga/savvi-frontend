"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Banknote, CalendarDays, History, Info, Pencil } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import SavviTabs from "@/components/Tabs/SavviTabs";
import { Button } from "@/components/ui/Button";
import type { Transaction } from "@/features/transactions/types/transactions.types";
import type { TransferTemplate } from "../types/transfer.types";
import {
  cleanTemplateName,
  formatIsoDate,
  frequencyLabel,
} from "../utils/schedule";
import DueStatus from "./DueStatus";
import { getServiceKind } from "./ServiceAvatar";

type AccountOption = { id: string; name: string };
type DetailTab = "details" | "history";

/** Pagos visibles en el historial antes de "Ver todos". */
const HISTORY_LIMIT = 5;

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const formatTimestamp = (iso: string) =>
  format(new Date(iso), "d MMM yyyy", { locale: es });

const normalize = (value: string) => value.trim().toLowerCase();

type Row = { label: string; value?: string | null };

/**
 * Quita filas vacías y valores que ya se mostraron (en el título o en un grupo
 * anterior), para que ningún dato aparezca dos veces en el modal.
 */
function dedupeGroups(alreadyShown: string[], groups: Row[][]): Row[][] {
  const seen = new Set(alreadyShown.map(normalize));
  return groups.map((rows) =>
    rows.filter((row) => {
      if (!row.value?.trim()) return false;
      const key = normalize(row.value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
  );
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

/** Texto con saltos de línea y links clicables (p. ej. el portal de pago). */
function LinkifiedText({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">
      {text.split(URL_PATTERN).map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-medium text-mint-dim underline decoration-mint/40 underline-offset-2 hover:decoration-mint-dim"
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
    </p>
  );
}

function DetailGroup({ title, rows }: { title: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
      <dl className="divide-y divide-gray-200/70 rounded-xl bg-gray-50 px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-sm text-gray-500">{row.label}</dt>
            <dd className="min-w-0 break-words text-right text-sm font-medium text-[#0B1829]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
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
  const [tab, setTab] = useState<DetailTab>("details");
  const [showAllHistory, setShowAllHistory] = useState(false);

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => b.date.localeCompare(a.date)),
    [payments]
  );

  if (!template) return null;

  // El modal sigue montado entre plantillas: vuelve a la vista inicial al salir.
  const leave = (action: () => void) => {
    setTab("details");
    setShowAllHistory(false);
    action();
  };

  const { icon: ServiceIcon } = getServiceKind(template);
  const fromAccountName =
    accounts.find((a) => a.id === template.fromAccountId)?.name ?? null;

  const [payeeRows, scheduleRows] = dedupeGroups(
    [template.name, cleanTemplateName(template.name)],
    [
      [
        { label: "Nombre", value: template.payeeName },
        { label: "Banco", value: template.payeeBank },
        { label: "Número de cuenta", value: template.payeeAccount },
      ],
      [
        { label: "Cuenta origen", value: fromAccountName },
        {
          label: "Día de pago",
          value:
            template.frequency === "custom" ? null : `Día ${template.dayOfMonth}`,
        },
      ],
    ]
  );

  const totalPaid = sortedPayments.reduce(
    (acc, tx) => acc + Number(tx.amount || 0),
    0
  );
  const lastPayment = sortedPayments[0] ?? null;
  const visiblePayments = showAllHistory
    ? sortedPayments
    : sortedPayments.slice(0, HISTORY_LIMIT);

  const tabs = [
    { id: "details" as const, label: "Detalles", icon: Info },
    { id: "history" as const, label: "Historial", icon: History, count: sortedPayments.length },
  ];

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) leave(onClose);
      }}
      title={cleanTemplateName(template.name)}
      className="md:max-w-xl"
      headerIcon={<ServiceIcon className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />}
    >
      <div className="space-y-6">
        {/* Hero: cuánto, cuándo y qué hacer */}
        <section className="flex flex-col items-center text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Monto a pagar
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-[#0B1829]">
            {template.lastAmount == null
              ? "—"
              : formatMoney(Number(template.lastAmount))}
          </p>

          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden />
            Vence el{" "}
            <span className="font-semibold text-[#0B1829]">
              {formatIsoDate(template.nextDueDate, "d 'de' MMMM yyyy")}
            </span>
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {template.isActive ? (
              <DueStatus nextDueDate={template.nextDueDate} variant="badge" />
            ) : (
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                En pausa
              </span>
            )}
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {frequencyLabel(template)} ·{" "}
              {template.recurrenceType === "automatic" ? "Automático" : "Recordatorio"}
            </span>
          </div>

          {onExecute ? (
            <Button
              size="lg"
              className="mt-6 w-full"
              icon={<Banknote className="h-5 w-5" />}
              disabled={!template.isActive}
              onClick={() => leave(() => onExecute(template))}
            >
              Pagar ahora
            </Button>
          ) : null}
          {!template.isActive && onExecute ? (
            <p className="mt-2 text-xs text-gray-500">
              Activa la plantilla para poder pagar.
            </p>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={() => leave(() => onEdit(template))}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#0B1829] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar plantilla
            </button>
          ) : null}
        </section>

        <div className="space-y-4">
          <SavviTabs
            tabs={tabs}
            value={tab}
            onChange={setTab}
            ariaLabel="Información de la plantilla"
          />

          {tab === "details" && (
            <div role="tabpanel" aria-labelledby="tab-details" className="space-y-5">
              {template.description?.trim() ? (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Descripción
                  </h3>
                  <div className="rounded-xl bg-gray-50 px-4 py-3">
                    <LinkifiedText text={template.description.trim()} />
                  </div>
                </section>
              ) : null}
              <DetailGroup title="Destinatario" rows={payeeRows} />
              <DetailGroup title="Programación" rows={scheduleRows} />
              <p className="text-center text-xs text-gray-400">
                Creada el {formatTimestamp(template.createdAt)} · Actualizada el{" "}
                {formatTimestamp(template.updatedAt)}
              </p>
            </div>
          )}

          {tab === "history" && (
            <div role="tabpanel" aria-labelledby="tab-history" className="space-y-3">
              {sortedPayments.length === 0 ? (
                <p className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  Aún no hay pagos registrados para esta plantilla.
                </p>
              ) : (
                <>
                  <p className="text-xs text-gray-500">
                    Total pagado{" "}
                    <span className="font-semibold tabular-nums text-gray-700">
                      {formatMoney(totalPaid)}
                    </span>
                    {lastPayment ? (
                      <>
                        {" · "}Último pago{" "}
                        <span className="font-semibold text-gray-700">
                          {formatIsoDate(lastPayment.date)}
                        </span>
                      </>
                    ) : null}
                  </p>
                  <ul className="divide-y divide-gray-200/70 rounded-xl bg-gray-50 px-4">
                    {visiblePayments.map((tx) => (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between gap-3 py-3 text-sm"
                      >
                        <span className="text-gray-600">{formatIsoDate(tx.date)}</span>
                        <span className="font-semibold tabular-nums text-[#0B1829]">
                          {formatMoney(Number(tx.amount))}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {sortedPayments.length > HISTORY_LIMIT && (
                    <button
                      type="button"
                      onClick={() => setShowAllHistory((v) => !v)}
                      className="w-full rounded-lg py-2 text-sm font-medium text-mint-dim transition-colors hover:bg-mint/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50"
                    >
                      {showAllHistory
                        ? "Ver menos"
                        : `Ver los ${sortedPayments.length} pagos`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
