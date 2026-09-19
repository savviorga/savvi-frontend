"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import VoiceRecorder from "@/components/Audio/VoiceRecorder";
import { isApiError, getErrorMessages } from "@/types/api-error.type";
import { cn } from "@/lib/utils";
import {
  AiTransactionService,
  type DetectedTransaction,
} from "../services/ai-transaction.service";
import type { Account, Category } from "../types/catalog.types";

interface SmartTransactionCaptureProps {
  categories: Category[];
  accounts: Account[];
  /** Recibe solo los campos detectados para volcarlos en el formulario. */
  onDetected: (detected: DetectedTransaction) => void;
  disabled?: boolean;
}

type Phase = "idle" | "transcribing" | "analyzing";

const FIELD_LABELS: Record<keyof DetectedTransaction, string> = {
  type: "Tipo",
  amount: "Monto",
  date: "Fecha",
  accountId: "Cuenta",
  categoryId: "Categoría",
  description: "Descripción",
};

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Etiquetas legibles de lo que la IA completó, para que el usuario lo revise. */
function buildSummary(
  detected: DetectedTransaction,
  categories: Category[],
  accounts: Account[],
): { applied: string[]; missing: string[] } {
  const applied: string[] = [];
  const missing: string[] = [];

  const push = (key: keyof DetectedTransaction, value: string | null) => {
    if (value) applied.push(value);
    else missing.push(FIELD_LABELS[key].toLowerCase());
  };

  push("type", detected.type);
  push("amount", detected.amount != null ? currency.format(detected.amount) : null);
  push("date", detected.date);
  push(
    "accountId",
    accounts.find((a) => a.id === detected.accountId)?.name ?? null,
  );
  push(
    "categoryId",
    categories.find((c) => c.id === detected.categoryId)?.name ?? null,
  );
  push("description", detected.description);

  return { applied, missing };
}

export default function SmartTransactionCapture({
  categories,
  accounts,
  onDetected,
  disabled = false,
}: SmartTransactionCaptureProps) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    applied: string[];
    missing: string[];
  } | null>(null);

  const busy = phase !== "idle";

  const describeError = (err: unknown, fallback: string) => {
    if (isApiError(err)) return getErrorMessages(err).join(" ");
    return err instanceof Error ? err.message : fallback;
  };

  const analyze = async (value: string) => {
    const clean = value.trim();
    if (!clean) return;

    setPhase("analyzing");
    setError(null);
    try {
      const detected = await AiTransactionService.parse(clean, categories, accounts);
      onDetected(detected);
      setSummary(buildSummary(detected, categories, accounts));
    } catch (err) {
      setError(describeError(err, "No se pudo analizar la descripción."));
      setSummary(null);
    } finally {
      setPhase("idle");
    }
  };

  const handleRecorded = async (audio: Blob, fileName: string) => {
    setPhase("transcribing");
    setError(null);
    setSummary(null);

    try {
      const transcription = await AiTransactionService.transcribe(audio, fileName);
      setText(transcription);
      await analyze(transcription);
    } catch (err) {
      setError(describeError(err, "No se pudo transcribir el audio."));
      setPhase("idle");
    }
  };

  return (
    <section className="rounded-2xl border border-mint/30 bg-mint/[0.06] p-3 sm:p-4">
      <header className="mb-3 flex items-start gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint/20 text-[#0B1829]"
          aria-hidden
        >
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            Registra hablando
          </h3>
          <p className="text-xs text-muted-foreground">
            Cuéntalo con tus palabras: «ayer pagué 45 mil del mercado con
            Bancolombia» y llenamos el formulario por ti.
          </p>
        </div>
      </header>

      <VoiceRecorder onRecorded={handleRecorded} disabled={disabled || busy} />

      <div className="mt-3">
        <label
          htmlFor="ai-transaction-text"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          O escríbelo
        </label>
        <textarea
          id="ai-transaction-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || busy}
          rows={2}
          placeholder="Ej. Recibí 2 millones de sueldo el lunes"
          className="block w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-base transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-60 sm:text-sm"
        />

        <button
          type="button"
          onClick={() => analyze(text)}
          disabled={disabled || busy || !text.trim()}
          className={cn(
            "mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1829] px-4 py-2.5 text-sm font-semibold text-white transition",
            "hover:bg-[#0B1829]/90 active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {phase === "transcribing" ? "Transcribiendo audio…" : "Analizando…"}
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" aria-hidden />
              Completar formulario
            </>
          )}
        </button>
      </div>

      <div aria-live="polite">
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        {summary ? (
          <div className="mt-3 space-y-2 border-t border-mint/30 pt-3">
            {summary.applied.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Completado:
                </span>
                {summary.applied.map((value) => (
                  <span
                    key={value}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                  >
                    {value}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No se pudo deducir ningún dato. Prueba dando más detalles.
              </p>
            )}

            {summary.missing.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Falta completar: {summary.missing.join(", ")}.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
