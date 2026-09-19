import {
  AUDIO_MODEL,
  AUDIO_MODEL_FALLBACK,
  OpenAIError,
  errorResponse,
  openAiForm,
} from "@/lib/openai";
import { requireSession } from "@/lib/ai-session";

export const runtime = "nodejs";

/** Tope propio: el audio del formulario dura ~1 min; OpenAI admite hasta 25 MB. */
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

interface TranscriptionResponse {
  text?: string;
}

async function transcribe(
  file: File,
  model: string,
): Promise<TranscriptionResponse> {
  const form = new FormData();
  form.append("file", file, file.name || "audio.webm");
  form.append("model", model);
  form.append("language", "es");
  form.append("response_format", "json");
  form.append(
    "prompt",
    "Transcripción de un gasto o ingreso personal en español de Colombia. " +
      "Pueden aparecer montos en pesos, nombres de bancos y categorías.",
  );

  return openAiForm<TranscriptionResponse>("/audio/transcriptions", form);
}

/** Audio → texto. Recibe multipart con el campo `file`. */
export async function POST(request: Request): Promise<Response> {
  try {
    await requireSession(request);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new OpenAIError("No se recibió el audio a transcribir.", 400);
    }
    if (file.size > MAX_AUDIO_BYTES) {
      throw new OpenAIError(
        "El audio es demasiado largo. Graba un mensaje más corto.",
        400,
      );
    }

    let data: TranscriptionResponse;
    try {
      data = await transcribe(file, AUDIO_MODEL);
    } catch (error) {
      // Si la cuenta no tiene acceso al modelo configurado, se usa whisper-1.
      const modelUnavailable =
        error instanceof OpenAIError &&
        error.status === 502 &&
        /model/i.test(error.message) &&
        AUDIO_MODEL !== AUDIO_MODEL_FALLBACK;

      if (!modelUnavailable) throw error;
      console.warn(`[ai] ${AUDIO_MODEL} no disponible, usando ${AUDIO_MODEL_FALLBACK}`);
      data = await transcribe(file, AUDIO_MODEL_FALLBACK);
    }

    const text = data.text?.trim() ?? "";
    if (!text) {
      throw new OpenAIError(
        "No se entendió el audio. Intenta grabar de nuevo hablando más cerca del micrófono.",
        422,
      );
    }

    return Response.json({ text });
  } catch (error) {
    return errorResponse(error);
  }
}
