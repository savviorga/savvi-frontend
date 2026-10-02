"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, Paperclip, Search, XCircle } from "lucide-react";
import SavviIAAvatar from "./SavviIAAvatar";
import SavviIAProposalCard from "./SavviIAProposalCard";
import SavviIAChart from "./SavviIAChart";
import SavviIAMarkdown from "./SavviIAMarkdown";
import type { AdvisorChart, AdvisorStep, Proposal } from "../types/proposal.types";

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  timestamp: string;
  attachmentName?: string;
  status?: "queued" | "processing" | "completed" | "failed";
  /** Aviso de error local; no se envía como historial al modelo. */
  isError?: boolean;
  /** Revela el texto palabra por palabra (respuestas nuevas del modelo). */
  animate?: boolean;
  /** Acción sugerida por la IA, pendiente de confirmar. */
  proposal?: Proposal;
  /** Gráfico que acompaña el mensaje del asesor. */
  chart?: AdvisorChart;
  /** Lo que el asesor revisó antes de responder. */
  steps?: AdvisorStep[];
  /** Respuestas rápidas que propone el asesor tras este mensaje. */
  suggestions?: string[];
  /** Se envía al modelo pero no se muestra (p. ej. resultados de crear). */
  hidden?: boolean;
}

export interface ProposalHandlers {
  disabled: boolean;
  onToggle: (messageId: string, index: number) => void;
  onConfirm: (messageId: string) => void;
  onDismiss: (messageId: string) => void;
}

interface SavviIAMessageBubbleProps {
  message: ChatMessage;
  /** Se llama mientras el texto crece, para mantener el scroll abajo. */
  onGrow?: () => void;
  proposalHandlers?: ProposalHandlers;
  /** Pregunta al asesor desde un gráfico (tocar una barra, porción o tarjeta). */
  onAsk?: (question: string) => void;
}

const STATUS_META = {
  queued: { label: "En cola", icon: Clock3, className: "bg-amber-50 text-amber-700" },
  processing: { label: "Procesando", icon: Loader2, className: "bg-sky-50 text-sky-700" },
  completed: { label: "Registrada", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Falló", icon: XCircle, className: "bg-red-50 text-red-700" },
} as const;

const WORD_INTERVAL_MS = 28;

/** Revela `text` por palabras; con movimiento reducido lo muestra de una vez. */
function useTypewriter(text: string, animate: boolean, onGrow?: () => void) {
  const [enabled] = useState(
    () =>
      animate &&
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [count, setCount] = useState(() => (enabled ? 0 : Number.POSITIVE_INFINITY));
  const tokens = text.split(/(\s+)/);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      setCount((current) => {
        if (current >= tokens.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 2; // palabra + espacio
      });
    }, WORD_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, tokens.length]);

  useEffect(() => {
    if (enabled) onGrow?.();
  }, [count, enabled, onGrow]);

  const done = count >= tokens.length;
  return { visible: done ? text : tokens.slice(0, count).join(""), done };
}

export default function SavviIAMessageBubble({
  message,
  onGrow,
  proposalHandlers,
  onAsk,
}: SavviIAMessageBubbleProps) {
  const isAssistant = message.role === "assistant";
  const { visible, done } = useTypewriter(message.text, Boolean(message.animate), onGrow);
  const status = message.status ? STATUS_META[message.status] : null;

  const bubbleClass = isAssistant
    ? message.isError
      ? "rounded-tl-md border border-red-200 bg-red-50 text-red-700"
      : "rounded-tl-md border border-slate-200/80 bg-white text-slate-700"
    : "rounded-tr-md bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/20";

  return (
    <div
      className={`savvi-msg-in group flex items-end gap-2.5 ${isAssistant ? "justify-start" : "justify-end"}`}
    >
      {isAssistant && <SavviIAAvatar />}

      <div
        className={`flex max-w-[85%] flex-col md:max-w-[75%] ${isAssistant ? "items-start" : "items-end"} ${message.proposal || message.chart ? "w-full" : ""}`}
      >
        {message.steps && message.steps.length > 0 && (
          <p className="mb-1 flex max-w-full items-center gap-1.5 px-1 text-[11px] text-slate-400">
            <Search className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{message.steps.map((s) => s.label).join(" · ")}</span>
          </p>
        )}

        {(message.text || message.attachmentName || status) && (
        <article className={`rounded-2xl px-4 py-2.5 shadow-sm ${bubbleClass}`}>
          {isAssistant && !message.isError ? (
            <div className={`text-sm leading-relaxed md:text-[15px] ${done ? "" : "savvi-caret-md"}`}>
              <SavviIAMarkdown>{visible}</SavviIAMarkdown>
            </div>
          ) : (
            <p className={`whitespace-pre-line text-sm leading-relaxed md:text-[15px] ${done ? "" : "savvi-caret"}`}>
              {visible}
            </p>
          )}

          {(message.attachmentName || status) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {message.attachmentName && (
                <span
                  className={`inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    isAssistant ? "bg-slate-100 text-slate-600" : "bg-white/20 text-white"
                  }`}
                >
                  <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
                  {message.attachmentName}
                </span>
              )}
              {status && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                >
                  <status.icon
                    className={`h-3 w-3 ${message.status === "processing" ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                  {status.label}
                </span>
              )}
            </div>
          )}
        </article>
        )}

        {message.chart && done && <SavviIAChart chart={message.chart} onAsk={onAsk} />}

        {message.proposal && proposalHandlers && done && (
          <SavviIAProposalCard
            proposal={message.proposal}
            disabled={proposalHandlers.disabled}
            onToggle={(index) => proposalHandlers.onToggle(message.id, index)}
            onConfirm={() => proposalHandlers.onConfirm(message.id)}
            onDismiss={() => proposalHandlers.onDismiss(message.id)}
          />
        )}

        <span className="mt-1 px-1 text-[11px] text-slate-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {message.timestamp}
        </span>
      </div>
    </div>
  );
}
