"use client";

import { useState } from "react";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { TransactionService } from "@/features/transactions/services/transaction.service";
import { TransferTemplatesService } from "@/features/transfer-templates/services/transfer-templates.service";

import TransactionTable from "@/features/transactions/components/modals/TransactionTable";
import TransactionModal from "@/features/transactions/components/modals/TransactionModal";

import { Transaction, CreateTransactionDto } from "@/features/transactions/types/transactions.types";

import { useCategories } from '@/features/categories/hooks/useCategories';
import { useAccounts } from "@/features/accounts/hooks/useAccounts";

import ViewModal from "@/features/transactions/components/modals/ViewModal";

import { Button } from "@/components/ui/button";
import SavvyBanner from "@/components/Banner/SavvyBanner";
import toast from "react-hot-toast";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

// TODO: Add banner
export default function TransactionsPage() {
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

  // Estado del modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Transaction | null>(null);

  const [viewOpen, setViewOpen] = useState(false);

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

      // Si el usuario adjuntó documentos, los subimos al transaction creada.
      const transaction = result.transaction as any;
      if (payload.files?.length && transaction?.id) {
        await TransactionService.uploadFiles(transaction.id, payload.files);
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
      {/* <SavvyBanner
        title="Transacciones"
        subtitle="Gestiona las transacciones de tus cuentas para un mejor control financiero."
      /> */}

      <div className="flex justify-end mb-4">
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

      <TransactionTable
        items={transactions}
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
