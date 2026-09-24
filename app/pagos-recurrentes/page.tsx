"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
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
import TransferTemplateDetailModal from "@/features/transfer-templates/components/TransferTemplateDetailModal";
import { useTransferTemplates } from "@/features/transfer-templates/hooks/useTransferTemplates";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import type { TransferTemplate } from "@/features/transfer-templates/types/transfer.types";
import {
  dueProgressVariant,
  frequencyLabel,
  getDueProgressInfo,
} from "@/features/transfer-templates/utils/schedule";
import {
  BanknotesIcon,
  EyeIcon,
  PencilSquareIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function TransferenciasPage() {
  const [tab, setTab] = useState<"active" | "tabreport">("active");

  const {
    templates,
    loading: loadingTemplates,
    reload: reloadTemplates,
    update: updateTemplate,
    toggleActive,
    execute: executeTransfer,
    remove: removeTemplate,
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [viewTemplateId, setViewTemplateId] = useState<string | null>(null);
  // Se resuelve desde `templates` para reflejar cambios tras editar/pagar.
  const viewTemplate = useMemo(
    () => templates.find((t) => t.id === viewTemplateId) ?? null,
    [templates, viewTemplateId]
  );

  const transferTemplateIds = useMemo(() => new Set(templates.map((t) => t.id)), [templates]);
  const transferTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.description) return false;
      return Array.from(transferTemplateIds).some((id) =>
        t.description?.includes(`transfer_template_id:${id}`)
      );
    });
  }, [transactions, transferTemplateIds]);

  const viewTemplatePayments = useMemo(() => {
    if (!viewTemplateId) return [];
    return transferTransactions.filter((t) =>
      t.description?.includes(`transfer_template_id:${viewTemplateId}`)
    );
  }, [transferTransactions, viewTemplateId]);

  const tabs = useMemo(
    () => [
      { id: "active" as const, label: "Plantillas", count: templates.length },
      { id: "tabreport" as const, label: "Reporte" },
    ],
    [templates.length]
  );

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
        return (
          <div className="min-w-[180px] max-w-[240px]">
            <ProgressBar
              label={label}
              value={progressPercent}
              variant={dueProgressVariant(daysUntil)}
            />
          </div>
        );
      },
    },
    {
      key: "frequency",
      header: "Frecuencia",
      render: (t) => (
        <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold  ring-1 ring-emerald-600/20">
          {frequencyLabel(t)}
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
      className: "w-44 text-right",
      render: (t) => (
        <div className="flex flex-wrap items-center justify-end gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Ver detalle"
            aria-label="Ver detalle"
            onClick={() => setViewTemplateId(t.id)}
          >
            <EyeIcon className="size-4" />
          </Button>
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
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={
              confirmDeleteId === t.id
                ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                : "text-muted-foreground hover:bg-red-50 hover:text-red-600"
            }
            title={
              confirmDeleteId === t.id
                ? "Confirmar eliminación"
                : "Eliminar plantilla"
            }
            aria-label={
              confirmDeleteId === t.id
                ? "Confirmar eliminación"
                : "Eliminar plantilla"
            }
            onBlur={() => setConfirmDeleteId(null)}
            onClick={async () => {
              if (confirmDeleteId !== t.id) {
                setConfirmDeleteId(t.id);
                return;
              }

              const ok = await removeTemplate(t.id);
              if (ok) {
                setConfirmDeleteId(null);
              }
            }}
          >
            <TrashIcon className="size-4" />
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

      <TransferTemplateDetailModal
        open={viewTemplate != null}
        onClose={() => setViewTemplateId(null)}
        template={viewTemplate}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        payments={viewTemplatePayments}
        onEdit={(t) => {
          setViewTemplateId(null);
          setEditTemplate(t);
          setEditOpen(true);
        }}
        onExecute={(t) => {
          setViewTemplateId(null);
          setSelectedTemplate(t);
          setExecuteOpen(true);
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

