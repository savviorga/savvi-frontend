import type { Metadata } from "next";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Finance Dashboard",
  description: "Track your incomes and expenses",
};

export default function RootLayout({
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

