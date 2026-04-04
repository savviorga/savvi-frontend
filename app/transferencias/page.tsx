"use client";

import { useMemo, useState } from "react";
import {
  differenceInCalendarDays,
  format,
  parse,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";
import SavvyBanner from "@/components/Banner/SavvyBanner";
import { ProgressBar } from "@/components/ProgressBar";
import CustomTable, { Column } from "@/components/Table/CustomTable";
import PlannerTabs from "@/components/Tabs/PlannerTabs";
import { Button } from "@/components/ui/shadcn-button";
import StatusBadge from "@/components/FeedBack/StatusBadge";
import ReportTransferTemplate from "@/features/transfer-templates/components/ReportTransferTemplate";
import ExecuteTransferModal from "@/features/transfer-templates/components/ExecuteTransferModal";
import EditTransferTemplateModal from "@/features/transfer-templates/components/EditTransferTemplateModal";
import { useTransferTemplates } from "@/features/transfer-templates/hooks/useTransferTemplates";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import type { TransferTemplate } from "@/features/transfer-templates/types/transfer.types";
import {
  BanknotesIcon,
  PencilSquareIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

/** Días aproximados por ciclo según frecuencia (para la barra de avance al próximo vencimiento). */
function frequencyToPeriodDays(
  frequency: TransferTemplate["frequency"],
  customIntervalDays?: number | null
): number {
  if (frequency === "custom" && customIntervalDays != null && customIntervalDays > 0) {
    return customIntervalDays;
  }
  switch (frequency) {
    case "weekly":
      return 7;
    case "biweekly":
      return 14;
    case "monthly":
      return 30;
    case "bimonthly":
      return 60;
    default:
      return 30;
  }
}

function getDueProgressInfo(
  nextDueDateIso: string,
  frequency: TransferTemplate["frequency"],
  customIntervalDays?: number | null
) {
  const due = startOfDay(parse(nextDueDateIso, "yyyy-MM-dd", new Date()));
  const today = startOfDay(new Date());
  const daysUntil = differenceInCalendarDays(due, today);
  const periodDays = frequencyToPeriodDays(frequency, customIntervalDays);

  let progressPercent: number;
  if (daysUntil <= 0) {
    progressPercent = 100;
  } else {
    progressPercent = Math.min(
      100,
      Math.max(0, (1 - daysUntil / periodDays) * 100)
    );
  }

  let label: string;
  if (daysUntil < 0) {
    const n = Math.abs(daysUntil);
    label = n === 1 ? "Venció hace 1 día" : `Venció hace ${n} días`;
  } else if (daysUntil === 0) {
    label = "Vence hoy";
  } else if (daysUntil === 1) {
    label = "Falta 1 día";
  } else {
    label = `Faltan ${daysUntil} días`;
  }

  return { daysUntil, progressPercent, label, periodDays };
}

export default function TransferenciasPage() {
  const [tab, setTab] = useState<"active" | "tabreport">("active");

  const {
    templates,
    loading: loadingTemplates,
    reload: reloadTemplates,
    update: updateTemplate,
    toggleActive,
    execute: executeTransfer,
  } = useTransferTemplates();

  const { accounts } = useAccounts();
  const {
    transactions,
    reload: reloadTransactions,
  } = useTransactions();

  const [selectedTemplate, setSelectedTemplate] =
    useState<TransferTemplate | null>(null);
  const [executeOpen, setExecuteOpen] = useState(false);

  const [editTemplate, setEditTemplate] = useState<TransferTemplate | null>(
    null
  );
  const [editOpen, setEditOpen] = useState(false);

  const transferTemplateIds = useMemo(() => new Set(templates.map((t) => t.id)), [templates]);
  const transferTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.description) return false;
      return Array.from(transferTemplateIds).some((id) =>
        t.description?.includes(`transfer_template_id:${id}`)
      );
    });
  }, [transactions, transferTemplateIds]);

  const tabs = useMemo(
    () => [
      { id: "active" as const, label: "Plantillas", count: templates.length },
      { id: "tabreport" as const, label: "Reporte" },
    ],
    [templates.length]
  );

  const frequencyBadgeLabel = (t: TransferTemplate) => {
    if (t.frequency === "custom" && t.customIntervalDays != null && t.customIntervalDays > 0) {
      const d = t.customIntervalDays;
      return d === 1 ? "Cada 1 día" : `Cada ${d} días`;
    }
    switch (t.frequency) {
      case "weekly":
        return "Semanal";
      case "biweekly":
        return "Quincenal";
      case "monthly":
        return "Mensual";
      case "bimonthly":
        return "Bimestral";
      case "custom":
        return "Personalizado";
      default:
        return t.frequency;
    }
  };

  const executeNow = async (template: TransferTemplate, amount: number) => {
    await executeTransfer(template.id, {
      amount,
    });
  };

  const templateColumns: Column<TransferTemplate>[] = [
    {
      key: "plantilla",
      header: "Plantilla",
      render: (t) => (
        <div>
          <p className="text-xs text-muted-foreground">{t.name}</p>
          <p className="font-semibold text-foreground">{t.payeeName}</p>
        </div>
      ),
    },
    {
      key: "lastAmount",
      header: "Monto anterior",
      className: "text-right",
      render: (t) => (
        <span className="font-semibold tabular-nums text-foreground">
          {t.lastAmount == null ? "—" : formatMoney(Number(t.lastAmount))}
        </span>
      ),
    },
    {
      key: "nextDue",
      header: "Próxima fecha",
      render: (t) => (
        <span className="font-medium text-foreground">
          {format(new Date(t.nextDueDate), "d MMM yyyy", { locale: es })}
        </span>
      ),
    },
    {
      key: "vencimiento",
      header: "Hasta el próximo vencimiento",
      render: (t) => {
        const { progressPercent, label, daysUntil } = getDueProgressInfo(
          t.nextDueDate,
          t.frequency,
          t.customIntervalDays
        );
        const variant =
          daysUntil < 0
            ? "red"
            : daysUntil === 3
              ? "red"
              : daysUntil <= 5
                ? "orange"
                : "teal";
        return (
          <div className="min-w-[180px] max-w-[240px]">
            <ProgressBar label={label} value={progressPercent} variant={variant} />
          </div>
        );
      },
    },
    {
      key: "frequency",
      header: "Frecuencia",
      render: (t) => (
        <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold  ring-1 ring-emerald-600/20">
          {frequencyBadgeLabel(t)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (t) => <StatusBadge active={t.isActive} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-36 text-right",
      render: (t) => (
        <div className="flex flex-wrap items-center justify-end gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-accent/10 hover:text-accent"
            disabled={!t.isActive}
            title={
              t.isActive
                ? "Pagar ahora"
                : "Activa la plantilla para poder pagar"
            }
            aria-label="Pagar ahora"
            onClick={() => {
              setSelectedTemplate(t);
              setExecuteOpen(true);
            }}
          >
            <BanknotesIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Editar plantilla"
            aria-label="Editar plantilla"
            onClick={() => {
              setEditTemplate(t);
              setEditOpen(true);
            }}
          >
            <PencilSquareIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={
              t.isActive
                ? "text-muted-foreground hover:bg-amber-50 hover:text-amber-700"
                : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
            }
            title={t.isActive ? "Desactivar" : "Activar"}
            aria-label={t.isActive ? "Desactivar" : "Activar"}
            onClick={() => void toggleActive(t.id)}
          >
            {t.isActive ? (
              <PauseIcon className="size-4" />
            ) : (
              <PlayIcon className="size-4" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SavvyBanner
        title="Transferencias"
        subtitle="Pagos recurrentes con recordatorios o automáticos."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {tab === "active"
            ? "Plantillas guardadas y su próximo vencimiento."
            : "Sección en construcción."}
        </p>
      </div>

      <PlannerTabs tabs={tabs} value={tab} onChange={setTab} ariaLabel="Vistas de transferencias" />

      {tab === "active" && (
        <section>
          <CustomTable
            data={templates}
            columns={templateColumns}
            loading={loadingTemplates}
            rowKey={(t) => t.id}
            totalPages={1}
            onPageChange={() => {}}
          />
        </section>
      )}

      {tab === "tabreport" && (
        <section>
          <ReportTransferTemplate
            templates={templates}
            transferTransactions={transferTransactions}
          />
        </section>
      )}

      <ExecuteTransferModal
        open={executeOpen}
        onClose={() => {
          setExecuteOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        initialAmount={selectedTemplate?.lastAmount ?? null}
        onConfirm={async ({ amount, description }) => {
          if (!selectedTemplate) return;
          await executeNow(selectedTemplate, amount);
          setExecuteOpen(false);
          setSelectedTemplate(null);
          toast.success(description ? description : "Pago ejecutado");
          await reloadTemplates();
        }}
      />

      <EditTransferTemplateModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditTemplate(null);
        }}
        template={editTemplate}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        loading={loadingTemplates}
        onSave={async (id, payload) => {
          const ok = await updateTemplate(id, payload);
          if (ok) {
            setEditOpen(false);
            setEditTemplate(null);
          }
        }}
      />
    </div>
  );
}

