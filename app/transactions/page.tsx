"use client";

import { useMemo, useState } from "react";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { TransactionService } from "@/features/transactions/services/transaction.service";
import { TransferTemplatesService } from "@/features/transfer-templates/services/transfer-templates.service";
import { useS3Upload } from "@/hooks/useS3Upload";

import TransactionTable from "@/features/transactions/components/modals/TransactionTable";
import TransactionModal from "@/features/transactions/components/modals/TransactionModal";
import ReportTransactions from "@/features/transactions/components/ReportTransactions";

import { Transaction, CreateTransactionDto } from "@/features/transactions/types/transactions.types";

import { useCategories } from '@/features/categories/hooks/useCategories';
import { useAccounts } from "@/features/accounts/hooks/useAccounts";

import ViewModal from "@/features/transactions/components/modals/ViewModal";

import { Button } from "@/components/ui/shadcn-button";
import SavvyBanner from "@/components/Banner/SavvyBanner";
import PlannerTabs from "@/components/Tabs/PlannerTabs";
import toast from "react-hot-toast";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

export default function TransactionsPage() {
  const [tab, setTab] = useState<"transactions" | "income" | "expenses" | "transfers" | "report">("transactions");
  const [viewData, setViewData] = useState<Transaction | null>(null);

  const {
    transactions,
    loading: loadingTransactions,
    remove,
    create,
    show,
    reload,
  } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const s3Upload = useS3Upload();

  // Estado del modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Transaction | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const incomeList = useMemo(() => transactions.filter((t) => t.type === "ingreso"), [transactions]);
  const expenseList = useMemo(() => transactions.filter((t) => t.type === "egreso"), [transactions]);
  const transferList = useMemo(() => transactions.filter((t) => t.type === "transferencia"), [transactions]);

  const tabs = useMemo(
    () => [
      { id: "transactions" as const, label: "Todas", count: transactions.length },
      { id: "report" as const, label: "Reporte" },
      { id: "income" as const, label: "Ingresos", count: incomeList.length },
      { id: "expenses" as const, label: "Gastos", count: expenseList.length },
      { id: "transfers" as const, label: "Transferencias", count: transferList.length },
    ],
    [transactions.length, incomeList.length, expenseList.length, transferList.length]
  );

  const handleSubmit = async (payload: CreateTransactionDto) => {
    const success = await create(payload);
    if (success) {
      setModalOpen(false);
      setEditData(null);
    }
  };

  const handleRecurringSubmit = async (payload: {
    amount: number;
    fromAccountId: string;
    templateName: string;
    payeeName: string;
    payeeAccount?: string;
    payeeBank?: string;
    recurrenceType: "reminder" | "automatic";
    frequency:
      | "weekly"
      | "biweekly"
      | "monthly"
      | "bimonthly"
      | "custom";
    customIntervalDays?: number;
    dayOfMonth: number;
    transactionType: "ingreso" | "egreso" | "transferencia";
    description?: string;
    files?: File[];
  }) => {
    try {
      const template = await TransferTemplatesService.create({
        fromAccountId: payload.fromAccountId,
        name: payload.templateName,
        payeeName: payload.payeeName,
        payeeAccount: payload.payeeAccount,
        payeeBank: payload.payeeBank,
        initialAmount: payload.amount,
        recurrenceType: payload.recurrenceType,
        frequency: payload.frequency,
        ...(payload.frequency === "custom" &&
        payload.customIntervalDays != null
          ? { customIntervalDays: payload.customIntervalDays }
          : {}),
        dayOfMonth: payload.dayOfMonth,
      });

      const result = await TransferTemplatesService.execute(template.id, {
        templateId: template.id,
        amount: payload.amount,
        transactionType: payload.transactionType,
        description: payload.description,
      });

      // Si el usuario adjuntó documentos, los subimos directo a S3 vía presigned URL.
      const transaction = result.transaction as any;
      if (payload.files?.length && transaction?.id) {
        const folder = `transactions/${transaction.id}`;
        const results = await s3Upload.uploadFiles(payload.files, folder);
        await TransactionService.confirmUpload(transaction.id, results);
      }

      await reload();
      setModalOpen(false);
      setEditData(null);
      toast.success("Transferencia recurrente creada y ejecutada");
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al crear la transferencia recurrente");
      }
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditData(null);
  };

  const handleShow = async (id: string) => {
    const data = await show(id);
    if (data) {
      setViewData(data);
      setViewOpen(true);
    }
  };

  return (
    <>
      <div className="hidden md:block">
        <SavvyBanner
          title="Transacciones"
          subtitle="Gestiona las transacciones de tus cuentas para un mejor control financiero."
        />
      </div>

      <div className="hidden justify-end mb-4 md:flex">
        <Button
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
          variant="default"
          className="rounded-xl"
        >
          + Crear transacción
        </Button>
      </div>

      {/* FAB móvil */}
      <button
        type="button"
        onClick={() => {
          setEditData(null);
          setModalOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0B1829] text-white shadow-lg shadow-black/20 transition-transform active:scale-95 md:hidden"
        aria-label="Crear transacción"
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      <div className="mb-4">
        <PlannerTabs tabs={tabs} value={tab} onChange={setTab} ariaLabel="Vistas de transacciones" />
      </div>

      {(tab === "transactions" || tab === "income" || tab === "expenses" || tab === "transfers") && (
        <TransactionTable
          items={tab === "income" ? incomeList : tab === "expenses" ? expenseList : tab === "transfers" ? transferList : transactions}
          loading={loadingTransactions}
          onDelete={remove}
          onEdit={(id) => {
            const tx = transactions.find((t) => t.id === id);
            if (tx) {
              setEditData(tx);
              setModalOpen(true);
            }
          }}
          onShow={handleShow}
        />
      )}

      {tab === "report" && <ReportTransactions transactions={transactions} categories={categories} />}

      <TransactionModal
        open={modalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onSubmitRecurring={handleRecurringSubmit}
        editData={editData}
        categories={categories}
        accounts={accounts}
        loading={loadingTransactions}
      />

      <ViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        data={viewData}
        accounts={accounts}
      />
    </>
  );
}
