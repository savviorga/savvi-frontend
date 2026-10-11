import type { Metadata } from "next";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Dashboard | Savvi",
  description: "Resumen de ingresos, gastos y balance por periodo",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <main className="mx-auto w-full max-w-6xl flex-1 bg-[#F8FAFB] p-4 sm:p-8">
        {children}
      </main>
    </ProtectedRoute>
  );
}
