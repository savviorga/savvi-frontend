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
