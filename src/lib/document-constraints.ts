/**
 * Límites de adjuntos según el contrato del backend (FRONT.md §5.3).
 * Se validan en cliente antes de pedir la URL prefirmada para evitar viajes perdidos.
 */

/** 20 MB por archivo. */
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

/** Máximo de archivos por petición. */
export const MAX_DOCUMENTS_PER_REQUEST = 10;

/** Máximo de adjuntos que se pueden borrar en un solo PATCH. */
export const MAX_DOCUMENTS_TO_DELETE = 50;

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** Mapa MIME → extensiones para `react-dropzone`. */
export const DOCUMENT_ACCEPT: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/webm": [".webm"],
  "audio/ogg": [".ogg"],
  "audio/mp4": [".m4a"],
};

/**
 * Quita los parámetros del MIME (`audio/webm;codecs=opus` → `audio/webm`):
 * MediaRecorder los agrega y el backend compara el tipo base.
 */
export function normalizeMimeType(type: string | null | undefined): string {
  return (type ?? "").split(";")[0].trim().toLowerCase();
}

const EXTENSION_TYPES: Record<string, string> = Object.fromEntries(
  Object.entries(DOCUMENT_ACCEPT).flatMap(([type, extensions]) => extensions.map((ext) => [ext, type])),
);

/** Tipo base del archivo; si el navegador no lo dio (pasa en Android), se deduce de la extensión. */
export function fileMimeType(file: File): string {
  const type = normalizeMimeType(file.type);
  if (type) return type;
  const extension = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  return EXTENSION_TYPES[extension] ?? "";
}

/** `null` si el archivo es válido; si no, el mensaje para el usuario. */
export function validateDocumentFile(file: File): string | null {
  if (file.size > MAX_DOCUMENT_SIZE) {
    return `${file.name} excede el tamaño máximo de ${MAX_DOCUMENT_SIZE / 1024 / 1024} MB`;
  }
  const type = fileMimeType(file);
  if (!ALLOWED_DOCUMENT_TYPES.includes(type)) {
    return `${file.name}: tipo de archivo no permitido (${type || "desconocido"})`;
  }
  return null;
}
