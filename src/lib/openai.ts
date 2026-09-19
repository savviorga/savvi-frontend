/**
 * Acceso a la API de OpenAI. **Solo servidor**: `IA_APIKEY` no lleva prefijo
 * NEXT_PUBLIC_, así que nunca se expone al navegador. Este módulo únicamente
 * puede importarse desde route handlers (`app/api/**`).
 */

const OPENAI_BASE_URL = "https://api.openai.com/v1";

/** Modelo de transcripción; `whisper-1` es el disponible en toda cuenta. */
export const AUDIO_MODEL = process.env.IA_MODEL_AUDIO?.trim() || "gpt-4o-mini-transcribe";
export const AUDIO_MODEL_FALLBACK = "whisper-1";

/** Modelo de extracción de datos (soporta salidas estructuradas). */
export const TEXT_MODEL = process.env.IA_MODEL_TEXTO?.trim() || "gpt-4o-mini";

export class OpenAIError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "OpenAIError";
  }
}

export function getApiKey(): string {
  const key = process.env.IA_APIKEY?.trim();
  if (!key) {
    throw new OpenAIError(
      "Falta IA_APIKEY en el entorno del servidor. Defínela en .env y reinicia la app.",
      500,
    );
  }
  return key;
}

/** Extrae el mensaje de error de OpenAI sin filtrar detalles internos al cliente. */
async function toOpenAIError(res: Response): Promise<OpenAIError> {
  const raw = await res.text();
  let detail = raw.slice(0, 300);
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed.error?.message) detail = parsed.error.message;
  } catch {
    /* la respuesta no era JSON */
  }

  if (res.status === 401) {
    return new OpenAIError("La IA_APIKEY no es válida o fue revocada.", 502);
  }
  if (res.status === 429) {
    return new OpenAIError(
      "La cuenta de OpenAI alcanzó su límite de uso. Intenta más tarde.",
      429,
    );
  }
  return new OpenAIError(`OpenAI respondió ${res.status}: ${detail}`, 502);
}

export async function openAiJson<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${OPENAI_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw await toOpenAIError(res);
  return res.json() as Promise<T>;
}

export async function openAiForm<T>(
  path: string,
  form: FormData,
): Promise<T> {
  const res = await fetch(`${OPENAI_BASE_URL}${path}`, {
    method: "POST",
    // Sin Content-Type: fetch pone el boundary del multipart.
    headers: { Authorization: `Bearer ${getApiKey()}` },
    body: form,
  });

  if (!res.ok) throw await toOpenAIError(res);
  return res.json() as Promise<T>;
}

/** Convierte cualquier error en una respuesta JSON con el formato del resto del API. */
export function errorResponse(error: unknown): Response {
  if (error instanceof OpenAIError) {
    console.error("[ai]", error.message);
    return Response.json(
      { message: error.message, error: "IA", statusCode: error.status },
      { status: error.status },
    );
  }

  console.error("[ai] Error inesperado:", error);
  return Response.json(
    {
      message: "No se pudo procesar la petición con la IA.",
      error: "IA",
      statusCode: 500,
    },
    { status: 500 },
  );
}
