"use client";

import { useState } from "react";
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import AccountTable from "@/features/accounts/components/AccountTable";
import CreateAccount from "@/features/accounts/components/CreateAccount";
import SavvyBanner from '@/components/Banner/SavvyBanner';
import { Button } from "@/components/ui/button";
import { Account } from "@/features/accounts/types/account.type";

export default function AccountsPage() {
  const { accounts, loading, create } = useAccounts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Account | null>(null);

  const handleSubmit = async (data: { name: string; description: string }) => {
    const success = await create(data);
    if (success) {
      setModalOpen(false);
      setEditData(null);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditData(null);
  };

  return (
    <>
      <SavvyBanner
        title="Cuentas"
        subtitle="Gestiona las cuentas de tus transacciones para un mejor control financiero."
      />

      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
          variant="default"
          className="rounded-xl"
        >
          + Crear cuenta
        </Button>
      </div>

      <AccountTable
        accounts={accounts}
        loading={loading}
      />

      <CreateAccount
        open={modalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        editData={editData}
        loading={loading}
      />
    </>
  );
}
