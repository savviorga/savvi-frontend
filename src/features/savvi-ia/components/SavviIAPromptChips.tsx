"use client";

import { ArrowUpRight } from "lucide-react";

interface SavviIAPromptChipsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export default function SavviIAPromptChips({
  prompts,
  onSelectPrompt,
  disabled = false,
}: SavviIAPromptChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt, index) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelectPrompt(prompt)}
          disabled={disabled}
          style={{ animationDelay: `${0.25 + index * 0.08}s` }}
          className="savvi-msg-in group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md hover:shadow-emerald-500/10 disabled:pointer-events-none disabled:opacity-50 md:text-sm"
        >
          {prompt}
          <ArrowUpRight
            className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-500"
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}
