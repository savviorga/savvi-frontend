"use client";

import { useState } from "react";
import CustomTable, { Column } from "@/components/Table/CustomTable";
import { Account } from "@/features/accounts/types/account.type";
import StatusBadge from "@/components/FeedBack/StatusBadge";

interface AccountTableProps {
  accounts: Account[];
  loading: boolean;
}

export default function AccountTable({
  accounts,
  loading,
}: AccountTableProps) {
  const [page, setPage] = useState(1);

  const columns: Column<Account>[] = [
    {
      key: "name",
      header: "Nombre",
      render: account => <p>{account.name}</p>,
    },
    {
      key: "description",
      header: "Descripción",
      render: account => (
        <p className="max-w-xs truncate" title={account.description}>
          {account.description}
        </p>
      ),
    },
    {
      key: "balance",
      header: "Saldo",
      render: (account) => {
        const val = Number(account.balance ?? 0);
        return (
          <p className={`font-semibold tabular-nums ${val < 0 ? "text-rose-500" : "text-emerald-600"}`}>
            {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val)}
          </p>
        );
      },
    },
    {
      key: "isCredit",
      header: "Crédito",
      render: (account) => (
        <p className={account.isCredit ? "text-accent font-semibold" : "text-muted-foreground"}>
          {account.isCredit ? "Sí" : "No"}
        </p>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: account => <StatusBadge active={account.isActive} />,
    },
  ];

  return (
    <CustomTable
      data={accounts}
      columns={columns}
      loading={loading}
      rowKey={(account) => account.id}
      totalPages={4}
      onPageChange={setPage}
    />
  );
}
 