/**
 * Llamadas al backend Nest **desde el servidor de Next** (route handlers), con el
 * token del usuario que hizo la petición. Solo lectura: Savvi IA nunca escribe
 * desde aquí; las escrituras las hace el navegador cuando el usuario confirma.
 *
 * `API_URL_INTERNAL` permite usar una URL distinta a la del navegador (p. ej. en
 * Docker, donde `NEXT_PUBLIC_API_URL` apunta a un host que el servidor no ve).
 */

import { OpenAIError } from "@/lib/openai";
import { getPublicApiUrl } from "@/lib/public-api-url";

function backendBaseUrl(): string {
  const internal = process.env.API_URL_INTERNAL?.trim().replace(/\/+$/, "");
  const url = internal || getPublicApiUrl();
  if (!url) {
    throw new OpenAIError("Falta API_URL_INTERNAL o NEXT_PUBLIC_API_URL en el servidor.", 500);
  }
  return url;
}

export async function backendGet<T>(path: string, authorization: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${backendBaseUrl()}${path}`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
  } catch {
    throw new OpenAIError(
      "Savvi IA no pudo conectarse con el backend. Si usas Docker, define API_URL_INTERNAL.",
      502,
    );
  }

  if (res.status === 401) {
    throw new OpenAIError("Tu sesión expiró. Vuelve a iniciar sesión.", 401);
  }
  if (!res.ok) {
    throw new OpenAIError(`El backend respondió ${res.status} en ${path}.`, 502);
  }
  return res.json() as Promise<T>;
}

/** Lee el header de sesión o corta con 401. */
export function requireAuthorization(request: Request): string {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new OpenAIError("Inicia sesión para hablar con Savvi IA.", 401);
  }
  return authorization;
}
