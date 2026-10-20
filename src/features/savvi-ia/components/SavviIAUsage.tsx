"use client";

import { Coins } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatTokens, formatUsd, totalTokens, type UsageTotals } from "../utils/usage";
import { toUsageTotals, type AiUsageSummary } from "../services/ai-usage.service";

interface SavviIAUsageProps {
  conversation: UsageTotals;
  /** Acumulado del backend; `null` mientras carga o si no se pudo leer. */
  summary: AiUsageSummary | null;
}

function Section({ title, usage }: { title: string; usage: UsageTotals }) {
  const rows: [string, string][] = [
    ["Entrada", formatTokens(usage.inputTokens)],
    ["  de caché", formatTokens(usage.cachedTokens)],
    ["Salida", formatTokens(usage.outputTokens)],
    ["Llamadas al modelo", formatTokens(usage.calls)],
  ];

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-semibold text-slate-900">{title}</h3>
        <span className="text-sm font-semibold tabular-nums text-slate-900">{formatUsd(usage.costUsd)}</span>
      </div>
      <p className="text-[11px] tabular-nums text-slate-500">{formatTokens(totalTokens(usage))} tokens</p>
      <dl className="mt-2 space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 text-[11px]">
            <dt className={label.startsWith("  ") ? "pl-3 text-slate-400" : "text-slate-500"}>{label.trim()}</dt>
            <dd className="tabular-nums text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>
      {usage.unpricedCalls > 0 && (
        <p className="mt-1.5 text-[11px] text-amber-700">
          {usage.unpricedCalls} llamadas usaron un modelo sin precio conocido y no están en el costo.
        </p>
      )}
    </section>
  );
}

/** Barra de cuánto del límite se ha usado. */
function Limit({ label, spent, limit }: { label: string; spent: number; limit: number }) {
  const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between gap-3 text-[11px]">
        <span className="text-slate-500">{label}</span>
        <span className="tabular-nums text-slate-700">
          {formatUsd(spent)} de {formatUsd(limit)}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${percent >= 90 ? "bg-red-400" : percent >= 70 ? "bg-amber-400" : "bg-emerald-400"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** Consumo de OpenAI del chat: discreto en el encabezado, detalle al tocarlo. */
export default function SavviIAUsage({ conversation, summary }: SavviIAUsageProps) {
  if (conversation.calls === 0 && !summary?.lifetime.calls) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="savvi-msg-in inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] tabular-nums text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          aria-label={`Consumo del modelo: ${formatTokens(totalTokens(conversation))} tokens, ${formatUsd(conversation.costUsd)} en esta conversación`}
        >
          <Coins className="h-3 w-3" aria-hidden />
          <span className="hidden sm:inline">{formatTokens(totalTokens(conversation))} tokens ·</span>
          {formatUsd(conversation.costUsd)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 rounded-xl border-slate-200 bg-white p-4 shadow-lg">
        <div className="space-y-4">
          <Section title="Esta conversación" usage={conversation} />
          {summary && (
            <>
              <div className="border-t border-slate-100" />
              <Section title="Este mes" usage={toUsageTotals(summary.month, summary.model)} />
              <div className="space-y-2">
                <Limit label="Hoy" spent={summary.quota.spentTodayUsd} limit={summary.quota.dailyLimitUsd} />
                <Limit label="Este mes" spent={summary.quota.spentMonthUsd} limit={summary.quota.monthlyLimitUsd} />
              </div>
              <div className="border-t border-slate-100" />
              <Section title="Total acumulado" usage={toUsageTotals(summary.lifetime, summary.model)} />
            </>
          )}
          <p className="border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-400">
            Estimación con precios públicos de OpenAI{summary?.model ? ` para ${summary.model}` : ""}. Incluye todo tu uso
            de Savvi IA (chat, voz y registro con IA) en cualquier dispositivo; la factura de OpenAI es la cifra real.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
