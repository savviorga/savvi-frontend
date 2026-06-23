import type { ApiError } from "@/types/api-error.type";
import { getPublicApiUrl } from "@/lib/public-api-url";

/** URL base del API o error de configuración si falta NEXT_PUBLIC_API_URL. */
export function requirePublicApiUrl(): string {
  const root = getPublicApiUrl();
  if (!root) {
    throw {
      message:
        "Falta NEXT_PUBLIC_API_URL. En savvi-frontend/.env define http://localhost:4040 y reinicia `npm run dev`.",
      error: "Config",
      statusCode: 500,
    } satisfies ApiError;
  }
  return root;
}

/** Ruta absoluta hacia el backend Nest. */
export function apiUrl(path: string): string {
  const root = requirePublicApiUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${root}${normalized}`;
}

/**
 * fetch al API con mensaje claro si el servidor no responde (conexión rechazada, CORS, etc.).
 */
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = apiUrl(path);
  try {
    return await fetch(url, init);
  } catch {
    const localHint =
      url.includes("localhost") || url.includes("127.0.0.1")
        ? " Verifica que savvi-backed esté en ejecución: `cd savvi-backed && npm run start:dev` (puerto 4040)."
        : "";
    throw {
      message: `No se pudo conectar con el API.${localHint}`,
      error: "Network",
      statusCode: 0,
    } satisfies ApiError;
  }
}
