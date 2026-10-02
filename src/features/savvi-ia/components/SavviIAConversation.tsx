"use client";

import { useCallback, useEffect, useRef } from "react";
import SavviIAAvatar from "./SavviIAAvatar";
import SavviIAMessageBubble, { ChatMessage, ProposalHandlers } from "./SavviIAMessageBubble";
import SavviIAPromptChips from "./SavviIAPromptChips";

interface SavviIAConversationProps {
  messages: ChatMessage[];
  isTyping?: boolean;
  /** Lo que el asesor está revisando ahora mismo (se muestra en el indicador). */
  activity?: string | null;
  /** Respuestas rápidas bajo el último mensaje del asesor. */
  suggestions?: string[];
  onSelectSuggestion?: (prompt: string) => void;
  proposalHandlers?: ProposalHandlers;
  /** Preguntas que salen de tocar un gráfico; sin ella los gráficos no son clicables. */
  onAsk?: (question: string) => void;
}

export default function SavviIAConversation({
  messages,
  isTyping = false,
  activity = null,
  suggestions = [],
  onSelectSuggestion,
  proposalHandlers,
  onAsk,
}: SavviIAConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = scrollRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, isTyping, activity, scrollToBottom]);

  return (
    <div
      ref={scrollRef}
      className="scrollbar-none min-h-0 flex-1 overflow-y-auto scroll-smooth"
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 md:px-6">
        {messages
          .filter((message) => !message.hidden)
          .map((message) => (
            <SavviIAMessageBubble
              key={message.id}
              message={message}
              onGrow={scrollToBottom}
              proposalHandlers={proposalHandlers}
              onAsk={onAsk}
            />
          ))}

        {!isTyping && suggestions.length > 0 && onSelectSuggestion && (
          <div className="pl-10">
            <SavviIAPromptChips prompts={suggestions} onSelectPrompt={onSelectSuggestion} />
          </div>
        )}

        {isTyping && (
          <div className="savvi-msg-in flex items-end gap-2.5">
            <SavviIAAvatar active />
            <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
              <span className="sr-only">Savvi IA está escribiendo</span>
              <span className="flex items-center gap-1.5">
                {[0, 0.15, 0.3].map((delay) => (
                  <span
                    key={delay}
                    className="savvi-typing-dot h-2 w-2 rounded-full bg-emerald-400"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </span>
              {activity && (
                <span key={activity} className="savvi-msg-in text-xs text-slate-500">
                  {activity}…
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
