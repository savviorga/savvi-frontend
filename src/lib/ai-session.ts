/**
 * Guarda de sesión para los route handlers de IA: evita que un tercero use
 * nuestra clave de OpenAI. El token lo emite el backend Nest, así que se valida
 * contra `GET /auth/me`. **Falla cerrado**: si no se puede validar, no se llama
 * al modelo. Solo servidor.
 */

import { createHash } from "crypto";
import { OpenAIError } from "@/lib/openai";
import { backendBaseUrl } from "@/lib/backend-server";

export interface AiSession {
  /** Header `Authorization` tal como llegó (para llamar al backend como el usuario). */
  authorization: string;
  userId: string;
}

/** Una sesión validada se reutiliza unos minutos para no consultar al backend en cada petición. */
const CACHE_TTL_MS = 5 * 60_000;
const MAX_CACHED_SESSIONS = 1000;
const VALIDATION_TIMEOUT_MS = 5000;

const cache = new Map<string, { session: AiSession; expiresAt: number }>();

const unavailable = () =>
  new OpenAIError("No pudimos validar tu sesión. Intenta de nuevo en un momento.", 503);

export async function requireSession(request: Request): Promise<AiSession> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ") || authorization.length < 20) {
    throw new OpenAIError("Inicia sesión para usar Savvi IA.", 401);
  }

  const key = createHash("sha256").update(authorization).digest("hex");
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.session;

  let res: Response;
  try {
    res = await fetch(`${backendBaseUrl()}/auth/me`, {
      headers: { Authorization: authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(VALIDATION_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof OpenAIError) throw error;
    console.error("[ai] No se pudo validar la sesión contra el backend:", error);
    throw unavailable();
  }

  if (res.status === 401 || res.status === 403) {
    throw new OpenAIError("Tu sesión expiró. Vuelve a iniciar sesión.", 401);
  }
  if (!res.ok) throw unavailable();

  const me = (await res.json().catch(() => null)) as { id?: unknown } | null;
  if (typeof me?.id !== "string") throw unavailable();

  const session: AiSession = { authorization, userId: me.id };
  if (cache.size >= MAX_CACHED_SESSIONS) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { session, expiresAt: Date.now() + CACHE_TTL_MS });
  return session;
}
