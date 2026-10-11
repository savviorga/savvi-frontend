import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvisorAlertTone, AdvisorBlock } from "../../types/proposal.types";

const TONES: Record<AdvisorAlertTone, { icon: LucideIcon; box: string; icon_: string; title: string }> = {
  peligro: {
    icon: CircleAlert,
    box: "border-rose-200 bg-rose-50",
    icon_: "bg-rose-100 text-rose-600 savvi-glow",
    title: "text-rose-800",
  },
  advertencia: {
    icon: TriangleAlert,
    box: "border-amber-200 bg-amber-50",
    icon_: "bg-amber-100 text-amber-600",
    title: "text-amber-800",
  },
  exito: {
    icon: CircleCheck,
    box: "border-emerald-200 bg-emerald-50",
    icon_: "bg-emerald-100 text-emerald-600",
    title: "text-emerald-800",
  },
  info: {
    icon: Info,
    box: "border-sky-200 bg-sky-50",
    icon_: "bg-sky-100 text-sky-600",
    title: "text-sky-800",
  },
};

/** Aviso destacado; el ícono entra con un pequeño salto y en "peligro" late suave. */
export default function AlertBlock({ block }: { block: Extract<AdvisorBlock, { type: "alert" }> }) {
  const tone = TONES[block.tone];
  const Icon = tone.icon;
  return (
    <div
      role={block.tone === "peligro" ? "alert" : "status"}
      className={cn("savvi-msg-in mt-2 flex w-full items-start gap-3 rounded-2xl border px-4 py-3", tone.box)}
    >
      <span className={cn("savvi-pop flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tone.icon_)}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className={cn("text-sm font-semibold", tone.title)}>{block.title}</p>
        {block.detail && <p className="mt-0.5 text-sm text-slate-600">{block.detail}</p>}
      </div>
    </div>
  );
}
