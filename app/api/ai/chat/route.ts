import { CHAT_MODEL, OpenAIError, errorResponse, openAiJson } from "@/lib/openai";
import { requireSession, type AiSession } from "@/lib/ai-session";
import { assertAiQuota, recordAiUsage } from "@/lib/ai/quota";
import { AdvisorData, loadSnapshot, type AdvisorSnapshot } from "@/lib/ai/advisor/snapshot";
import {
  analyzePendingEvidence,
  defersCreation,
  asksPermissionToRegister,
  isPaymentEvidence,
  readMessages,
  userAmountContradictsEvidence,
  toModelTurns,
  type ChatTurn,
  type ModelTurn,
} from "@/lib/ai/advisor/conversation";
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
import { checkProposal, mergeChecks, onlyExisting, withProposed, type ProposalCheck } from "@/lib/ai/advisor/proposals";
import { sanitizeChart } from "@/lib/ai/advisor/charts";
import { sanitizeBlock } from "@/lib/ai/advisor/blocks";
import { addUsage, emptyUsage, type OpenAIUsage } from "@/lib/ai/pricing";
import type {
  AdvisorEvent,
  AdvisorMessage,
  AdvisorUsage,
  ChatAttachment,
} from "@/features/savvi-ia/types/proposal.types";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 4000;
/** Rondas de herramientas antes de obligar al modelo a responder. */
const MAX_ROUNDS = 5;
/** Alcanza para proponer una tabla de 100 transacciones en una sola respuesta. */
const MAX_OUTPUT_TOKENS = 16_000;
const MAX_TOOL_RESULT_CHARS = 12_000;

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

/**
 * Nudge cuando el asesor pide permiso con evidencia de pago nueva: la tarjeta
 * de propuesta ya es la confirmación. Deja la puerta abierta a preguntar si de
 * verdad falta un dato.
 */
const PROPOSE_WITH_EVIDENCE =
  "(Instrucción de la app) El usuario ya adjuntó el soporte para registrar el movimiento. No le pidas permiso ni confirmación por texto: llama ahora a proponer_transacciones con evidencia = el id del archivo; la tarjeta es la confirmación. Solo si de verdad falta un dato que no puedes deducir, o el monto que dijo no coincide con el de la evidencia, responde con esa única pregunta.";

/** Igual, durante la configuración guiada: lo que el usuario contó se propone de una vez. */
const PROPOSE_NOW =
  "(Instrucción de la app) No le pidas permiso ni confirmación por texto: la tarjeta de propuesta es la confirmación y ahí puede desmarcar lo que no quiera. Llama ahora a las proponer_* con lo que ya te contó (puedes combinar varias en esta respuesta). Solo si de verdad falta un dato que no puedes deducir, responde con esa única pregunta.";

const TRUNCATED_ARGS = [
  "Los argumentos llegaron incompletos: la lista era demasiado larga para una sola llamada. Divídela en varias llamadas de máximo 50 ítems en esta misma respuesta; la app las une en una sola tarjeta.",
];

const ON_HOLD =
  "En pausa: otra propuesta de esta misma respuesta tiene problemas. Corrígela y vuelve a llamar TODAS las proponer_* juntas; la app las une en una sola tarjeta.";

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
    const source = (item ?? {}) as { texto?: unknown; grafico?: unknown; bloque?: unknown };
    const text = typeof source.texto === "string" ? source.texto.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
    const chart = sanitizeChart(source.grafico);
    const block = sanitizeBlock(source.bloque);
    return text || chart || block ? [{ text, chart, block }] : [];
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
  messages: ModelTurn[],
  evidence: Map<string, ChatAttachment>,
  /** Hay evidencia de pago legible recién adjuntada: se espera una propuesta. */
  expectProposal: boolean,
  snapshot: AdvisorSnapshot,
  data: AdvisorData,
  emit: (event: AdvisorEvent) => void,
  usage: AdvisorUsage,
  signal: AbortSignal,
): Promise<ReplyEvent> {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");
  const withEvidence = evidence.size > 0;
  let nudged = false;
  const conversation: ModelMessage[] = [
    { role: "system", content: ADVISOR_PROMPT },
    { role: "system", content: `SITUACIÓN ACTUAL DEL USUARIO:\n${snapshot.prompt}` },
    ...(messages.length ? messages : [{ role: "user" as const, content: kickoffInstruction(snapshot.needsSetup) }]),
  ];

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    // El usuario cerró el chat: no se siguen pagando rondas.
    if (signal.aborted) throw new OpenAIError("La conversación se canceló.", 499);
    const lastRound = round === MAX_ROUNDS - 1;
    const completion = await openAiJson<{
      model?: string;
      usage?: OpenAIUsage;
      choices?: { message?: AssistantMessage }[];
    }>("/chat/completions", {
      model: CHAT_MODEL,
      // Con evidencias nuevas se trabaja con datos exactos: menos creatividad.
      temperature: withEvidence ? 0.2 : 0.6,
      max_tokens: MAX_OUTPUT_TOKENS,
      tools: ADVISOR_TOOLS,
      tool_choice: lastRound ? "none" : "auto",
      response_format: REPLY_FORMAT,
      messages: conversation,
    }, signal);

    addUsage(usage, completion.model ?? CHAT_MODEL, completion.usage);

    const message = completion.choices?.[0]?.message;
    const calls = (message?.tool_calls ?? []).filter((c) => c.type === "function" && c.function?.name);
    if (calls.length === 0) {
      const reply = parseReply(message?.content);
      const texts = reply.messages.flatMap((m) => [m.text, m.block?.type === "options" ? (m.block.question ?? "") : ""]);
      const asksPermission = expectProposal
        ? asksPermissionToRegister(texts)
        : snapshot.setupPending && defersCreation(texts);
      if (asksPermission && !nudged && !lastRound) {
        nudged = true;
        conversation.push({ role: "assistant", content: message?.content ?? "" });
        conversation.push({ role: "system", content: expectProposal ? PROPOSE_WITH_EVIDENCE : PROPOSE_NOW });
        continue;
      }
      return reply;
    }

    conversation.push({ role: "assistant", content: message?.content ?? null, tool_calls: calls });

    const results = new Map<string, unknown>();
    const proposalCalls: { call: ToolCall; name: ProposalToolName; args: Record<string, unknown> | null }[] = [];
    for (const call of calls) {
      const name = call.function?.name ?? "";
      const args = parseArgs(call);

      if (isReadTool(name)) {
        emit({ type: "step", step: { label: describeReadStep(name, args ?? {}, snapshot.catalog) } });
        try {
          results.set(call.id, await runReadTool(name, args ?? {}, data, snapshot.catalog));
        } catch (error) {
          results.set(call.id, { error: error instanceof Error ? error.message : "No se pudo consultar." });
        }
      } else if (isProposalTool(name)) {
        proposalCalls.push({ call, name, args });
      } else {
        results.set(call.id, { error: "Herramienta no disponible en este turno." });
      }
    }

    // Todas las propuestas de la respuesta van en una sola tarjeta. Primero las
    // categorías y cuentas: lo que crean ("nueva:Nequi") lo pueden usar las demás.
    let accepted: ProposalCheck | null = null;
    const rejected: string[] = [];
    /** Lo que se descartó de cada llamada aceptada: el modelo lo ve si hay que reintentar. */
    const discarded = new Map<string, string[]>();
    if (proposalCalls.length) {
      emit({ type: "step", step: { label: "Preparando una propuesta para ti" } });
      proposalCalls.sort((a, b) => PROPOSAL_TOOL_NAMES.indexOf(a.name) - PROPOSAL_TOOL_NAMES.indexOf(b.name));
      const budgets = await data.getBudgets().catch(() => []);
      let catalog = snapshot.catalog;
      for (const { call, name, args } of proposalCalls) {
        const check = args
          ? checkProposal(name, args, catalog, budgets, userText, evidence)
          : { proposal: null, problems: TRUNCATED_ARGS };
        if (check.proposal) {
          accepted = accepted ? mergeChecks(accepted, check) : check;
          catalog = withProposed(catalog, check.proposal);
          discarded.set(call.id, check.problems);
          results.set(call.id, { ok: true, descartados: check.problems });
        } else if (onlyExisting(check)) {
          results.set(call.id, { ok: true, nota: "Ya existía; se usa la que hay." });
        } else {
          rejected.push(call.id);
          results.set(call.id, { ok: false, problemas: check.problems.length ? check.problems : ["La lista quedó vacía."] });
        }
      }
    }

    // Si una parte falló y queda ronda para corregir, no sale una tarjeta a medias.
    const retry = rejected.length > 0 && round < MAX_ROUNDS - 2;
    if (retry) {
      for (const { call } of proposalCalls) {
        if (!rejected.includes(call.id)) {
          results.set(call.id, { ok: false, problemas: [ON_HOLD, ...(discarded.get(call.id) ?? [])] });
        }
      }
    }

    for (const call of calls) {
      conversation.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(results.get(call.id)).slice(0, MAX_TOOL_RESULT_CHARS),
      });
    }

    if (accepted?.proposal && !retry) {
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
  let session: AiSession;

  // Lo que falle antes de empezar a transmitir responde con su código HTTP.
  try {
    session = await requireSession(request);
    await assertAiQuota(session);
    const body = (await request.json().catch(() => ({}))) as { messages?: unknown };
    messages = readMessages(body.messages, session.userId);
    if (messages.length > 0 && messages[messages.length - 1].role !== "user") {
      throw new OpenAIError("Escribe un mensaje para Savvi IA.", 400);
    }
    data = new AdvisorData(session.authorization);
    snapshot = await loadSnapshot(data);
  } catch (error) {
    return errorResponse(error);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: AdvisorEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // El cliente ya se desconectó.
        }
      };
      const usage = emptyUsage(CHAT_MODEL);
      try {
        const fresh = await analyzePendingEvidence(messages, session, emit, usage, request.signal);
        const { turns, evidence } = toModelTurns(messages);
        // Si el monto que dijo el usuario no cuadra con la evidencia, el asesor debe preguntar.
        const lastText = messages.at(-1)?.content ?? "";
        const expectProposal =
          fresh.length > 0 && fresh.every(isPaymentEvidence) && !userAmountContradictsEvidence(lastText, fresh);
        const reply = await runAdvisor(turns, evidence, expectProposal, snapshot, data, emit, usage, request.signal);
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
        // Las rondas que sí se hicieron cuentan para la cuota del usuario.
        await recordAiUsage(session, "chat", usage);
        try {
          controller.close();
        } catch {
          /* ya estaba cerrado */
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
