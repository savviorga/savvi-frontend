"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Camera, CheckCircle2, CloudUpload, FolderOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { extFromName } from "./file-kind";

export interface FileUploaderProps {
  /** Máximo total de archivos (contando `currentFiles`). */
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  label?: string;
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  /** Archivos ya elegidos: evita duplicados y descuenta del máximo. */
  currentFiles?: File[];
}

/** Cuánto se ve el aviso de "archivos agregados". */
const ADDED_FEEDBACK_MS = 2200;

const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size;

/** "PDF, imágenes, audio o Word", según lo que acepta el uploader. */
function describeAccept(accept?: Record<string, string[]>): string {
  if (!accept) return "Cualquier archivo";
  const mimes = Object.keys(accept);
  const kinds = [
    mimes.some((m) => m === "application/pdf") && "PDF",
    mimes.some((m) => m.startsWith("image/")) && "imágenes",
    mimes.some((m) => m.startsWith("audio/")) && "audio",
    mimes.some((m) => m.includes("wordprocessingml") || m.includes("msword")) && "Word",
  ].filter(Boolean) as string[];
  if (kinds.length <= 1) return kinds[0] ?? "Archivos";
  return `${kinds.slice(0, -1).join(", ")} o ${kinds[kinds.length - 1]}`;
}

function isAccepted(file: File, accept?: Record<string, string[]>): boolean {
  if (!accept) return true;
  const ext = `.${extFromName(file.name)}`;
  return Object.entries(accept).some(([mime, exts]) => {
    const mimeOk = mime.endsWith("/*") ? file.type.startsWith(mime.slice(0, -1)) : file.type === mime;
    return mimeOk || exts.includes(ext);
  });
}

/**
 * Adjuntador. En celular: botones grandes para tomar foto o elegir archivo.
 * En computador: zona para arrastrar. Valida en español (tamaño, tipo,
 * duplicados y cupo) antes de entregar los archivos.
 */
export default function FileUploader({
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  accept,
  label = "Arrastra tus archivos aquí",
  onFilesChange,
  disabled = false,
  className,
  currentFiles = [],
}: FileUploaderProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [added, setAdded] = useState<{ count: number; key: number } | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const maxMb = Math.round(maxSize / 1024 / 1024);
  const remaining = Math.max(0, maxFiles - currentFiles.length);
  const full = remaining === 0;
  const acceptsImages = !accept || Object.keys(accept).some((m) => m.startsWith("image/"));

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(null), ADDED_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [added]);

  /** Valida todo lo que llegue (arrastrado, elegido o de la cámara) y entrega lo válido. */
  const receive = useCallback(
    (incoming: File[], rejected: FileRejection[] = []) => {
      const problems: string[] = rejected.map(({ file, errors: errs }) =>
        errs.some((e) => e.code === "file-too-large")
          ? `${file.name} pesa más de ${maxMb} MB.`
          : `${file.name} no es un tipo permitido (${describeAccept(accept)}).`
      );

      const valid: File[] = [];
      for (const file of incoming) {
        if (file.size > maxSize) problems.push(`${file.name} pesa más de ${maxMb} MB.`);
        else if (!isAccepted(file, accept))
          problems.push(`${file.name} no es un tipo permitido (${describeAccept(accept)}).`);
        else if ([...currentFiles, ...valid].some((f) => sameFile(f, file)))
          problems.push(`${file.name} ya está adjunto.`);
        else valid.push(file);
      }

      const accepted = valid.slice(0, remaining);
      if (valid.length > accepted.length) {
        problems.push(
          `Puedes adjuntar máximo ${maxFiles} archivos; ${valid.length - accepted.length} no se agregaron.`
        );
      }

      setErrors(problems);
      if (accepted.length) {
        onFilesChange(accepted);
        setAdded({ count: accepted.length, key: Date.now() });
      }
    },
    [accept, currentFiles, maxFiles, maxMb, maxSize, onFilesChange, remaining]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (acceptedFiles, rejections) => receive(acceptedFiles, rejections),
    multiple: true,
    maxSize,
    accept,
    disabled: disabled || full,
    // El cupo se controla en `receive` para dar un mensaje propio.
    maxFiles: 0,
  });

  const onCamera = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length) receive(files);
  };

  const hint = `${describeAccept(accept)} · hasta ${maxMb} MB${
    currentFiles.length ? ` · ${currentFiles.length}/${maxFiles}` : ` · máx. ${maxFiles}`
  }`;

  const mobileButton =
    "flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-3 py-4 text-sm font-semibold transition-all active:scale-[.97] disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50";

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Celular: tomar foto o elegir archivo, sin zona de arrastre. */}
      <div className={cn("grid gap-2 sm:hidden", acceptsImages ? "grid-cols-2" : "grid-cols-1")}>
        {acceptsImages && (
          <button
            type="button"
            disabled={disabled || full}
            onClick={() => cameraRef.current?.click()}
            className={cn(mobileButton, "border-mint/40 bg-mint/10 text-[#0B1829]")}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint text-cosmos shadow-sm">
              <Camera className="h-5 w-5" aria-hidden />
            </span>
            Tomar foto
          </button>
        )}
        <button
          type="button"
          disabled={disabled || full}
          onClick={open}
          className={cn(mobileButton, "border-border bg-white text-[#0B1829]")}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <FolderOpen className="h-5 w-5" aria-hidden />
          </span>
          Elegir archivo
        </button>
      </div>

      {/* Computador: arrastrar o hacer clic. */}
      <div
        {...getRootProps()}
        className={cn(
          "group hidden cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed px-5 py-5 outline-none transition-all duration-200 sm:flex",
          "border-border bg-white hover:border-mint/50 hover:bg-mint/[0.04]",
          "focus-visible:ring-2 focus-visible:ring-mint/35 focus-visible:ring-offset-2",
          isDragActive && "scale-[1.01] border-mint bg-mint/10 shadow-lg shadow-mint/10",
          (disabled || full) && "cursor-not-allowed opacity-50 hover:border-border hover:bg-white"
        )}
      >
        <input {...getInputProps()} />
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mint/10 text-mint-dim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-mint/20",
            isDragActive && "motion-safe:animate-bounce bg-mint text-cosmos"
          )}
          aria-hidden
        >
          <CloudUpload className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0B1829]">
            {full
              ? "Llegaste al máximo de archivos"
              : isDragActive
                ? "Suelta para adjuntar"
                : label}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {!full && !isDragActive && (
              <>
                o <span className="font-semibold text-mint-dim underline-offset-2 group-hover:underline">elígelos de tu equipo</span>
                {" · "}
              </>
            )}
            {hint}
          </p>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 sm:hidden">{hint}</p>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onCamera}
      />

      <div aria-live="polite" className="space-y-1.5">
        {added && (
          <p
            key={added.key}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {added.count === 1 ? "Archivo agregado" : `${added.count} archivos agregados`}
          </p>
        )}
        {errors.map((message, i) => (
          <div
            key={`${message}-${i}`}
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1"
          >
            <span className="min-w-0 flex-1">{message}</span>
            <button
              type="button"
              onClick={() => setErrors((prev) => prev.filter((_, j) => j !== i))}
              className="shrink-0 rounded p-0.5 transition hover:bg-rose-100"
              aria-label="Cerrar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
