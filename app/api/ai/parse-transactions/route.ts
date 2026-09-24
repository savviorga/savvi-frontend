import { OpenAIError, TEXT_MODEL, errorResponse, openAiJson } from "@/lib/openai";
import { requireSession } from "@/lib/ai-session";
import {
  buildContextBlock,
  EXTRACTION_RULES,
  readCatalog,
  sanitizeTransaction,
  TRANSACTION_SCHEMA_PROPERTIES,
  TRANSACTION_SCHEMA_REQUIRED,
  type CatalogAccount,
  type CatalogCategory,
  type ChatCompletion,
  type DetectedTransaction,
  type ModelOutput,
} from "@/lib/ai/transaction-parsing";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 4000;
/** Tope de filas: acota la respuesta del modelo y lo que se crea de una vez. */
const MAX_ROWS = 30;
/** Mensajes previos que se envían como contexto de la conversación. */
const MAX_HISTORY = 20;

/** Fila que el usuario ya tiene en la tabla, tal como la envía el navegador. */
interface DraftRow extends DetectedTransaction {
  id: string;
}

interface ParseRequestBody {
  text?: unknown;
  history?: unknown;
  current?: unknown;
  categories?: unknown;
  accounts?: unknown;
}

interface ModelRow extends ModelOutput {
  id: string | null;
}

const RESPONSE_SCHEMA = {
  name: "transacciones_detectadas",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["transactions"],
    properties: {
      transactions: {
        type: "array",
        description:
          "Lista completa y actualizada de movimientos, en el orden en que deben quedar.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", ...TRANSACTION_SCHEMA_REQUIRED],
          properties: {
            id: {
              type: ["string", "null"],
              description:
                "id de la fila que ya existía, o null si es un movimiento nuevo.",
            },
            ...TRANSACTION_SCHEMA_PROPERTIES,
          },
        },
      },
    },
  },
} as const;

function readDraftRows(value: unknown): DraftRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is DraftRow =>
        Boolean(item) && typeof (item as DraftRow).id === "string",
    )
    .slice(0, MAX_ROWS);
}

function readHistory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim() !== "")
    .map((item) => item.trim())
    .slice(-MAX_HISTORY);
}

/** Las filas actuales van como JSON para que el modelo las pueda editar por id. */
function describeCurrentRows(rows: DraftRow[]): string[] {
  if (rows.length === 0) return [];
  return [
    "MOVIMIENTOS QUE EL USUARIO YA TIENE EN LA TABLA (en orden):",
    JSON.stringify(
      rows.map((row) => ({
        id: row.id,
        type: row.type,
        amount: row.amount,
        date: row.date,
        categoryId: row.categoryId,
        accountId: row.accountId,
        description: row.description,
      })),
      null,
      1,
    ),
    "",
  ];
}

function buildPrompt(
  text: string,
  history: string[],
  current: DraftRow[],
  categories: CatalogCategory[],
  accounts: CatalogAccount[],
): string {
  const historyBlock = history.length
    ? ["MENSAJES ANTERIORES DEL USUARIO (del más viejo al más nuevo):", ...history.map((m) => `- ${m}`), ""]
    : [];

  return [
    "El usuario está armando una lista de movimientos financieros personales para registrarlos en lote.",
    "Español de Colombia. Los montos están en pesos colombianos (COP).",
    "",
    ...buildContextBlock(categories, accounts),
    "",
    ...historyBlock,
    ...describeCurrentRows(current),
    "REGLAS DE LA LISTA:",
    "A. Devuelve SIEMPRE la lista completa y actualizada, no solo los cambios.",
    `B. Cada movimiento distinto es un elemento aparte. Máximo ${MAX_ROWS} movimientos.`,
    "C. Si el mensaje nuevo agrega movimientos, añádelos al final conservando los anteriores.",
    "D. Si el mensaje nuevo corrige o completa un movimiento existente ('el segundo fue con Bancolombia', 'todos fueron ayer'), aplica el cambio sobre esa fila y devuélvela con su MISMO id.",
    "E. Si el usuario pide borrar un movimiento, omítelo de la lista.",
    "F. id: el de la fila que ya existía; null solo para movimientos nuevos.",
    "G. En las filas que no cambian, repite sus datos tal cual (incluida date) y deja dateEvidence en null.",
    "",
    "REGLAS DE CADA MOVIMIENTO:",
    ...EXTRACTION_RULES,
    "",
    "MENSAJE NUEVO DEL USUARIO:",
    text,
  ].join("\n");
}

/** Texto libre → lista de movimientos para registrar en lote. */
export async function POST(request: Request): Promise<Response> {
  try {
    await requireSession(request);

    const body = (await request.json()) as ParseRequestBody;
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      throw new OpenAIError("Escribe o graba los movimientos que quieres registrar.", 400);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new OpenAIError("El mensaje es demasiado largo.", 400);
    }

    const categories = readCatalog<CatalogCategory>(body.categories);
    const accounts = readCatalog<CatalogAccount>(body.accounts);
    const current = readDraftRows(body.current);
    const history = readHistory(body.history);

    const completion = await openAiJson<ChatCompletion>("/chat/completions", {
      model: TEXT_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente contable que extrae listas de movimientos a partir de lo que cuenta el usuario. " +
            "Nunca inventas información: si un dato no aparece, lo dejas en null.",
        },
        {
          role: "user",
          content: buildPrompt(text, history, current, categories, accounts),
        },
      ],
      response_format: { type: "json_schema", json_schema: RESPONSE_SCHEMA },
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new OpenAIError("La IA no devolvió datos utilizables.", 502);
    }

    let parsed: { transactions?: Partial<ModelRow>[] };
    try {
      parsed = JSON.parse(content) as { transactions?: Partial<ModelRow>[] };
    } catch {
      throw new OpenAIError("La IA devolvió una respuesta ilegible.", 502);
    }

    const rows = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    // La cita de la fecha puede estar en cualquier mensaje de la conversación.
    const conversation = [...history, text].join("\n");
    const currentById = new Map(current.map((row) => [row.id, row]));

    const transactions = rows.slice(0, MAX_ROWS).map((row) => {
      const previous =
        typeof row.id === "string" ? currentById.get(row.id) ?? null : null;
      return {
        id: previous?.id ?? null,
        ...sanitizeTransaction(
          row,
          conversation,
          categories,
          accounts,
          previous?.date ?? null,
        ),
      };
    });

    return Response.json({ text, transactions });
  } catch (error) {
    return errorResponse(error);
  }
}
