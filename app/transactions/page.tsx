"use client";

import { useId, useMemo, useState } from "react";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { TransactionService } from "@/features/transactions/services/transaction.service";
import { TransferTemplatesService } from "@/features/transfer-templates/services/transfer-templates.service";
import { useS3Upload } from "@/hooks/useS3Upload";

import TransactionTable from "@/features/transactions/components/modals/TransactionTable";
import TransactionModal from "@/features/transactions/components/modals/TransactionModal";
import BulkTransactionsModal from "@/features/transactions/components/modals/BulkTransactionsModal";
import ReportTransactions from "@/features/transactions/components/ReportTransactions";

import { Transaction, TransactionFormPayload } from "@/features/transactions/types/transactions.types";

import { useCategories } from '@/features/categories/hooks/useCategories';
import { useAccounts } from "@/features/accounts/hooks/useAccounts";

import ViewModal from "@/features/transactions/components/modals/ViewModal";
import TransactionFilters from "@/features/transactions/components/TransactionFilters";
import TransactionFiltersToggle from "@/features/transactions/components/TransactionFiltersToggle";
import TransactionTotals from "@/features/transactions/components/TransactionTotals";
import {
  filterTransactionsByCategory,
  filterTransactionsByDateRange,
  filterTransactionsBySearch,
  getCurrentMonthDateRange,
  getTransactionCategoryNames,
} from "@/features/transactions/utils/transactionFilters";

import { Layers } from "lucide-react";
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
    update,
    bulk,
    show,
    reload,
    setDocumentsCount,
    isUploading,
    uploadTotalPercent,
  } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const s3Upload = useS3Upload();

  // Estado del modal
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editData, setEditData] = useState<Transaction | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | null>(
    () => getCurrentMonthDateRange().from,
  );
  const [dateTo, setDateTo] = useState<Date | null>(
    () => getCurrentMonthDateRange().to,
  );

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = useId();

  const categoryNames = useMemo(
    () => getTransactionCategoryNames(transactions, categories),
    [transactions, categories],
  );

  const filteredTransactions = useMemo(() => {
    const byDate = filterTransactionsByDateRange(transactions, dateFrom, dateTo);
    const byCategory = filterTransactionsByCategory(byDate, categoryFilter, categories);
    return filterTransactionsBySearch(byCategory, search);
  }, [transactions, dateFrom, dateTo, categoryFilter, categories, search]);

  const incomeList = useMemo(
    () => filteredTransactions.filter((t) => t.type === "ingreso"),
    [filteredTransactions],
  );
  const expenseList = useMemo(
    () => filteredTransactions.filter((t) => t.type === "egreso"),
    [filteredTransactions],
  );
  const transferList = useMemo(
    () => filteredTransactions.filter((t) => t.type === "transferencia"),
    [filteredTransactions],
  );

  const visibleTransactions =
    tab === "income"
      ? incomeList
      : tab === "expenses"
        ? expenseList
        : tab === "transfers"
          ? transferList
          : filteredTransactions;
  const visibleType =
    tab === "income"
      ? "ingreso"
      : tab === "expenses"
        ? "egreso"
        : tab === "transfers"
          ? "transferencia"
          : undefined;

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setDateFrom(null);
    setDateTo(null);
  };

  const tabs = useMemo(
    () => [
      { id: "transactions" as const, label: "Todas", count: filteredTransactions.length },
      { id: "report" as const, label: "Reporte" },
      { id: "income" as const, label: "Ingresos", count: incomeList.length },
      { id: "expenses" as const, label: "Gastos", count: expenseList.length },
      { id: "transfers" as const, label: "Transferencias", count: transferList.length },
    ],
    [
      filteredTransactions.length,
      incomeList.length,
      expenseList.length,
      transferList.length,
    ],
  );

  const handleSubmit = async (
    payload: TransactionFormPayload,
    editingId?: string,
    options?: { keepOpen?: boolean }
  ) => {
    // En edición el mismo guardado manda campos, adjuntos a borrar y archivos nuevos.
    const success = editingId
      ? await update(editingId, payload)
      : await create(payload);

    if (success) {
      if (!options?.keepOpen) {
        setModalOpen(false);
      }
      setEditData(null);
    }
    return success;
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

  const handleEdit = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    setEditData(tx);
    setModalOpen(true);
  };

  const handleShow = async (id: string) => {
    const data = await show(id);
    if (data) {
      setViewData(data);
      setViewOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await remove(id);
    if (!success) return;

    if (viewData?.id === id) {
      setViewOpen(false);
      setViewData(null);
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

      <div className="mb-4 hidden justify-end gap-2 md:flex">
        <Button
          onClick={() => setBulkOpen(true)}
          variant="outline"
          className="rounded-xl"
        >
          <Layers className="h-4 w-4" aria-hidden />
          Crear varios registros
        </Button>
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

      {/* FAB móvil: crear varios registros y crear uno */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 md:hidden">
        <button
          type="button"
          onClick={() => setBulkOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white text-[#0B1829] shadow-lg shadow-black/10 transition-transform active:scale-95"
          aria-label="Crear varios registros"
        >
          <Layers className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0B1829] text-white shadow-lg shadow-black/20 transition-transform active:scale-95"
          aria-label="Crear transacción"
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <PlannerTabs tabs={tabs} value={tab} onChange={setTab} ariaLabel="Vistas de transacciones" />
      </div>

      {(tab === "transactions" || tab === "income" || tab === "expenses" || tab === "transfers") && (
        <>
          <TransactionFiltersToggle
            open={filtersOpen}
            onToggle={() => setFiltersOpen((v) => !v)}
            panelId={filtersPanelId}
            dateFrom={dateFrom}
            dateTo={dateTo}
            category={categoryFilter}
            search={search}
          />
          <div id={filtersPanelId} hidden={!filtersOpen}>
            <TransactionFilters
              search={search}
              onSearchChange={setSearch}
              category={categoryFilter}
              onCategoryChange={setCategoryFilter}
              categoryNames={categoryNames}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onClear={clearFilters}
            />
          </div>
          <TransactionTotals
            items={visibleTransactions}
            type={visibleType}
            loading={loadingTransactions}
          />
          <TransactionTable
            items={visibleTransactions}
            loading={loadingTransactions}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onShow={handleShow}
          />
        </>
      )}

      {tab === "report" && <ReportTransactions transactions={transactions} categories={categories} />}

      <BulkTransactionsModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        categories={categories}
        accounts={accounts}
        onConfirm={bulk}
      />

      <TransactionModal
        open={modalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onSubmitRecurring={handleRecurringSubmit}
        editData={editData}
        categories={categories}
        accounts={accounts}
        loading={loadingTransactions}
        uploading={isUploading}
        uploadPercent={uploadTotalPercent}
      />

      <ViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        data={viewData}
        accounts={accounts}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onDocumentsCountChange={setDocumentsCount}
      />
    </>
  );
}
