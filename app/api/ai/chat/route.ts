import { CHAT_MODEL, OpenAIError, errorResponse, openAiJson } from "@/lib/openai";
import { requireAuthorization } from "@/lib/backend-server";
import { AdvisorData, loadSnapshot, type AdvisorSnapshot } from "@/lib/ai/advisor/snapshot";
import { ADVISOR_PROMPT, kickoffInstruction } from "@/lib/ai/advisor/prompt";
import {
  ADVISOR_TOOLS,
  PROPOSAL_TOOL_NAMES,
  READ_TOOL_NAMES,
  REPLY_FORMAT,
  type ProposalToolName,
  type ReadToolName,
} from "@/lib/ai/advisor/tools";
import { describeReadStep, runReadTool } from "@/lib/ai/advisor/read-tools";
import { checkProposal, mergeChecks, type ProposalCheck } from "@/lib/ai/advisor/proposals";
import { sanitizeChart } from "@/lib/ai/advisor/charts";
import { addUsage, emptyUsage, type OpenAIUsage } from "@/lib/ai/pricing";
import type { AdvisorEvent, AdvisorMessage, AdvisorUsage } from "@/features/savvi-ia/types/proposal.types";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 4000;
/** Mensajes del asesor en el historial: incluyen el resumen de propuestas de hasta 100 ítems. */
const MAX_ASSISTANT_HISTORY_LENGTH = 15_000;
/** ~10 páginas de texto pegado por el usuario. */
const MAX_USER_MESSAGE_LENGTH = 30_000;
/** Solo se envían los últimos mensajes: acota el costo por petición. */
const MAX_HISTORY = 30;
/** Rondas de herramientas antes de obligar al modelo a responder. */
const MAX_ROUNDS = 5;
/** Alcanza para proponer una tabla de 100 transacciones en una sola respuesta. */
const MAX_OUTPUT_TOKENS = 16_000;
const MAX_TOOL_RESULT_CHARS = 12_000;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface ToolCall {
  id: string;
  type?: string;
  function?: { name?: string; arguments?: string };
}

interface AssistantMessage {
  content?: string | null;
  tool_calls?: ToolCall[];
}

type ModelMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "assistant"; content: string | null; tool_calls: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

/** Respuesta final sin el consumo: se agrega al emitirla. */
type ReplyEvent = Omit<Extract<AdvisorEvent, { type: "reply" }>, "usage">;

function readMessages(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is ChatTurn =>
        typeof item === "object" &&
        item !== null &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map(({ role, content }) => ({
      role,
      content: content.trim().slice(0, role === "user" ? MAX_USER_MESSAGE_LENGTH : MAX_ASSISTANT_HISTORY_LENGTH),
    }));
}

const isReadTool = (name: string): name is ReadToolName => (READ_TOOL_NAMES as readonly string[]).includes(name);
const isProposalTool = (name: string): name is ProposalToolName =>
  (PROPOSAL_TOOL_NAMES as readonly string[]).includes(name);

/** null si los argumentos no son JSON válido (p. ej. la respuesta se cortó). */
function parseArgs(call: ToolCall): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(call.function?.arguments || "{}");
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return null;
  }
}

const TRUNCATED_ARGS = [
  "Los argumentos llegaron incompletos: la lista era demasiado larga para una sola llamada. Divídela en varias llamadas de máximo 50 ítems en esta misma respuesta; la app las une en una sola tarjeta.",
];

const cleanList = (value: unknown, maxItems: number, maxLength: number): string[] =>
  Array.isArray(value)
    ? value
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .slice(0, maxItems)
        .map((v) => v.trim().slice(0, maxLength))
    : [];

function readAdvisorMessages(raw: unknown): AdvisorMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 3).flatMap((item): AdvisorMessage[] => {
    // Tolera que el modelo mande el mensaje como texto suelto.
    if (typeof item === "string") return item.trim() ? [{ text: item.trim().slice(0, MAX_MESSAGE_LENGTH) }] : [];
    const source = (item ?? {}) as { texto?: unknown; grafico?: unknown };
    const text = typeof source.texto === "string" ? source.texto.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
    const chart = sanitizeChart(source.grafico);
    return text || chart ? [{ text, chart }] : [];
  });
}

/** La respuesta final llega como JSON (`REPLY_FORMAT`); si no, se usa el texto tal cual. */
function parseReply(content: string | null | undefined): ReplyEvent {
  const raw = content?.trim();
  if (!raw) throw new OpenAIError("La IA no devolvió una respuesta.", 502);
  try {
    const parsed = JSON.parse(raw) as { mensajes?: unknown; sugerencias?: unknown };
    const messages = readAdvisorMessages(parsed.mensajes);
    if (messages.length) {
      return { type: "reply", messages, suggestions: cleanList(parsed.sugerencias, 3, 60) };
    }
  } catch {
    /* no era JSON */
  }
  return { type: "reply", messages: [{ text: raw }], suggestions: [] };
}

/**
 * Ciclo del asesor: el modelo consulta lo que necesite (`consultar_*`, ejecutadas
 * aquí con el token del usuario) hasta responder o proponer una acción
 * (`proponer_*`), que termina el turno con una tarjeta para confirmar.
 */
async function runAdvisor(
  messages: ChatTurn[],
  snapshot: AdvisorSnapshot,
  data: AdvisorData,
  emit: (event: AdvisorEvent) => void,
  usage: AdvisorUsage,
): Promise<ReplyEvent> {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");
  const conversation: ModelMessage[] = [
    { role: "system", content: ADVISOR_PROMPT },
    { role: "system", content: `SITUACIÓN ACTUAL DEL USUARIO:\n${snapshot.prompt}` },
    ...(messages.length ? messages : [{ role: "user" as const, content: kickoffInstruction(snapshot.needsSetup) }]),
  ];

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const lastRound = round === MAX_ROUNDS - 1;
    const completion = await openAiJson<{
      model?: string;
      usage?: OpenAIUsage;
      choices?: { message?: AssistantMessage }[];
    }>("/chat/completions", {
      model: CHAT_MODEL,
      temperature: 0.6,
      max_tokens: MAX_OUTPUT_TOKENS,
      tools: ADVISOR_TOOLS,
      tool_choice: lastRound ? "none" : "auto",
      response_format: REPLY_FORMAT,
      messages: conversation,
    });

    addUsage(usage, completion.model ?? CHAT_MODEL, completion.usage);

    const message = completion.choices?.[0]?.message;
    const calls = (message?.tool_calls ?? []).filter((c) => c.type === "function" && c.function?.name);
    if (calls.length === 0) return parseReply(message?.content);

    conversation.push({ role: "assistant", content: message?.content ?? null, tool_calls: calls });

    let accepted: ProposalCheck | null = null;
    for (const call of calls) {
      const name = call.function?.name ?? "";
      const args = parseArgs(call);
      let result: unknown;

      if (isReadTool(name)) {
        emit({ type: "step", step: { label: describeReadStep(name, args ?? {}, snapshot.catalog) } });
        try {
          result = await runReadTool(name, args ?? {}, data, snapshot.catalog);
        } catch (error) {
          result = { error: error instanceof Error ? error.message : "No se pudo consultar." };
        }
      } else if (isProposalTool(name)) {
        emit({ type: "step", step: { label: "Preparando una propuesta para ti" } });
        const check = args
          ? checkProposal(name, args, snapshot.catalog, await data.getBudgets().catch(() => []), userText)
          : { proposal: null, problems: TRUNCATED_ARGS };
        // Varias llamadas del mismo tipo en una respuesta se unen en una sola tarjeta.
        const merged: ProposalCheck | null = check.proposal && accepted ? mergeChecks(accepted, check) : check.proposal ? check : null;
        if (merged) accepted = merged;
        result = !check.proposal
          ? { ok: false, problemas: check.problems.length ? check.problems : ["La lista quedó vacía."] }
          : merged
            ? { ok: true, descartados: check.problems }
            : { ok: false, problemas: ["Propón un solo tipo de acción por respuesta."] };
      } else {
        result = { error: "Herramienta no disponible en este turno." };
      }

      conversation.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result).slice(0, MAX_TOOL_RESULT_CHARS),
      });
    }

    if (accepted?.proposal) {
      return {
        type: "reply",
        messages: [{ text: accepted.message ?? "Te preparé una propuesta. Revísala y confirma lo que quieras." }],
        suggestions: [],
        proposal: accepted.proposal,
      };
    }
  }

  throw new OpenAIError("Savvi IA no logró terminar la respuesta. Intenta de nuevo.", 502);
}

/**
 * Historial → siguiente respuesta del asesor, como NDJSON: eventos `step`
 * mientras consulta datos y un `reply` final (o `error`). Sin mensajes, el
 * asesor abre la conversación por iniciativa propia.
 */
export async function POST(request: Request): Promise<Response> {
  let messages: ChatTurn[];
  let snapshot: AdvisorSnapshot;
  let data: AdvisorData;

  // Lo que falle antes de empezar a transmitir responde con su código HTTP.
  try {
    const authorization = requireAuthorization(request);
    const body = (await request.json().catch(() => ({}))) as { messages?: unknown };
    messages = readMessages(body.messages);
    if (messages.length > 0 && messages[messages.length - 1].role !== "user") {
      throw new OpenAIError("Escribe un mensaje para Savvi IA.", 400);
    }
    data = new AdvisorData(authorization);
    snapshot = await loadSnapshot(data);
  } catch (error) {
    return errorResponse(error);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: AdvisorEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const usage = emptyUsage(CHAT_MODEL);
      try {
        const reply = await runAdvisor(messages, snapshot, data, emit, usage);
        emit({ ...reply, usage });
      } catch (error) {
        console.error("[ai] Savvi IA:", error);
        emit({
          type: "error",
          message: error instanceof OpenAIError ? error.message : "No pude responder en este momento. Intenta de nuevo.",
          statusCode: error instanceof OpenAIError ? error.status : 500,
          // Las rondas que sí se hicieron también se cobran.
          usage: usage.calls > 0 ? usage : undefined,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
