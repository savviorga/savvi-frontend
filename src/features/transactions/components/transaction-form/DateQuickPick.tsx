import { format, parse, subDays } from "date-fns";
import { Check } from "lucide-react";
import SavvyDatePicker from "@/components/SavvyDatePicker/SavvyDatePicker";
import { cn } from "@/lib/utils";
import FormSection from "./FormSection";
import { CHIP_BASE, CHIP_IDLE, CHIP_SELECTED } from "./theme";

const ISO = "yyyy-MM-dd";

/** "Hoy" y "Ayer" cubren casi todos los registros; el calendario queda para lo demás. */
export default function DateQuickPick({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (iso: string) => void;
  error?: boolean;
}) {
  const today = format(new Date(), ISO);
  const yesterday = format(subDays(new Date(), 1), ISO);
  const isOther = Boolean(value) && value !== today && value !== yesterday;

  const quick = [
    { iso: today, label: "Hoy" },
    { iso: yesterday, label: "Ayer" },
  ];

  return (
    <FormSection id="tx-section-date" title="¿Cuándo?" error={error}>
      <div className="flex flex-wrap items-center gap-2">
        {quick.map(({ iso, label }) => (
          <button
            key={label}
            type="button"
            aria-pressed={value === iso}
            onClick={() => onChange(iso)}
            className={cn(CHIP_BASE, "px-5", value === iso ? CHIP_SELECTED : CHIP_IDLE)}
          >
            {value === iso ? (
              <Check
                className="h-4 w-4 text-mint-dim motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-200"
                aria-hidden
              />
            ) : null}
            {label}
          </button>
        ))}
        <SavvyDatePicker
          label=""
          value={isOther ? parse(value, ISO, new Date()) : null}
          onChange={(date) => onChange(date ? format(date, ISO) : "")}
          placeholder="Otra fecha"
          dateFormat="EEE d 'de' MMM"
          className="w-auto"
          triggerClassName={cn(
            CHIP_BASE,
            "h-auto w-auto flex-none justify-center text-sm font-medium capitalize [&>svg]:mr-0",
            isOther ? cn(CHIP_SELECTED, "text-[#0B1829]") : cn(CHIP_IDLE, "text-gray-700")
          )}
        />
      </div>
    </FormSection>
  );
}
