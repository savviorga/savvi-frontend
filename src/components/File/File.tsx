"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Download, Eye, Music, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadFile, extFromName, fileKind, formatFileSize, type FileKind } from "./file-kind";

/** Fondo e ícono por tipo cuando no hay miniatura real. */
const KIND_STYLE: Record<FileKind, { bg: string; icon?: string; label: string }> = {
  image: { bg: "bg-slate-100", label: "Imagen" },
  pdf: { bg: "bg-rose-50", icon: "/icons/pdf.png", label: "PDF" },
  doc: { bg: "bg-sky-50", icon: "/icons/docx.png", label: "Word" },
  audio: { bg: "bg-violet-50", label: "Audio" },
  other: { bg: "bg-slate-100", icon: "/icons/default.png", label: "Archivo" },
};

export interface FileProps {
  name: string;
  /** Tamaño en bytes */
  size: number;
  /** Documento ya subido (URL firmada) o vista local (blob:) */
  url?: string;
  /** Archivo local (p. ej. antes de subir) */
  file?: File;
  /** MIME; en objetos remotos puede faltar */
  type?: string;
  onRemove?: () => void;
  /** Abre el archivo en el visor. */
  onOpen?: () => void;
  showDownload?: boolean;
  /** Posición en la lista: escalona la animación de entrada. */
  index?: number;
  className?: string;
}

/** Vista local de una imagen cuando no llega `url` (p. ej. usada sola, fuera de FileList). */
function useLocalPreview(file: File | undefined, enabled: boolean) {
  const objectUrl = useMemo(
    () => (enabled && file ? URL.createObjectURL(file) : null),
    [file, enabled]
  );
  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);
  return objectUrl;
}

/** Ondas fijas que identifican un audio en la tarjeta. */
const AUDIO_BARS = [0.35, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 0.65, 0.3];

/**
 * Tarjeta de un adjunto: miniatura real si es imagen, ícono por tipo si no.
 * Tocarla abre el visor; la X quita el archivo.
 */
export default function FileRow({
  name,
  size,
  url,
  file,
  type,
  onRemove,
  onOpen,
  showDownload = true,
  index = 0,
  className,
}: FileProps) {
  const kind = fileKind(name, type ?? file?.type);
  const style = KIND_STYLE[kind];
  const ext = extFromName(name).toUpperCase();
  const localPreview = useLocalPreview(file, kind === "image" && !url);
  const thumbSrc = kind === "image" ? (url ?? localPreview) : null;

  const [thumbState, setThumbState] = useState<"loading" | "ready" | "failed">("loading");
  const [lastThumb, setLastThumb] = useState(thumbSrc);
  if (lastThumb !== thumbSrc) {
    setLastThumb(thumbSrc);
    setThumbState("loading");
  }
  const showThumb = Boolean(thumbSrc) && thumbState !== "failed";

  const enter: CSSProperties = { animationDelay: `${Math.min(index, 8) * 50}ms` };

  return (
    <div
      style={enter}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:fill-mode-both motion-safe:duration-300",
        className
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint/50 disabled:cursor-default"
        aria-label={`Ver ${name}`}
      >
        <div className={cn("relative flex aspect-[4/3] items-center justify-center overflow-hidden", style.bg)}>
          {showThumb ? (
            // Blob / URLs firmadas: next/image no aplica sin dominios configurados.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbSrc!}
              alt=""
              onLoad={() => setThumbState("ready")}
              onError={() => setThumbState("failed")}
              className={cn(
                "h-full w-full object-cover transition-all duration-500 group-hover:scale-105",
                thumbState === "ready" ? "opacity-100" : "opacity-0"
              )}
            />
          ) : kind === "audio" ? (
            <div className="flex flex-col items-center gap-2 text-violet-500">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <Music className="h-5 w-5" aria-hidden />
              </span>
              <span className="flex h-5 items-center gap-[3px]" aria-hidden>
                {AUDIO_BARS.map((h, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-violet-300 transition-transform duration-300 group-hover:scale-y-125"
                    style={{ height: `${h * 100}%`, transitionDelay: `${i * 25}ms` }}
                  />
                ))}
              </span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={style.icon ?? "/icons/default.png"}
              alt=""
              className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-110"
            />
          )}

          {thumbSrc && thumbState === "loading" && (
            <span className="absolute inset-0 animate-pulse bg-slate-200/60" aria-hidden />
          )}

          <span className="absolute bottom-1.5 left-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-600 shadow-sm backdrop-blur">
            {ext || style.label}
          </span>

          {onOpen && (
            <span
              className="absolute inset-0 hidden items-center justify-center bg-[#0B1829]/0 opacity-0 transition-all duration-200 group-hover:bg-[#0B1829]/35 group-hover:opacity-100 sm:flex"
              aria-hidden
            >
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1829] shadow-md">
                <Eye className="h-3.5 w-3.5" />
                Ver
              </span>
            </span>
          )}
        </div>

        <div className="px-2.5 py-2">
          <p className="truncate text-xs font-semibold text-slate-800" title={name}>
            {name}
          </p>
          <p className="text-[11px] text-slate-500">{formatFileSize(size)}</p>
        </div>
      </button>

      {/* Acciones flotantes: siempre visibles en táctil, más marcadas al pasar el mouse. */}
      <div className="absolute right-1.5 top-1.5 flex gap-1">
        {showDownload && (
          <button
            type="button"
            onClick={() => downloadFile({ name, url, file })}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm backdrop-blur transition-all hover:scale-110 hover:text-[#0B1829] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50"
            aria-label={`Descargar ${name}`}
            title="Descargar"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm backdrop-blur transition-all hover:scale-110 hover:bg-rose-600 hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label={`Quitar ${name}`}
            title="Quitar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
