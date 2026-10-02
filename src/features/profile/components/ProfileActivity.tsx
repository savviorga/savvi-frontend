"use client";

import type { LucideIcon } from "lucide-react";
import { Bot, ChartPie, FileText, Landmark, Repeat, Tag } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import type { ProfileSummary } from "../types/profile.type";

interface ActivityItem {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
}

function ActivityTile({ label, value, detail, icon: Icon, index }: ActivityItem & { index: number }) {
  const animated = useCountUp(value, 1000, 500 + index * 70);

  return (
    <div
      className="savvi-profile-rise group flex items-center gap-3 rounded-xl border border-gray-200/80 bg-white p-3.5 transition-colors hover:border-mint/40 hover:bg-mint/[0.03]"
      style={{ animationDelay: `${420 + index * 60}ms` }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-mint/12 group-hover:text-mint">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight tabular-nums text-[#0B1829]">{Math.round(animated)}</p>
        <p className="truncate text-xs font-medium text-gray-600">{label}</p>
        <p className="truncate text-[11px] text-gray-400">{detail}</p>
      </div>
    </div>
  );
}

export default function ProfileActivity({ summary }: { summary: ProfileSummary }) {
  const { categories, budgets, accounts, transferTemplates, documents, aiRegister, transactions } = summary;

  const items: ActivityItem[] = [
    {
      label: "Categorías",
      value: categories.count,
      detail: `${categories.income} de ingreso · ${categories.expense} de gasto`,
      icon: Tag,
    },
    {
      label: "Presupuestos",
      value: budgets.count,
      detail: `${budgets.currentMonth} este mes`,
      icon: ChartPie,
    },
    {
      label: "Cuentas",
      value: accounts.count,
      detail: accounts.credit > 0 ? `${accounts.credit} de crédito` : "Sin tarjetas de crédito",
      icon: Landmark,
    },
    {
      label: "Pagos recurrentes",
      value: transferTemplates.count,
      detail: `${transferTemplates.active} activos`,
      icon: Repeat,
    },
    {
      label: "Documentos",
      value: documents.count,
      detail: `En ${transactions.withAttachments} transacciones`,
      icon: FileText,
    },
    {
      label: "Registros con IA",
      value: aiRegister.count,
      detail: `${aiRegister.completed} completados`,
      icon: Bot,
    },
  ];

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-[#0B1829]">Tu actividad en Savvi</h3>
        <p className="text-xs text-gray-500">Todo lo que has configurado hasta hoy</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <ActivityTile key={item.label} {...item} index={i} />
        ))}
      </div>
    </section>
  );
}
