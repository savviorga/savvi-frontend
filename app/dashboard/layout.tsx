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
      <main className="flex-1 w-full max-w-6xl mx-auto p-6">
        {children}
      </main>
    </ProtectedRoute>
  );
}
