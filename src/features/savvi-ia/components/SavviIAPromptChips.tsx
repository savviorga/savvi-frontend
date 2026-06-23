"use client";

interface SavviIAPromptChipsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
}

export default function SavviIAPromptChips({
  prompts,
  onSelectPrompt,
}: SavviIAPromptChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelectPrompt(prompt)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 md:text-sm"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
