import type { ApiError } from "@/types/api-error.type";

/**
 * Convierte respuestas fallidas en {@link ApiError}, incluso si el cuerpo no es JSON
 * (p. ej. HTML de nginx "413 Request Entity Too Large").
 */
export async function parseHttpErrorResponse(res: Response): Promise<ApiError> {
  const text = await res.text();
  try {
    const parsed = JSON.parse(text) as Partial<ApiError>;
    if (parsed && (parsed.message !== undefined || parsed.statusCode !== undefined)) {
      return {
        message: parsed.message ?? "Error",
        error: parsed.error ?? "Error",
        statusCode: parsed.statusCode ?? res.status,
      };
    }
  } catch {
    /* no es JSON */
  }

  let message = text.replace(/\s+/g, " ").trim().slice(0, 280);
  if (!message) {
    message = `Error HTTP ${res.status}`;
  }

  if (res.status === 413) {
    message =
      "Archivo demasiado grande para el servidor del API (suele ser nginx/proxy, no Nest). Sube client_max_body_size o usa un hosting con más límite de cuerpo.";
  }

  return {
    message,
    error: "HTTP Error",
    statusCode: res.status,
  };
}
