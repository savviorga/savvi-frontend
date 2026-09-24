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
  type ModelOutput,
} from "@/lib/ai/transaction-parsing";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 2000;

interface ParseRequestBody {
  text?: unknown;
  categories?: unknown;
  accounts?: unknown;
}

const RESPONSE_SCHEMA = {
  name: "transaccion_detectada",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [...TRANSACTION_SCHEMA_REQUIRED],
    properties: TRANSACTION_SCHEMA_PROPERTIES,
  },
} as const;

function buildPrompt(
  text: string,
  categories: CatalogCategory[],
  accounts: CatalogAccount[],
): string {
  return [
    "Extrae los datos de un movimiento financiero personal a partir de lo que dijo el usuario.",
    "Español de Colombia. Los montos están en pesos colombianos (COP).",
    "",
    ...buildContextBlock(categories, accounts),
    "",
    "REGLAS:",
    ...EXTRACTION_RULES,
    "",
    "TEXTO DEL USUARIO:",
    text,
  ].join("\n");
}

/** Texto libre → campos del formulario de transacción. */
export async function POST(request: Request): Promise<Response> {
  try {
    await requireSession(request);

    const body = (await request.json()) as ParseRequestBody;
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      throw new OpenAIError("Escribe o graba una descripción del movimiento.", 400);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new OpenAIError("La descripción es demasiado larga.", 400);
    }

    const categories = readCatalog<CatalogCategory>(body.categories);
    const accounts = readCatalog<CatalogAccount>(body.accounts);

    const completion = await openAiJson<ChatCompletion>("/chat/completions", {
      model: TEXT_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente contable que extrae datos estructurados de descripciones habladas. " +
            "Nunca inventas información: si un dato no aparece, lo dejas en null.",
        },
        { role: "user", content: buildPrompt(text, categories, accounts) },
      ],
      response_format: { type: "json_schema", json_schema: RESPONSE_SCHEMA },
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new OpenAIError("La IA no devolvió datos utilizables.", 502);
    }

    let parsed: Partial<ModelOutput>;
    try {
      parsed = JSON.parse(content) as Partial<ModelOutput>;
    } catch {
      throw new OpenAIError("La IA devolvió una respuesta ilegible.", 502);
    }

    return Response.json({
      text,
      detected: sanitizeTransaction(parsed, text, categories, accounts),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
