import type { Metadata } from "next";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Mi perfil | Savvi",
  description: "Tu información personal, preferencias y métricas generales",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <main className="mx-auto w-full max-w-6xl flex-1 bg-[#F8FAFB] p-6 sm:p-8">
        {children}
      </main>
    </ProtectedRoute>
  );
}
