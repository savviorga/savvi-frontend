/** Utilidades compartidas por el adjuntador, las tarjetas y el visor de archivos. */

export type FileKind = "image" | "pdf" | "audio" | "doc" | "other";

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "heic"]);
const AUDIO_EXT = new Set(["mp3", "wav", "webm", "ogg", "m4a", "mp4", "aac"]);
const DOC_EXT = new Set(["doc", "docx"]);

export function extFromName(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : "";
}

/** Por MIME si se conoce; si no (adjuntos remotos), por extensión. */
export function fileKind(name: string, mime?: string): FileKind {
  const ext = extFromName(name);
  if (mime?.startsWith("image/") || IMAGE_EXT.has(ext)) return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime?.startsWith("audio/") || AUDIO_EXT.has(ext)) return "audio";
  if (mime?.includes("wordprocessingml") || DOC_EXT.has(ext)) return "doc";
  return "other";
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** Descarga un archivo local o abre uno remoto en otra pestaña. */
export function downloadFile({ name, url, file }: { name: string; url?: string; file?: File }) {
  if (url && !url.startsWith("blob:")) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  const href = url ?? (file ? URL.createObjectURL(file) : null);
  if (!href) return;
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (!url) URL.revokeObjectURL(href);
}
