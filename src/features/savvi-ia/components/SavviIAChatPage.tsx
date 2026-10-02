"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import SavviIAAvatar from "./SavviIAAvatar";
import SavviIAComposer from "./SavviIAComposer";
import SavviIAConversation from "./SavviIAConversation";
import SavviIAUsage from "./SavviIAUsage";
import { ChatMessage, ProposalHandlers } from "./SavviIAMessageBubble";
import { AiRegisterJobResponse, AiRegisterService } from "../services/ai-register.service";
import { AiChatService, ChatTurn } from "../services/ai-chat.service";
import type { AdvisorStep, AdvisorUsage, Proposal } from "../types/proposal.types";
import { EMPTY_USAGE, addToTotals, type UsageTotals } from "../utils/usage";
import {
  describeProposalForModel,
  describeResultsForModel,
  executeSelectedItems,
  toProposal,
} from "../utils/proposals";
import {
  clearChat,
  describeAbsence,
  loadChat,
  loadLifetimeUsage,
  saveChat,
  saveLifetimeUsage,
} from "../utils/chat-storage";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { ApiError } from "@/types/api-error.type";

const getCurrentTime = () =>
  new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/** Tras esta pausa, al volver el asesor saluda y retoma por iniciativa propia. */
const RESUME_GREETING_AFTER_MS = 30 * 60_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Pausa entre burbujas: más larga para mensajes largos, como si escribiera. */
const typingPause = (text: string) => Math.min(1800, 450 + text.length * 12);

const getErrorMessage = (error: unknown): string => {
  const message = (error as Partial<ApiError> | null)?.message;
  if (typeof message === "string" && message) return message;
  if (Array.isArray(message) && message.length) return message.join("\n");
  return "No pude responder en este momento. Intenta de nuevo.";
};

/**
 * Lo que ve el modelo: conversación + resumen de cada propuesta. Los avisos
 * del registro por archivo y los errores locales no van.
 */
const toChatHistory = (messages: ChatMessage[]): ChatTurn[] =>
  messages
    .filter((message) => !message.status && !message.isError)
    .map((message) => ({
      role: message.role,
      content: [
        message.text,
        message.chart && `[Mostraste un gráfico: ${message.chart.title}]`,
        message.proposal && describeProposalForModel(message.proposal),
      ]
        .filter(Boolean)
        .join("\n\n"),
    }));

export default function SavviIAChatPage() {
  const { user } = useAuth();
  // ProtectedRoute monta esta página solo en el cliente y con sesión: se puede leer localStorage aquí.
  const userId = user?.id ?? "anon";
  const [restored] = useState(() => loadChat(userId));
  const [messages, setMessages] = useState<ChatMessage[]>(() => restored?.messages ?? []);
  // Consumo del modelo: de esta conversación y acumulado del usuario.
  const [usage, setUsage] = useState<UsageTotals>(() => restored?.usage ?? EMPTY_USAGE);
  const [lifetimeUsage, setLifetimeUsage] = useState<UsageTotals>(() => loadLifetimeUsage(userId));
  const usageRef = useRef(usage);
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessingJob, setIsProcessingJob] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  // Copia síncrona: las acciones async encadenan varias actualizaciones.
  const messagesRef = useRef(messages);
  // Evita que una respuesta pendiente aparezca después de reiniciar el chat.
  const conversationIdRef = useRef(0);
  const startedRef = useRef(false);

  const updateMessages = (updater: (previous: ChatMessage[]) => ChatMessage[]) => {
    messagesRef.current = updater(messagesRef.current);
    setMessages(messagesRef.current);
    saveChat(userId, messagesRef.current, usageRef.current);
  };

  const appendMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    updateMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), timestamp: getCurrentTime(), ...message },
    ]);
  };

  const appendAssistantMessage = (text: string, extras?: Partial<ChatMessage>) => {
    appendMessage({ role: "assistant", text, ...extras });
  };

  /**
   * Suma lo que costó una respuesta. Al acumulado siempre (ya se cobró); a la
   * conversación solo si sigue siendo la actual.
   */
  const recordUsage = (spent: AdvisorUsage | undefined, inCurrentConversation: boolean) => {
    if (!spent || spent.calls === 0) return;
    setLifetimeUsage((previous) => {
      const next = addToTotals(previous, spent);
      saveLifetimeUsage(userId, next);
      return next;
    });
    if (!inCurrentConversation) return;
    usageRef.current = addToTotals(usageRef.current, spent);
    setUsage(usageRef.current);
    saveChat(userId, messagesRef.current, usageRef.current);
  };

  const updateProposal = (messageId: string, updater: (proposal: Proposal) => Proposal) => {
    updateMessages((previous) =>
      previous.map((message) =>
        message.id === messageId && message.proposal
          ? { ...message, proposal: updater(message.proposal) }
          : message,
      ),
    );
  };

  /**
   * Pide la siguiente respuesta del asesor con el historial actual. Con el
   * historial vacío, el asesor abre la conversación por iniciativa propia.
   */
  const requestReply = async () => {
    const conversationId = conversationIdRef.current;
    const isCurrent = () => conversationId === conversationIdRef.current;
    const steps: AdvisorStep[] = [];

    setIsReplying(true);
    setActivity(messagesRef.current.length === 0 ? "Revisando cómo van tus finanzas" : null);
    try {
      const reply = await AiChatService.send(toChatHistory(messagesRef.current), (step) => {
        if (!isCurrent()) return;
        steps.push(step);
        setActivity(step.label);
      });
      recordUsage(reply.usage, isCurrent());
      if (!isCurrent()) return;

      if (reply.proposal) {
        // Una propuesta nueva reemplaza a la que siga pendiente.
        updateMessages((previous) =>
          previous.map((message) =>
            message.proposal?.status === "pending"
              ? { ...message, proposal: { ...message.proposal, status: "dismissed" } }
              : message,
          ),
        );
      }

      // Burbujas separadas con una pausa de "escribiendo" entre ellas.
      setActivity(null);
      for (let i = 0; i < reply.messages.length; i += 1) {
        const { text, chart } = reply.messages[i];
        const isLast = i === reply.messages.length - 1;
        if (i > 0) {
          await wait(typingPause(text) + (chart ? 400 : 0));
          if (!isCurrent()) return;
        }
        appendAssistantMessage(text, {
          animate: true,
          chart,
          steps: i === 0 && steps.length ? steps : undefined,
          proposal: isLast && reply.proposal ? toProposal(reply.proposal) : undefined,
          suggestions: isLast && !reply.proposal ? reply.suggestions : undefined,
        });
      }
    } catch (error) {
      recordUsage((error as { usage?: AdvisorUsage } | null)?.usage, isCurrent());
      if (!isCurrent()) return;
      appendAssistantMessage(getErrorMessage(error), { isError: true });
    } finally {
      if (isCurrent()) {
        setIsReplying(false);
        setActivity(null);
      }
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!restored) {
      void requestReply();
      return;
    }
    const away = Date.now() - restored.updatedAt;
    if (away >= RESUME_GREETING_AFTER_MS) {
      void notifyAdvisor(
        `(Mensaje automático de la app, no lo escribió el usuario) El usuario volvió a Savvi IA después de ${describeAbsence(away)}. Salúdalo en una frase y retoma con iniciativa: revisa si cambió algo en su situación desde la última conversación y propón el siguiente paso, sin repetir lo que ya le dijiste.`,
      );
    }
    // Solo al montar: el asesor saluda (o retoma) y toma la iniciativa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (text: string, options?: { reply?: boolean }) => {
    appendMessage({ role: "user", text });
    if (options?.reply === false) return;
    await requestReply();
  };

  /** Le cuenta al asesor algo que pasó en la app y deja que reaccione. */
  const notifyAdvisor = async (text: string) => {
    appendMessage({ role: "user", text, hidden: true });
    await requestReply();
  };

  const proposalHandlers: ProposalHandlers = {
    disabled: isReplying || isCreating,
    onToggle: (messageId, index) =>
      updateProposal(messageId, (proposal) => ({
        ...proposal,
        selected: proposal.selected.map((value, i) => (i === index ? !value : value)),
      })),
    onDismiss: (messageId) => {
      updateProposal(messageId, (proposal) => ({ ...proposal, status: "dismissed" }));
    },
    onConfirm: async (messageId) => {
      const proposal = messagesRef.current.find((m) => m.id === messageId)?.proposal;
      if (!proposal || proposal.status !== "pending") return;

      const conversationId = conversationIdRef.current;
      setIsCreating(true);
      updateProposal(messageId, (current) => ({
        ...current,
        status: "creating",
        results: current.items.map(() => null),
      }));

      try {
        await executeSelectedItems(proposal, (index, result) => {
          if (conversationId !== conversationIdRef.current) return;
          updateProposal(messageId, (current) => ({
            ...current,
            results: current.results?.map((r, i) => (i === index ? result : r)),
          }));
        });
      } finally {
        setIsCreating(false);
      }
      if (conversationId !== conversationIdRef.current) return;

      updateProposal(messageId, (current) => ({ ...current, status: "done" }));
      const finished = messagesRef.current.find((m) => m.id === messageId)?.proposal;
      if (finished) await notifyAdvisor(describeResultsForModel(finished));
    },
  };

  const pollJobUntilDone = async (jobId: string, attachmentName: string) => {
    const conversationId = conversationIdRef.current;
    setIsTyping(true);
    setIsProcessingJob(true);
    let completed = false;
    try {
      let attempts = 0;
      const maxAttempts = 20;
      let job: AiRegisterJobResponse | null = null;

      while (attempts < maxAttempts) {
        job = await AiRegisterService.getJob(jobId);
        if (job.status === "completed" || job.status === "failed") break;
        attempts += 1;
        await wait(2000);
      }
      if (conversationId !== conversationIdRef.current) return;

      if (!job) {
        appendAssistantMessage("No fue posible consultar el estado del registro. Intenta nuevamente.", {
          status: "failed",
          attachmentName,
        });
        return;
      }

      if (job.status === "completed" && job.transactionId) {
        appendAssistantMessage("Listo, registré la transacción de tu archivo.", {
          status: "completed",
          attachmentName,
        });
        completed = true;
        return;
      }

      const errorText = job.error || "No se pudo extraer la información necesaria del archivo.";
      appendAssistantMessage(`Falló el registro automático.\n${errorText}`, { status: "failed", attachmentName });
    } catch {
      appendAssistantMessage("Ocurrió un error al procesar el archivo.", { status: "failed", attachmentName });
    } finally {
      setIsTyping(false);
      setIsProcessingJob(false);
    }

    if (completed && conversationId === conversationIdRef.current) {
      await notifyAdvisor(
        `(Mensaje automático de la app, no lo escribió el usuario) Se registró una transacción a partir del archivo "${attachmentName}". Revisa la transacción más reciente y coméntale al usuario en una o dos frases qué significa para su mes.`,
      );
    }
  };

  const handleJobCreated = (job: AiRegisterJobResponse, attachmentName: string) => {
    appendAssistantMessage("Recibí tu archivo. Estoy procesándolo para registrar la transacción.", {
      status: "queued",
      attachmentName,
    });
    void pollJobUntilDone(job.id, attachmentName);
  };

  const resetChat = () => {
    conversationIdRef.current += 1;
    setIsTyping(false);
    setIsProcessingJob(false);
    setIsReplying(false);
    setIsCreating(false);
    setActivity(null);
    usageRef.current = EMPTY_USAGE;
    setUsage(EMPTY_USAGE);
    clearChat(userId);
    updateMessages(() => []);
    void requestReply();
  };

  const isBusy = isTyping || isReplying;
  const hasConversation = messages.some((message) => message.role === "user" && !message.hidden);
  const lastVisible = [...messages].reverse().find((message) => !message.hidden);
  const suggestions =
    lastVisible?.role === "assistant" && !isCreating ? (lastVisible.suggestions ?? []) : [];

  return (
    <section className="savvi-msg-in flex h-[calc(100dvh-7.5rem)] w-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-emerald-50/40 shadow-sm md:h-[calc(100dvh-8.5rem)]">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <SavviIAAvatar size="md" active={isBusy} />
          <div className="leading-tight">
            <h1 className="text-base font-semibold text-slate-900">Savvi IA</h1>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className={`h-1.5 w-1.5 rounded-full transition-colors ${isBusy ? "bg-amber-400" : "bg-emerald-400"}`}
                aria-hidden
              />
              {isCreating
                ? "Guardando en tu cuenta..."
                : activity
                  ? "Revisando tus datos..."
                  : isBusy
                    ? "Escribiendo..."
                    : "Tu asesor financiero"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <SavviIAUsage conversation={usage} lifetime={lifetimeUsage} />
          {hasConversation && (
            <button
              type="button"
              onClick={resetChat}
              className="savvi-msg-in group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <RotateCcw
                className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180"
                aria-hidden
              />
              <span className="hidden sm:inline">Nueva conversación</span>
            </button>
          )}
        </div>
      </header>

      <SavviIAConversation
        messages={messages}
        isTyping={isBusy}
        activity={activity}
        suggestions={suggestions}
        onSelectSuggestion={(prompt) => void handleSendMessage(prompt)}
        proposalHandlers={proposalHandlers}
        onAsk={isBusy || isCreating ? undefined : (question) => void handleSendMessage(question)}
      />

      <SavviIAComposer
        onSendMessage={(text, options) => void handleSendMessage(text, options)}
        onJobCreated={handleJobCreated}
        disabled={isProcessingJob || isReplying || isCreating}
      />
    </section>
  );
}
