"use client";

import { useState } from "react";
import CustomTable, { Column } from "@/components/Table/CustomTable";
import { Category } from "@/features/categories/types/category.type";
import StatusBadge from "@/components/FeedBack/StatusBadge";

interface CategoryTableProps {
  categories: Category[];
  loading: boolean;
}

export default function CategoryTable({
  categories,
  loading,
}: CategoryTableProps) {
  const [, setPage] = useState(1);

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (category) => <p>{category.name}</p>,
    },
    {
      key: "type",
      header: "Tipo",
      render: (category) => {
        const type = category.type ?? "egreso";
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              type === "ingreso"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {type === "ingreso" ? "Ingresos" : "Gastos"}
          </span>
        );
      },
    },
    {
      key: "description",
      header: "Descripción",
      render: (category) => (
        <p className="max-w-xs truncate" title={category.description}>
          {category.description}
        </p>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (category) => <StatusBadge active={category.isActive} />,
    },
  ];

  return (
    <CustomTable
      data={categories}
      columns={columns}
      loading={loading}
      rowKey={(category) => category.id}
      totalPages={4}
      onPageChange={setPage}
    />
  );
}
