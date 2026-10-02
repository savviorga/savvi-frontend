"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import LoginForm from "@/features/auth/components/LoginForm";
import LoginPageLayout from "@/features/auth/components/LoginPageLayout";
import TwoFactorLoginForm from "@/features/auth/components/TwoFactorLoginForm";

/** Reto 2FA en curso: solo en memoria, nunca en `localStorage`. */
type TwoFactorStep = {
  twoFactorToken: string;
  email: string;
  codeSentAt: number;
};

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
  const { login, verifyTwoFactor, loading, isAuthenticated, status } = useAuth();
  const initialCheckDone = useRef(false);
  const [twoFactor, setTwoFactor] = useState<TwoFactorStep | null>(null);
  const [lastEmail, setLastEmail] = useState("");

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
    setLastEmail(data.email);
    const result = await login(data, { callbackUrl });
    if (result.twoFactor) {
      setTwoFactor({
        twoFactorToken: result.twoFactor.twoFactorToken,
        email: data.email,
        codeSentAt: Date.now(),
      });
      return { success: false };
    }
    if (result.success && result.callbackUrl) {
      router.replace(result.callbackUrl);
      return { success: true };
    }
    return result;
  };

  const handleVerify = async (code: string) => {
    if (!twoFactor) return { success: false as const, error: "", restart: true };
    const result = await verifyTwoFactor(
      { twoFactorToken: twoFactor.twoFactorToken, code },
      { callbackUrl },
    );
    if (result.success && result.callbackUrl) {
      router.replace(result.callbackUrl);
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
      {twoFactor ? (
        <TwoFactorLoginForm
          twoFactorToken={twoFactor.twoFactorToken}
          email={twoFactor.email}
          codeSentAt={twoFactor.codeSentAt}
          onVerify={handleVerify}
          onRestart={() => setTwoFactor(null)}
        />
      ) : (
        <LoginForm
          onSubmit={handleSubmit}
          loading={loading}
          initialEmail={lastEmail}
        />
      )}
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
