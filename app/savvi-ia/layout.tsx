import type { Metadata } from "next";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Savvi IA",
  description: "Asistente conversacional de Savvi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <main className="flex h-full min-h-0 flex-1 w-full p-4 md:p-6">
        {children}
      </main>
    </ProtectedRoute>
  );
}
