"use client";

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  timestamp: string;
  attachmentName?: string;
  status?: "queued" | "processing" | "completed" | "failed";
}

interface SavviIAMessageBubbleProps {
  message: ChatMessage;
}

export default function SavviIAMessageBubble({
  message,
}: SavviIAMessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <article
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
          isAssistant
            ? "border border-slate-200 bg-white text-slate-700"
            : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
        }`}
      >
        <p className="whitespace-pre-line text-sm leading-relaxed md:text-[15px]">
          {message.text}
        </p>
        {message.attachmentName && (
          <p
            className={`mt-2 text-xs ${
              isAssistant ? "text-slate-500" : "text-emerald-50"
            }`}
          >
            Archivo: {message.attachmentName}
          </p>
        )}
        {message.status && (
          <p
            className={`mt-1 text-xs ${
              isAssistant ? "text-slate-500" : "text-emerald-50"
            }`}
          >
            Estado: {message.status}
          </p>
        )}
        <p
          className={`mt-2 text-right text-[11px] ${
            isAssistant ? "text-slate-400" : "text-emerald-100"
          }`}
        >
          {message.timestamp}
        </p>
      </article>
    </div>
  );
}
