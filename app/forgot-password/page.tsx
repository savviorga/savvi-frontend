"use client";

import { useRouter } from "next/navigation";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import ForgotPasswordBrandingPanel from "@/features/auth/components/ForgotPasswordBrandingPanel";
import LoginPageLayout from "@/features/auth/components/LoginPageLayout";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <LoginPageLayout panel={<ForgotPasswordBrandingPanel />}>
      <ForgotPasswordForm onSuccess={() => router.replace("/login")} />
    </LoginPageLayout>
  );
}
