import { getErrorMessages, isApiError } from "@/types/api-error.type";

/** Mensajes del backend con los que el reto 2FA ya no sirve y hay que volver al login. */
const TWO_FACTOR_RESTART_RE =
  /inicio de sesión expiró|vuelve a iniciar sesión|demasiados intentos|límite de reenv/i;

export function isTwoFactorRestartError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  if (error.statusCode === 401) return true;
  return (
    error.statusCode === 400 &&
    getErrorMessages(error).some((msg) => TWO_FACTOR_RESTART_RE.test(msg))
  );
}
