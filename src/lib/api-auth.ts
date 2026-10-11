const STORAGE_KEY = "savvi_auth";

/** Lee el access_token guardado tras login (misma clave que AuthContext). */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { access_token?: string };
    return data?.access_token ?? null;
  } catch {
    return null;
  }
}

/** Solo `Authorization: Bearer …` (p. ej. FormData sin Content-Type). */
export function getBearerAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** JSON + Bearer para POST/PATCH con body. */
export function getJsonAuthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...getBearerAuthHeaders(),
  };
}

type JwtClaims = { exp?: number; iat?: number };

/** Lee los claims del JWT sin verificar la firma (eso lo hace el backend). */
function readJwtClaims(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)) as JwtClaims;
  } catch {
    return null;
  }
}

/** `true` si el token ya pasó su `exp`. Sin `exp` legible se asume vigente y decide el backend. */
export function isTokenExpired(token: string): boolean {
  const exp = readJwtClaims(token)?.exp;
  return typeof exp === "number" && exp * 1000 <= Date.now();
}

/** Milisegundos desde que se emitió el token, o `null` si no trae `iat`. */
export function getTokenAge(token: string): number | null {
  const iat = readJwtClaims(token)?.iat;
  return typeof iat === "number" ? Date.now() - iat * 1000 : null;
}

/**
 * Mensajes con los que el backend (y los route handlers de IA) rechazan el token.
 * Los demás 401 son de negocio (p. ej. "La contraseña actual es incorrecta") y no cierran sesión.
 */
const SESSION_REJECTED_MESSAGES = new Set([
  "Unauthorized", // AuthGuard de Nest: token vencido o con firma inválida
  "Token inválido",
  "Usuario no encontrado",
  "Tu sesión expiró. Vuelve a iniciar sesión.",
]);

async function isRejectedSession(
  sentAuthorization: string | null,
  res: Response,
): Promise<boolean> {
  const token = getAccessToken();
  // Sin sesión, o la petición salió con un token que ya fue reemplazado: nada que cerrar.
  if (!token || sentAuthorization !== `Bearer ${token}`) return false;
  if (isTokenExpired(token)) return true;
  const body = (await res.json().catch(() => null)) as { message?: unknown } | null;
  return typeof body?.message === "string" && SESSION_REJECTED_MESSAGES.has(body.message);
}

/**
 * Los servicios llaman a `fetch` directamente, así que el 401 por token vencido se
 * detecta aquí, en un solo punto: si una petición con nuestro Bearer vuelve 401 porque
 * el token ya no sirve, se llama a `onRejected`. Devuelve la función que restaura `fetch`.
 */
export function watchRejectedSession(onRejected: () => void): () => void {
  const originalFetch = window.fetch;

  window.fetch = async (input, init) => {
    const res = await originalFetch.call(window, input, init);
    if (res.status === 401) {
      const sentAuthorization = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      ).get("authorization");
      void isRejectedSession(sentAuthorization, res.clone()).then((rejected) => {
        if (rejected) onRejected();
      });
    }
    return res;
  };

  return () => {
    window.fetch = originalFetch;
  };
}
