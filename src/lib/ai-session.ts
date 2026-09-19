/**
 * Guarda de sesión para los route handlers de IA: evita que un tercero use
 * nuestra clave de OpenAI. El token lo emite el backend Nest, así que se valida
 * contra él (no hay forma de verificar la firma desde aquí).
 */

import { getPublicApiUrl } from "@/lib/public-api-url";
import { OpenAIError } from "@/lib/openai";

export async function requireSession(request: Request): Promise<void> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new OpenAIError("Inicia sesión para usar el registro con IA.", 401);
  }

  const apiUrl = getPublicApiUrl();
  if (!apiUrl) return;

  try {
    const res = await fetch(`${apiUrl}/accounts`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      throw new OpenAIError("Tu sesión expiró. Vuelve a iniciar sesión.", 401);
    }
  } catch (error) {
    if (error instanceof OpenAIError) throw error;
    // El backend puede no ser alcanzable desde el servidor (p. ej. en Docker la
    // URL es la del navegador). No se bloquea el flujo, pero queda registrado.
    console.warn("[ai] No se pudo validar la sesión contra el backend:", error);
  }
}
