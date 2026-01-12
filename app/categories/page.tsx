"use client";

import { useCategories } from '@/features/categories/hooks/useCategories';
import CategoryTable from "@/features/categories/components/CategoryTable";
import SavvyBanner from '@/components/Banner/SavvyBanner';
import SavvyBannerLight from '@/components/Banner/SavvyBannerLight';

export default function TransactionsPage() {
  const {
    categories,
    loading: categoriesLoading,
    reload: reloadCategories,
  } = useCategories();

  return (
    <>
      <SavvyBanner
        title="Categorías"
        subtitle="Gestiona las categorías de tus transacciones para un mejor control financiero."
      />

      <CategoryTable
        categories={categories}
        loading={categoriesLoading}
      />
    </>
  );
}
