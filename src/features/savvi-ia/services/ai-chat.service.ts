import { getJsonAuthHeaders } from "@/lib/api-auth";
import { parseHttpErrorResponse } from "@/lib/parse-http-error-response";
import type { AdvisorEvent, AdvisorStep } from "../types/proposal.types";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type ChatReply = Omit<Extract<AdvisorEvent, { type: "reply" }>, "type">;

/**
 * Va al route handler de Next (`/api/ai/chat`); la clave de OpenAI no sale del
 * servidor. La respuesta es NDJSON: `onStep` recibe en vivo lo que el asesor
 * va revisando y la promesa resuelve con la respuesta final.
 * Con `messages` vacío el asesor abre la conversación por su cuenta.
 */
export const AiChatService = {
  send: async (
    messages: ChatTurn[],
    onStep?: (step: AdvisorStep) => void,
    signal?: AbortSignal,
  ): Promise<ChatReply> => {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({ messages }),
      signal,
    });

    if (!res.ok || !res.body) throw await parseHttpErrorResponse(res);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const handle = (line: string): ChatReply | null => {
      if (!line.trim()) return null;
      const event = JSON.parse(line) as AdvisorEvent;
      if (event.type === "step") onStep?.(event.step);
      if (event.type === "error") {
        // `usage` viaja con el error: esas llamadas al modelo también se cobraron.
        throw { message: event.message, error: "IA", statusCode: event.statusCode, usage: event.usage };
      }
      if (event.type === "reply") {
        return {
          messages: event.messages,
          suggestions: event.suggestions,
          proposal: event.proposal,
          usage: event.usage,
        };
      }
      return null;
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const reply = handle(line);
        if (reply) return reply;
      }
      if (done) break;
    }

    const reply = handle(buffer);
    if (reply) return reply;
    throw { message: "La conversación se cortó. Intenta de nuevo.", error: "IA", statusCode: 502 };
  },
};
