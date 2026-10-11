"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import SavvyBanner from "@/components/Banner/SavvyBanner";
import CustomTable, { Column } from "@/components/Table/CustomTable";
import SavviTabs from "@/components/Tabs/SavviTabs";
import { BarChart3, Repeat } from "lucide-react";
import ReportTransferTemplate from "@/features/transfer-templates/components/ReportTransferTemplate";
import ExecuteTransferModal from "@/features/transfer-templates/components/ExecuteTransferModal";
import EditTransferTemplateModal from "@/features/transfer-templates/components/EditTransferTemplateModal";
import TransferTemplateDetailModal from "@/features/transfer-templates/components/TransferTemplateDetailModal";
import TransferKpiCards from "@/features/transfer-templates/components/TransferKpiCards";
import TransferRowActions from "@/features/transfer-templates/components/TransferRowActions";
import ServiceAvatar from "@/features/transfer-templates/components/ServiceAvatar";
import DueStatus, {
  dueRowClassName,
} from "@/features/transfer-templates/components/DueStatus";
import UrgentPaymentsAlert from "@/features/transfer-templates/components/UrgentPaymentsAlert";
import { useTransferTemplates } from "@/features/transfer-templates/hooks/useTransferTemplates";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import type { TransferTemplate } from "@/features/transfer-templates/types/transfer.types";
import {
  cleanTemplateName,
  formatIsoDate,
  frequencyLabel,
} from "@/features/transfer-templates/utils/schedule";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const PAGE_PATH = "/pagos-recurrentes";

// `useSearchParams` necesita un Suspense para el prerender de Next.
export default function TransferenciasPage() {
  return (
    <Suspense fallback={null}>
      <TransferenciasContent />
    </Suspense>
  );
}

function TransferenciasContent() {
  const [tab, setTab] = useState<"active" | "tabreport">("active");
  const router = useRouter();
  const searchParams = useSearchParams();
  // Enlaces desde las notificaciones: `?ver=<id>` abre el detalle, `?pagar=<id>` el pago.
  const urlViewId = searchParams.get("ver");
  const urlPayId = searchParams.get("pagar");
  const clearUrlAction = () => {
    if (urlViewId || urlPayId) router.replace(PAGE_PATH, { scroll: false });
  };

  const {
    templates,
    loading: loadingTemplates,
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

  const [viewTemplateId, setViewTemplateId] = useState<string | null>(null);
  // Se resuelve desde `templates` para reflejar cambios tras editar/pagar.
  const viewTemplate = useMemo(
    () => templates.find((t) => t.id === (viewTemplateId ?? urlViewId)) ?? null,
    [templates, viewTemplateId, urlViewId]
  );

  const urlPayTemplate = useMemo(
    () => (urlPayId ? templates.find((t) => t.id === urlPayId && t.isActive) ?? null : null),
    [templates, urlPayId]
  );
  const payTemplate = selectedTemplate ?? urlPayTemplate;
  const payOpen = executeOpen || urlPayTemplate != null;

  // Lo más urgente arriba (vencidos primero); las pausadas al final.
  const sortedTemplates = useMemo(
    () =>
      [...templates].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.nextDueDate.slice(0, 10).localeCompare(b.nextDueDate.slice(0, 10));
      }),
    [templates]
  );

  const openPay = (t: TransferTemplate) => {
    setSelectedTemplate(t);
    setExecuteOpen(true);
  };

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
      { id: "active" as const, label: "Plantillas", icon: Repeat, count: templates.length },
      { id: "tabreport" as const, label: "Reporte", icon: BarChart3 },
    ],
    [templates.length]
  );


  const templateColumns: Column<TransferTemplate>[] = [
    {
      key: "plantilla",
      header: "Plantilla",
      mobileFullWidth: true,
      render: (t) => (
        <button
          type="button"
          onClick={() => setViewTemplateId(t.id)}
          title={`${t.payeeName} — ${cleanTemplateName(t.name)}`}
          className="group/name flex min-w-0 max-w-[18rem] items-center gap-3 text-left focus:outline-none"
        >
          <ServiceAvatar template={t} />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-[#0B1829] group-hover/name:text-mint-dim group-focus-visible/name:underline">
              {t.payeeName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {cleanTemplateName(t.name)} · {frequencyLabel(t)}
            </span>
          </span>
        </button>
      ),
    },
    {
      key: "lastAmount",
      header: "Monto",
      className: "text-right",
      render: (t) => (
        <span className="whitespace-nowrap text-base font-bold tabular-nums text-[#0B1829]">
          {t.lastAmount == null ? "—" : formatMoney(Number(t.lastAmount))}
        </span>
      ),
    },
    {
      key: "nextDue",
      header: "Próximo pago",
      render: (t) => (
        <span className="block space-y-0.5">
          <span className="block whitespace-nowrap font-medium text-foreground">
            {formatIsoDate(t.nextDueDate)}
          </span>
          {t.isActive ? (
            <DueStatus nextDueDate={t.nextDueDate} />
          ) : (
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
              En pausa
            </span>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (t) => (
        <TransferRowActions
          template={t}
          onPay={() => openPay(t)}
          onView={() => setViewTemplateId(t.id)}
          onEdit={() => {
            setEditTemplate(t);
            setEditOpen(true);
          }}
          onToggleActive={() => void toggleActive(t.id)}
          onDelete={() => removeTemplate(t.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SavvyBanner
        title="Transferencias"
        subtitle="Pagos recurrentes con recordatorios o automáticos."
      />

      <TransferKpiCards templates={templates} loading={loadingTemplates} />

      {!loadingTemplates && (
        <UrgentPaymentsAlert templates={sortedTemplates} onPay={openPay} />
      )}

      <SavviTabs tabs={tabs} value={tab} onChange={setTab} ariaLabel="Vistas de transferencias" />

      {tab === "active" && (
        <section>
          <CustomTable
            data={sortedTemplates}
            columns={templateColumns}
            loading={loadingTemplates}
            rowKey={(t) => t.id}
            tableBreakpoint="xl"
            rowClassName={dueRowClassName}
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
        open={payOpen}
        onClose={() => {
          setExecuteOpen(false);
          setSelectedTemplate(null);
          clearUrlAction();
        }}
        template={payTemplate}
        initialAmount={payTemplate?.lastAmount ?? null}
        onConfirm={async ({ amount, description }) => {
          if (!payTemplate) return null;
          // Si falla, el hook ya mostró el error y el modal sigue abierto.
          const result = await executeTransfer(payTemplate.id, { amount });
          if (result) toast.success(description ? description : "Pago ejecutado");
          return result;
        }}
      />

      <TransferTemplateDetailModal
        open={viewTemplate != null}
        onClose={() => {
          setViewTemplateId(null);
          clearUrlAction();
        }}
        template={viewTemplate}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        payments={viewTemplatePayments}
        onEdit={(t) => {
          setViewTemplateId(null);
          clearUrlAction();
          setEditTemplate(t);
          setEditOpen(true);
        }}
        onExecute={(t) => {
          setViewTemplateId(null);
          clearUrlAction();
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

