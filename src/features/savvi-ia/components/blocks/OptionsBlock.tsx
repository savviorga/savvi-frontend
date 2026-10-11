"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  CreditCard,
  HelpCircle,
  Landmark,
  PiggyBank,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvisorBlock, AdvisorOptionIcon } from "../../types/proposal.types";

const ICONS: Record<AdvisorOptionIcon, { icon: LucideIcon; tint: string }> = {
  gasto: { icon: ArrowUpRight, tint: "bg-rose-50 text-rose-600" },
  ingreso: { icon: ArrowDownLeft, tint: "bg-emerald-50 text-emerald-600" },
  ahorro: { icon: PiggyBank, tint: "bg-mint/15 text-mint-dim" },
  presupuesto: { icon: Wallet, tint: "bg-amber-50 text-amber-600" },
  deuda: { icon: Landmark, tint: "bg-orange-50 text-orange-600" },
  meta: { icon: Target, tint: "bg-violet-50 text-violet-600" },
  calendario: { icon: CalendarDays, tint: "bg-sky-50 text-sky-600" },
  tarjeta: { icon: CreditCard, tint: "bg-indigo-50 text-indigo-600" },
  grafico: { icon: BarChart3, tint: "bg-teal-50 text-teal-600" },
  pregunta: { icon: HelpCircle, tint: "bg-slate-100 text-slate-600" },
};

type OptionsBlockData = Extract<AdvisorBlock, { type: "options" }>;

/**
 * Tarjetas que se tocan en vez de escribir. Una sola elección se envía al tocar;
 * con `multiple` se marcan varias y se envían con "Listo". Ya respondida, queda
 * resaltada la elección y lo demás se atenúa.
 */
export default function OptionsBlock({
  block,
  answer,
  disabled,
  onAnswer,
}: {
  block: OptionsBlockData;
  answer?: string;
  disabled?: boolean;
  onAnswer?: (answer: string) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const answered = answer !== undefined;
  const chosen = answered ? answer.split(" · ") : picked;
  const locked = answered || disabled || !onAnswer;

  const choose = (text: string) => {
    if (locked) return;
    if (!block.multiple) {
      setPicked([text]);
      onAnswer?.(text);
      return;
    }
    setPicked((prev) => (prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]));
  };

  return (
    <div className="mt-2 w-full space-y-2">
      {block.question && (
        <p className="savvi-msg-in px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {block.question}
        </p>
      )}

      <div
        role={block.multiple ? "group" : "radiogroup"}
        aria-label={block.question ?? "Opciones"}
        className="grid gap-2 sm:grid-cols-2"
      >
        {block.options.map((option, index) => {
          const { icon: Icon, tint } = ICONS[option.icon];
          const selected = chosen.includes(option.text);
          const faded = answered && !selected;
          return (
            <button
              key={option.text}
              type="button"
              role={block.multiple ? "checkbox" : "radio"}
              aria-checked={selected}
              disabled={locked && !selected}
              onClick={() => choose(option.text)}
              style={{ animationDelay: `${index * 70}ms` }}
              className={cn(
                "savvi-msg-in group flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 text-left shadow-sm transition-all duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50",
                !locked && "hover:-translate-y-0.5 hover:border-mint/50 hover:shadow-md hover:shadow-mint/10 active:translate-y-0 active:scale-[.98]",
                selected ? "border-mint ring-2 ring-mint/40" : "border-slate-200",
                faded && "scale-[.98] opacity-40",
                locked && !selected && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300",
                  !locked && "group-hover:-rotate-6 group-hover:scale-110",
                  tint
                )}
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">{option.text}</span>
                {option.description && (
                  <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                    {option.description}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
                  selected ? "border-mint bg-mint text-cosmos" : "border-slate-200 bg-white"
                )}
                aria-hidden
              >
                {selected && <Check className="savvi-pop h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {block.multiple && !answered && (
        <button
          type="button"
          disabled={locked || picked.length === 0}
          onClick={() => onAnswer?.(picked.join(" · "))}
          className="savvi-msg-in flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all duration-200 hover:shadow-lg active:scale-[.98] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
          style={{ animationDelay: `${block.options.length * 70}ms` }}
        >
          <Check className="h-4 w-4" />
          {picked.length ? `Listo (${picked.length})` : "Elige una o varias"}
        </button>
      )}
    </div>
  );
}
