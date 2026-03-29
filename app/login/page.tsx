"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import LoginForm from "@/features/auth/components/LoginForm";
import LoginPageLayout from "@/features/auth/components/LoginPageLayout";

const DEFAULT_REDIRECT = "/transactions";

function safeRedirectUrl(callbackUrl: string | null): string {
  if (!callbackUrl || typeof callbackUrl !== "string") return DEFAULT_REDIRECT;
  const path = callbackUrl.startsWith("/") ? callbackUrl : `/${callbackUrl}`;
  if (!path.startsWith("/") || path.startsWith("//")) return DEFAULT_REDIRECT;
  return path;
}

function LoginPageInner() {
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

  const showInitialLoading =
    status === "loading" && !initialCheckDone.current;
  if (showInitialLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#011627] px-4">
        <p className="text-sm text-slate-400">Comprobando sesión…</p>
      </div>
    );
  }

  return (
    <LoginPageLayout>
      <LoginForm onSubmit={handleSubmit} loading={loading} />
    </LoginPageLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#011627] px-4">
          <p className="text-sm text-slate-400">Cargando…</p>
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
