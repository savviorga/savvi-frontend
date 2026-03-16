import type { Metadata } from "next";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Planificador de pagos | Savvi",
  description: "Organiza tus obligaciones y registra pagos",
};

export default function PlanificadorLayout({
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
