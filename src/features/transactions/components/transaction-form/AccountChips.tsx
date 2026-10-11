import { Check, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Account } from "../../types/catalog.types";
import FormSection from "./FormSection";
import { CHIP_BASE, CHIP_IDLE, CHIP_SELECTED, enterAnimation } from "./theme";

export default function AccountChips({
  accounts,
  value,
  onChange,
  title,
  error,
}: {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
  title: string;
  error?: boolean;
}) {
  return (
    <FormSection id="tx-section-account" title={title} error={error}>
      {accounts.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
          Aún no tienes cuentas. Créalas en Cuentas.
        </p>
      ) : (
        <div role="radiogroup" aria-labelledby="tx-section-account-title" className="flex flex-wrap gap-2">
          {accounts.map((acc, index) => {
            const selected = acc.id === value;
            const enter = enterAnimation(index, 30);
            return (
              <button
                key={acc.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(acc.id)}
                style={enter.style}
                className={cn(
                  CHIP_BASE,
                  enter.className,
                  "motion-safe:duration-300",
                  selected ? CHIP_SELECTED : CHIP_IDLE
                )}
              >
                {selected ? (
                  <Check className="h-4 w-4 text-mint-dim animate-in zoom-in-50 duration-200" aria-hidden />
                ) : (
                  <Wallet
                    className="h-4 w-4 text-gray-400 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-200"
                    aria-hidden
                  />
                )}
                <span className="max-w-[12rem] truncate">{acc.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </FormSection>
  );
}
