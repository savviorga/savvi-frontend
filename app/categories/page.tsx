"use client";

import { useState } from "react";
import { useCategories } from "@/features/categories/hooks/useCategories";
import CategoryTable from "@/features/categories/components/CategoryTable";
import CreateCategory from "@/features/categories/components/CreateCategory";
import SavvyBanner from "@/components/Banner/SavvyBanner";
import { Button } from "@/components/ui/button";
import { CreateCategoryDto } from "@/features/categories/dto/create-category.dto";

export default function CategoriesPage() {
  const { categories, loading, create } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmit = async (data: CreateCategoryDto) => {
    const success = await create(data);
    if (success) setModalOpen(false);
  };

  const handleClose = () => setModalOpen(false);

  return (
    <>
      <SavvyBanner
        title="Categorías"
        subtitle="Gestiona las categorías de tus transacciones para un mejor control financiero."
      />

      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setModalOpen(true)}
          variant="default"
          className="rounded-xl"
        >
          + Crear categoría
        </Button>
      </div>

      <CategoryTable categories={categories} loading={loading} />

      <CreateCategory
        open={modalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </>
  );
}
