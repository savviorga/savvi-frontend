"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

function extFromName(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function FileTypeGlyph({ ext }: { ext: string }) {
  const e = ext.toLowerCase();
  if (e === "pdf") {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/pdf.png"
          alt=""
          className="h-12 w-12 object-contain"
        />
      </div>
    );
  }
  if (IMAGE_EXT.has(e)) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
        <PhotoIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
      </div>
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
      <DocumentIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
    </div>
  );
}

export interface FileProps {
  name: string;
  /** Tamaño en bytes */
  size: number;
  /** Documento ya subido (URL pública o firmada) */
  url?: string;
  /** Archivo local (p. ej. antes de subir) */
  file?: File;
  /** MIME; en objetos remotos puede faltar */
  type?: string;
  onRemove?: () => void;
  showDownload?: boolean;
  className?: string;
}

function useLocalImagePreview(file: File | undefined) {
  const objectUrl = useMemo(() => {
    if (!file || !file.type.startsWith("image/")) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  return objectUrl;
}

export default function FileRow({
  name,
  size,
  url,
  file,
  type,
  onRemove,
  showDownload = true,
  className,
}: FileProps) {
  const ext = extFromName(name);
  const sizeLabel = formatFileSize(size);

  const mime = type ?? file?.type;
  const isRemote = typeof url === "string" && url.length > 0;

  const isImage =
    Boolean(mime?.startsWith("image/")) || IMAGE_EXT.has(ext);

  const localPreview = useLocalImagePreview(
    file && !isRemote ? file : undefined
  );

  const [thumbFailed, setThumbFailed] = useState(false);
  useEffect(() => {
    setThumbFailed(false);
  }, [url, name, localPreview]);

  const hasImageSrc = Boolean(isRemote ? url : localPreview);
  const showLiveThumb = isImage && hasImageSrc && !thumbFailed;
  const thumbSrc = isRemote ? url! : localPreview ?? "";

  const download = () => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    const source = file;
    if (!source) return;
    const blobUrl = URL.createObjectURL(source);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-border bg-white p-4 shadow-sm transition hover:shadow-md",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {showLiveThumb ? (
          // Blob / URLs externas: next/image no aplica bien sin dominios configurados
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <FileTypeGlyph ext={ext} />
        )}

        <div className="min-w-0 flex-1">
          <p className="max-w-[300px] truncate font-medium text-foreground">
            {name}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{sizeLabel}</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {ext.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {showDownload && (
          <button
            type="button"
            onClick={download}
            className="cursor-pointer rounded-lg p-2 text-slate-600 transition hover:bg-[#F3F4F6] hover:text-[#0B1829] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C49A]/40"
            title="Descargar documento"
          >
            <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />
          </button>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="cursor-pointer rounded-lg p-2 transition hover:bg-red-100"
            title="Eliminar documento"
          >
            <XMarkIcon className="h-5 w-5 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
}
