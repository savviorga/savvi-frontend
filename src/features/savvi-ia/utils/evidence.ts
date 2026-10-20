/**
 * Evidencias que el usuario adjunta en el chat de Savvi IA (recibos, facturas,
 * comprobantes). Lo comparten el navegador y el route handler.
 */

/** Tipos que el modelo puede leer: fotos/capturas y PDF. */
export const EVIDENCE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

/** Para el `accept` del selector de archivos. */
export const EVIDENCE_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf";

export const MAX_EVIDENCE_PER_MESSAGE = 5;
/** Mismo tope que el backend para cualquier adjunto. */
export const MAX_EVIDENCE_BYTES = 20 * 1024 * 1024;

export const isEvidenceType = (type: string): boolean => (EVIDENCE_TYPES as readonly string[]).includes(type);

export const isPdf = (type: string) => type === "application/pdf";

export const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
