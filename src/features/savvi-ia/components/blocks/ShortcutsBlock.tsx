import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AdvisorBlock } from "../../types/proposal.types";
import { DESTINATIONS } from "../../utils/blocks";

/** Botones a otras pantallas; las rutas salen de una lista cerrada, nunca del modelo. */
export default function ShortcutsBlock({ block }: { block: Extract<AdvisorBlock, { type: "shortcuts" }> }) {
  return (
    <div className="mt-2 flex w-full flex-wrap gap-2">
      {block.buttons.map((button, index) => (
        <Link
          key={`${button.destination}-${button.text}`}
          href={DESTINATIONS[button.destination].href}
          style={{ animationDelay: `${index * 80}ms` }}
          className="savvi-msg-in group inline-flex items-center gap-2 rounded-full border border-mint/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1829] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-mint hover:bg-mint/5 hover:shadow-md hover:shadow-mint/15 active:translate-y-0 active:scale-[.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50"
        >
          {button.text}
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint/15 text-mint-dim transition-all duration-200 group-hover:translate-x-0.5 group-hover:bg-mint group-hover:text-cosmos">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </Link>
      ))}
    </div>
  );
}
