export const DEFAULT_REDIRECT = "/transactions";

/** Origen ficticio para resolver rutas relativas sin depender de `window`. */
const BASE = "https://savvi.invalid";

/**
 * Ruta interna segura para redirigir tras el login o el registro. Rechaza
 * URLs absolutas, protocolo-relativas (`//evil.com`), barras invertidas
 * (`/\evil.com`, que los navegadores tratan como `//`) y caracteres de control.
 */
export function safeRedirectUrl(callbackUrl: string | null | undefined): string {
  if (!callbackUrl || typeof callbackUrl !== "string") return DEFAULT_REDIRECT;
  const raw = callbackUrl.trim();
  if (!raw.startsWith("/") || raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) {
    return DEFAULT_REDIRECT;
  }
  try {
    const url = new URL(raw, BASE);
    if (url.origin !== BASE) return DEFAULT_REDIRECT;
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith("//") ? DEFAULT_REDIRECT : path;
  } catch {
    return DEFAULT_REDIRECT;
  }
}
