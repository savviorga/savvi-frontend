import type { Metadata } from "next";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Transferencias recurrentes | Savvi",
  description: "Pagos recurrentes con recordatorios o automáticos",
};

export default function TransferenciasLayout({
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
