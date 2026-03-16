"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import LoginForm from "@/features/auth/components/LoginForm";

const DEFAULT_REDIRECT = "/transactions";

function safeRedirectUrl(callbackUrl: string | null): string {
  if (!callbackUrl || typeof callbackUrl !== "string") return DEFAULT_REDIRECT;
  const path = callbackUrl.startsWith("/") ? callbackUrl : `/${callbackUrl}`;
  if (!path.startsWith("/") || path.startsWith("//")) return DEFAULT_REDIRECT;
  return path;
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, loading, isAuthenticated, status } = useAuth();
  const initialCheckDone = useRef(false);

  const callbackUrl = useMemo(
    () => safeRedirectUrl(searchParams.get("callbackUrl")),
    [searchParams],
  );

  useEffect(() => {
    if (status === "loading") return;
    initialCheckDone.current = true;
    if (isAuthenticated) {
      router.refresh();
      router.replace(callbackUrl);
    }
  }, [isAuthenticated, status, callbackUrl, router]);

  const handleSubmit = async (data: { email: string; password: string }) => {
    const result = await login(data, { callbackUrl });
    if (result.success && result.callbackUrl) {
      router.replace(result.callbackUrl);
      return { success: true };
    }
    return result;
  };

  const showInitialLoading = status === "loading" && !initialCheckDone.current;
  if (showInitialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-500">Comprobando sesión…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-indigo-600 mb-6"
      >
        ← Volver al inicio
      </Link>
      <LoginForm onSubmit={handleSubmit} loading={loading} />
      <p className="mt-4 text-center text-sm text-gray-500">
        Al iniciar sesión serás redirigido automáticamente.
      </p>
    </div>
  );
}
