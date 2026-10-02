"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  ChartPie,
  HandCoins,
  Landmark,
  Loader2,
  Receipt,
  Repeat,
  Tag,
  XCircle,
} from "lucide-react";
import type { Proposal, ProposalKind } from "../types/proposal.types";
import {
  PROPOSAL_META,
  TRANSACTION_BATCH_SIZE,
  formatCop,
  proposalNoun,
  toItemViews,
  type BadgeTone,
} from "../utils/proposals";

interface SavviIAProposalCardProps {
  proposal: Proposal;
  disabled?: boolean;
  onToggle: (index: number) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}

const KIND_ICON: Record<ProposalKind, LucideIcon> = {
  categories: Tag,
  accounts: Landmark,
  transactions: ArrowRightLeft,
  budgets: ChartPie,
  debts: Receipt,
  debtPayments: HandCoins,
  recurring: Repeat,
};

const BADGE_CLASS: Record<BadgeTone, string> = {
  income: "bg-emerald-50 text-emerald-700",
  expense: "bg-rose-50 text-rose-600",
  credit: "bg-violet-50 text-violet-700",
  neutral: "bg-slate-100 text-slate-600",
};

const AMOUNT_CLASS: Record<BadgeTone, string> = {
  income: "text-emerald-600",
  expense: "text-rose-600",
  credit: "text-violet-600",
  neutral: "text-slate-800",
};

export default function SavviIAProposalCard({
  proposal,
  disabled = false,
  onToggle,
  onConfirm,
  onDismiss,
}: SavviIAProposalCardProps) {
  const items = toItemViews(proposal);
  const meta = PROPOSAL_META[proposal.kind];
  const selectedCount = proposal.selected.filter(Boolean).length;
  const isPending = proposal.status === "pending";
  const isCreating = proposal.status === "creating";
  const doneCount = proposal.results?.filter((r) => r?.ok).length ?? 0;
  const failedCount = proposal.results?.filter((r) => r && !r.ok).length ?? 0;
  const processed = doneCount + failedCount;
  const progress = selectedCount ? Math.round((processed / selectedCount) * 100) : 0;
  const batchCount = proposal.kind === "transactions" ? Math.ceil(selectedCount / TRANSACTION_BATCH_SIZE) : 0;
  const currentBatch = Math.min(Math.floor(processed / TRANSACTION_BATCH_SIZE) + 1, batchCount);
  const HeaderIcon = KIND_ICON[proposal.kind];
  const total = items.reduce((sum, item, i) => sum + (proposal.selected[i] && item.amount ? item.amount.value : 0), 0);
  const showTotal = items.length > 1 && items.every((item) => item.amount);

  return (
    <div
      className={`savvi-msg-in mt-3 w-full overflow-hidden rounded-2xl border bg-white shadow-sm transition-opacity ${
        proposal.status === "dismissed" ? "border-slate-200 opacity-60" : "border-emerald-200"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2.5">
        <HeaderIcon className="h-4 w-4 text-emerald-600" aria-hidden />
        <p className="text-sm font-semibold text-slate-800">
          {items.length === 1 ? `Propuesta: ${meta.one}` : `${items.length} ${meta.many} propuestas`}
        </p>
        {showTotal && (
          <span className="ml-auto text-xs font-semibold tabular-nums text-slate-600">Total {formatCop(total)}</span>
        )}
      </div>

      {isCreating && (
        <div className="border-b border-slate-100 px-4 py-2.5" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              Guardando {processed} de {selectedCount}
              {batchCount > 1 && ` · lote ${currentBatch} de ${batchCount}`}
            </span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <ul className={`divide-y divide-slate-100 ${items.length > 8 ? "max-h-[26rem] overflow-y-auto" : ""}`}>
        {items.map((item, index) => {
          const checked = proposal.selected[index];
          const result = proposal.results?.[index];
          const isWorking = isCreating && checked && !result;

          return (
            <li key={`${item.title}-${index}`} className="savvi-msg-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <label
                className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${
                  isPending && !disabled ? "cursor-pointer hover:bg-slate-50" : ""
                } ${!checked ? "opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={checked}
                  disabled={!isPending || disabled}
                  onChange={() => onToggle(index)}
                />
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-300 ${
                    checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-transparent"
                  }`}
                  aria-hidden
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {item.color && (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
                    )}
                    <span className="text-sm font-medium text-slate-800">{item.title}</span>
                    {item.badge && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${BADGE_CLASS[item.badge.tone]}`}
                      >
                        {item.badge.label}
                      </span>
                    )}
                  </span>
                  {item.detail && <span className="mt-0.5 block text-xs text-slate-500">{item.detail}</span>}
                  {item.warning && !result && (
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
                      {item.warning}
                    </span>
                  )}
                  {result && !result.ok && <span className="mt-0.5 block text-xs text-red-600">{result.error}</span>}
                </span>

                {item.amount && (
                  <span className={`mt-0.5 shrink-0 text-sm font-semibold tabular-nums ${AMOUNT_CLASS[item.amount.tone]}`}>
                    {item.amount.tone === "income" ? "+" : item.amount.tone === "expense" ? "−" : ""}
                    {formatCop(item.amount.value)}
                  </span>
                )}

                <span className="mt-0.5 w-4 shrink-0">
                  {isWorking && <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />}
                  {result?.ok && <CheckCircle2 className="savvi-msg-in h-4 w-4 text-emerald-500" />}
                  {result && !result.ok && <XCircle className="savvi-msg-in h-4 w-4 text-red-500" />}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
        {proposal.status === "dismissed" && <p className="mr-auto text-xs text-slate-500">Propuesta descartada</p>}
        {proposal.status === "done" && (
          <p className="savvi-msg-in mr-auto flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            {doneCount} {proposalNoun(proposal.kind, doneCount)} {doneCount === 1 ? meta.done : meta.doneMany}
            {failedCount > 0 && <span className="text-red-600">· {failedCount} con error</span>}
          </p>
        )}

        {(isPending || isCreating) && (
          <>
            <button
              type="button"
              onClick={onDismiss}
              disabled={isCreating || disabled}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              Ahora no
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isCreating || disabled || selectedCount === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-500/30 transition-all hover:scale-[1.03] hover:shadow-md active:scale-95 disabled:scale-100 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
              {isCreating ? `Guardando ${processed}/${selectedCount}...` : `${meta.verb} ${selectedCount}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
