import ChipSelect from "@/components/Inputs/ChipSelect";
import { cn } from "@/lib/utils";
import type {
  TransferFrequency,
  TransferRecurrenceType,
} from "@/features/transfer-templates/types/transfer.types";
import {
  intervalToDays,
  type IntervalUnit,
} from "@/features/transfer-templates/utils/interval";

export type RecurringForm = {
  name: string;
  payeeName: string;
  payeeAccount: string;
  payeeBank: string;
  recurrenceType: TransferRecurrenceType;
  frequency: TransferFrequency;
  /** Solo UI: se convierte a días al enviar si frequency === "custom". */
  customIntervalAmount: number;
  customIntervalUnit: IntervalUnit;
  dayOfMonth: number;
};

export const EMPTY_RECURRING: RecurringForm = {
  name: "",
  payeeName: "",
  payeeAccount: "",
  payeeBank: "",
  recurrenceType: "reminder",
  frequency: "monthly",
  customIntervalAmount: 1,
  customIntervalUnit: "months",
  dayOfMonth: 1,
};

export const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-base transition placeholder:text-gray-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25 sm:h-10 sm:text-sm";

const LABEL_CLASS = "mb-1.5 block text-xs font-semibold text-gray-600";

const RECURRENCE_HELP: Record<TransferRecurrenceType, string> = {
  reminder: "Te avisamos cuando se acerque la fecha y tú confirmas el pago.",
  automatic: "Se registra solo cada vez que vence.",
};

export default function RecurringFields({
  value,
  onChange,
  payeeError,
  namePlaceholder,
}: {
  value: RecurringForm;
  onChange: (patch: Partial<RecurringForm>) => void;
  payeeError?: boolean;
  namePlaceholder?: string;
}) {
  return (
    <div className="space-y-4">
      <div id="tx-section-payee" className={cn("scroll-mt-4", payeeError && "animate-shake")}>
        <label htmlFor="tx-payee" className={cn(LABEL_CLASS, payeeError && "text-rose-600")}>
          ¿A quién le pagas? {payeeError ? "· Requerido" : null}
        </label>
        <input
          id="tx-payee"
          type="text"
          value={value.payeeName}
          onChange={(e) => onChange({ payeeName: e.target.value })}
          placeholder="Ej. Gas Natural"
          maxLength={200}
          aria-invalid={payeeError || undefined}
          className={cn(INPUT_CLASS, payeeError && "border-rose-400 ring-2 ring-rose-200")}
        />
      </div>

      <div>
        <label htmlFor="tx-recurring-name" className={LABEL_CLASS}>
          Nombre corto <span className="font-normal text-gray-400">(opcional)</span>
        </label>
        <input
          id="tx-recurring-name"
          type="text"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={namePlaceholder || "Ej. Arriendo apartamento"}
          maxLength={200}
          className={INPUT_CLASS}
        />
        <p className="mt-1 text-xs text-gray-400">
          Así lo verás en tus pagos recurrentes. La descripción se guarda aparte.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="tx-payee-bank" className={LABEL_CLASS}>
            Banco <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            id="tx-payee-bank"
            type="text"
            value={value.payeeBank}
            onChange={(e) => onChange({ payeeBank: e.target.value })}
            placeholder="Ej. Bancolombia"
            maxLength={100}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="tx-payee-account" className={LABEL_CLASS}>
            Número de cuenta <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            id="tx-payee-account"
            type="text"
            inputMode="numeric"
            value={value.payeeAccount}
            onChange={(e) => onChange({ payeeAccount: e.target.value })}
            maxLength={100}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <p className={LABEL_CLASS}>¿Cada cuánto?</p>
        <ChipSelect
          ariaLabel="Frecuencia"
          options={[
            { label: "Semanal", value: "weekly" },
            { label: "Quincenal", value: "biweekly" },
            { label: "Mensual", value: "monthly" },
            { label: "Bimestral", value: "bimonthly" },
            { label: "Otro", value: "custom" },
          ] as const}
          value={value.frequency}
          onChange={(frequency) => onChange({ frequency })}
        />

        {value.frequency === "custom" ? (
          <div className="mt-3 rounded-xl bg-gray-50 p-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Cada</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={3660}
                aria-label="Cantidad"
                value={value.customIntervalAmount}
                onChange={(e) => onChange({ customIntervalAmount: Number(e.target.value) })}
                className={cn(INPUT_CLASS, "w-20 text-center")}
              />
              <select
                aria-label="Unidad"
                value={value.customIntervalUnit}
                onChange={(e) =>
                  onChange({ customIntervalUnit: e.target.value as IntervalUnit })
                }
                className={cn(INPUT_CLASS, "flex-1")}
              >
                <option value="days">día(s)</option>
                <option value="weeks">semana(s)</option>
                <option value="months">mes(es)</option>
                <option value="years">año(s)</option>
              </select>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              ≈ {intervalToDays(value.customIntervalAmount, value.customIntervalUnit)} días
              entre cada pago
            </p>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="tx-day-of-month" className="text-sm text-gray-600">
              Vence el día
            </label>
            <input
              id="tx-day-of-month"
              type="number"
              inputMode="numeric"
              min={1}
              max={28}
              value={value.dayOfMonth}
              onChange={(e) =>
                onChange({
                  dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value) || 1)),
                })
              }
              className={cn(INPUT_CLASS, "w-20 text-center")}
            />
            <span className="text-xs text-gray-400">(1 a 28)</span>
          </div>
        )}
      </div>

      <div>
        <p className={LABEL_CLASS}>¿Cómo quieres manejarlo?</p>
        <ChipSelect
          ariaLabel="Tipo de pago recurrente"
          options={[
            { label: "Recordarme", value: "reminder" },
            { label: "Automático", value: "automatic" },
          ] as const}
          value={value.recurrenceType}
          onChange={(recurrenceType) => onChange({ recurrenceType })}
        />
        <p className="mt-2 text-xs text-gray-500">{RECURRENCE_HELP[value.recurrenceType]}</p>
      </div>
    </div>
  );
}
