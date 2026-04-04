/**
 * Base URL del backend (Nest). `NEXT_PUBLIC_*` se inyecta en build: en Vercel hay que
 * definirla en Environment Variables y volver a desplegar.
 *
 * Si el front está en https:// (p. ej. Vercel) y esta URL es http:// expuesto a Internet,
 * el navegador bloquea las peticiones (mixed content) y las subidas fallan.
 */
export function getPublicApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");
}
