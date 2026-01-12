"use client";

import { useState } from "react";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";

import TransactionTable from "@/features/transactions/components/modals/TransactionTable";
import TransactionModal from "@/features/transactions/components/modals/TransactionModal";

import { Transaction, CreateTransactionDto } from "@/features/transactions/types/transactions.types";

import { useCategories } from '@/features/categories/hooks/useCategories';
import { useAccounts } from "@/features/accounts/hooks/useAccounts";

import ViewModal from "@/features/transactions/components/modals/ViewModal";

import { Button } from "@/components/ui/button";
import SavvyBanner from "@/components/Banner/SavvyBanner";

export default function TransactionsPage() {
  const [viewData, setViewData] = useState<Transaction | null>(null);

  const { transactions, loading: loadingTransactions, remove, create, show } = useTransactions();
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
        editData={editData}
        categories={categories}
        accounts={accounts}
        loading={loadingTransactions}
      />

      <ViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        data={viewData}
      />
    </>
  );
}
