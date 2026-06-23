"use client";

import { useState } from "react";
import { BotMessageSquare, RotateCcw, Timer, WandSparkles, Zap } from "lucide-react";
import SavviIAComposer from "./SavviIAComposer";
import SavviIAConversation from "./SavviIAConversation";
import { ChatMessage } from "./SavviIAMessageBubble";
import { AiRegisterJobResponse, AiRegisterService } from "../services/ai-register.service";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    text: "Hola, soy Savvi IA. Estoy lista para ayudarte con tus finanzas.",
    timestamp: "10:12",
  },
  {
    id: "m2",
    role: "user",
    text: "Quiero organizar mis gastos por categorías este mes.",
    timestamp: "10:13",
  },
  {
    id: "m3",
    role: "assistant",
    text: "Puedo registrar transacciones desde una imagen o audio. Adjunta un archivo y te aviso cuando quede creada.",
    timestamp: "10:13",
  },
];

const SUGGESTED_PROMPTS = [
  "Analiza mis gastos fijos",
  "Ayúdame con un presupuesto",
  "Detecta oportunidades de ahorro",
  "Explícame mi flujo de caja",
];

const QUICK_ACTIONS = [
  "Resume mis gastos del mes",
  "Dame 3 ideas para ahorrar",
  "Crear plan de presupuesto semanal",
];

export default function SavviIAChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessingJob, setIsProcessingJob] = useState(false);

  const getCurrentTime = () =>
    new Date().toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const handleSendMessage = (text: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      timestamp: getCurrentTime(),
    };

    setMessages((previous) => [...previous, userMessage]);
  };

  const appendAssistantMessage = (text: string, extras?: Partial<ChatMessage>) => {
    setMessages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text,
        timestamp: getCurrentTime(),
        ...extras,
      },
    ]);
  };

  const pollJobUntilDone = async (jobId: string, attachmentName: string) => {
    setIsTyping(true);
    setIsProcessingJob(true);
    try {
      let attempts = 0;
      const maxAttempts = 20;
      let job: AiRegisterJobResponse | null = null;

      while (attempts < maxAttempts) {
        job = await AiRegisterService.getJob(jobId);

        if (job.status === "completed" || job.status === "failed") {
          break;
        }
        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (!job) {
        appendAssistantMessage(
          "No fue posible consultar el estado del registro. Intenta nuevamente.",
          { status: "failed", attachmentName },
        );
        return;
      }

      if (job.status === "completed" && job.transactionId) {
        appendAssistantMessage(
          `Listo. Registré la transacción automáticamente.\nID: ${job.transactionId}`,
          { status: "completed", attachmentName },
        );
        return;
      }

      const errorText =
        job.error || "No se pudo extraer la información necesaria del archivo.";
      appendAssistantMessage(`Falló el registro automático.\n${errorText}`, {
        status: "failed",
        attachmentName,
      });
    } catch {
      appendAssistantMessage("Ocurrió un error al procesar el archivo.", {
        status: "failed",
        attachmentName,
      });
    } finally {
      setIsTyping(false);
      setIsProcessingJob(false);
    }
  };

  const handleJobCreated = (job: AiRegisterJobResponse, attachmentName: string) => {
    appendAssistantMessage(
      "Recibí tu archivo. Estoy procesándolo para registrar la transacción.",
      { status: "queued", attachmentName },
    );
    void pollJobUntilDone(job.id, attachmentName);
  };

  return (
    <section className="flex h-full min-h-[calc(100vh-160px)] w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:gap-5 md:p-6">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1">
          <BotMessageSquare className="h-4 w-4 text-emerald-600" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Savvi IA
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Asistente financiero
          </h1>
          <p className="mt-1 text-sm text-slate-500 md:text-base">
            Envía una imagen o audio para registrar una transacción de forma
            automática.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-500">Modo</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <WandSparkles className="h-4 w-4 text-emerald-500" aria-hidden />
            Asistente Proactivo
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-500">Velocidad</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <Zap className="h-4 w-4 text-amber-500" aria-hidden />
            Respuesta rápida
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-500">Disponibilidad</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <Timer className="h-4 w-4 text-cyan-500" aria-hidden />
            24/7 (demo)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => handleSendMessage(action)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 md:text-sm"
          >
            {action}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setIsTyping(false);
            setIsProcessingJob(false);
            setMessages(INITIAL_MESSAGES);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 md:text-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reiniciar chat
        </button>
      </div>

      <SavviIAConversation messages={messages} isTyping={isTyping} />
      <SavviIAComposer
        quickPrompts={SUGGESTED_PROMPTS}
        onSendMessage={handleSendMessage}
        onJobCreated={handleJobCreated}
        disabled={isProcessingJob}
      />
    </section>
  );
}
