"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, BarChart3, RefreshCw, ShieldCheck, UserPen } from "lucide-react";
import SavviTabs, { type SavviTabItem } from "@/components/Tabs/SavviTabs";
import { useProfile } from "../hooks/useProfile";
import ProfileHero from "./ProfileHero";
import ProfileMetricsGrid from "./ProfileMetricsGrid";
import ProfileCashFlow from "./ProfileCashFlow";
import ProfileTopCategories from "./ProfileTopCategories";
import ProfileActivity from "./ProfileActivity";
import ProfileEditForm from "./ProfileEditForm";
import ProfileSecurityCard from "./ProfileSecurityCard";
import ProfileTwoFactorCard from "./ProfileTwoFactorCard";

type TabId = "overview" | "edit" | "security";

const TABS: SavviTabItem<TabId>[] = [
  { id: "overview", label: "Resumen", icon: BarChart3 },
  { id: "edit", label: "Editar perfil", icon: UserPen },
  { id: "security", label: "Seguridad", icon: ShieldCheck },
];

function ProfileSkeleton() {
  return (
    <div className="space-y-6 pb-10" aria-busy="true" aria-label="Cargando tu perfil">
      <div className="h-[220px] animate-pulse rounded-3xl bg-[#0A1622]/90" />
      <div className="h-12 w-full max-w-md animate-pulse rounded-2xl bg-gray-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[112px] animate-pulse rounded-2xl bg-gray-200/60" />
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const {
    summary,
    loading,
    error,
    reload,
    update,
    changePassword,
    requestTwoFactorEnable,
    confirmTwoFactorEnable,
    disableTwoFactor,
  } = useProfile();
  const [tab, setTab] = useState<TabId>("overview");

  if (loading && !summary) return <ProfileSkeleton />;

  if (error || !summary) {
    return (
      <div className="savvi-profile-rise flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
          <AlertCircle className="h-7 w-7 text-rose-500" />
        </div>
        <div>
          <p className="text-base font-semibold text-[#0B1829]">No pudimos cargar tu perfil</p>
          <p className="mt-1 text-sm text-gray-500">{error ?? "Inténtalo de nuevo en unos segundos."}</p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0B1829] px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      </div>
    );
  }

  const { user } = summary;
  const memberSince = format(new Date(summary.memberSince), "MMMM 'de' yyyy", { locale: es });

  return (
    <div className="space-y-6 pb-10">
      <ProfileHero
        name={user.name}
        email={user.email}
        memberSince={memberSince}
        daysActive={summary.daysActive}
        savingsRate={summary.totals.savingsRate}
      />

      <SavviTabs tabs={TABS} value={tab} onChange={setTab} ariaLabel="Secciones del perfil" sticky />

      {/* key fuerza el remonte para repetir las animaciones de entrada */}
      <div key={tab} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "overview" && (
          <div className="space-y-6">
            <ProfileMetricsGrid summary={summary} />
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="min-w-0 lg:col-span-3">
                <ProfileCashFlow data={summary.monthly} />
              </div>
              <div className="lg:col-span-2">
                <ProfileTopCategories categories={summary.topExpenseCategories} />
              </div>
            </div>
            <ProfileActivity summary={summary} />
          </div>
        )}

        {tab === "edit" && <ProfileEditForm user={user} onSave={update} />}

        {tab === "security" && (
          <div className="space-y-5">
            <ProfileTwoFactorCard
              enabled={!!user.twoFactorEnabled}
              email={user.email}
              onRequestEnable={requestTwoFactorEnable}
              onConfirmEnable={confirmTwoFactorEnable}
              onDisable={disableTwoFactor}
            />
            <ProfileSecurityCard onChangePassword={changePassword} />
          </div>
        )}
      </div>
    </div>
  );
}
