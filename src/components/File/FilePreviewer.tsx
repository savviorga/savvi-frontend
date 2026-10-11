"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Music, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadFile, fileKind, formatFileSize } from "./file-kind";

export interface PreviewItem {
  name: string;
  size: number;
  /** URL remota o `blob:` local para mostrarlo */
  url?: string;
  file?: File;
  type?: string;
}

/** Distancia mínima (px) de un deslizamiento para cambiar de archivo. */
const SWIPE_PX = 60;

/**
 * Visor de adjuntos a pantalla completa: imágenes con zoom, PDF embebido,
 * reproductor de audio y descarga para lo demás. Se navega con flechas,
 * deslizando o con ← →. Funciona también dentro de otro modal.
 */
export default function FilePreviewer({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: PreviewItem[];
  /** Archivo abierto; `null` = cerrado. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const pointerStart = useRef<number | null>(null);

  const open = index !== null && Boolean(items[index]);
  const item = open ? items[index!] : null;
  const count = items.length;

  const go = (step: 1 | -1) => {
    if (index === null || count < 2) return;
    setDirection(step);
    setZoomed(false);
    onIndexChange((index + step + count) % count);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!zoomed) pointerStart.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) > SWIPE_PX) go(delta < 0 ? 1 : -1);
  };

  const kind = item ? fileKind(item.name, item.type ?? item.file?.type) : "other";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setZoomed(false);
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[130] bg-[#0B1829]/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-[131] flex flex-col focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200"
        >
          {item && (
            <>
              {/* Barra superior */}
              <header className="flex items-center gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
                <div className="min-w-0 flex-1">
                  <Dialog.Title className="truncate text-sm font-semibold">{item.name}</Dialog.Title>
                  <p className="text-xs text-white/60">
                    {count > 1 ? `${index! + 1} de ${count} · ` : ""}
                    {formatFileSize(item.size)}
                  </p>
                </div>
                {kind === "image" && (
                  <button
                    type="button"
                    onClick={() => setZoomed((z) => !z)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white active:scale-90"
                    aria-label={zoomed ? "Alejar" : "Acercar"}
                  >
                    {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => downloadFile(item)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white active:scale-90"
                  aria-label="Descargar"
                >
                  <Download className="h-5 w-5" />
                </button>
                <Dialog.Close
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:rotate-90 hover:bg-white/20 active:scale-90"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </header>

              {/* Escenario: desliza para cambiar de archivo */}
              <div
                className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-3 sm:px-16"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={() => (pointerStart.current = null)}
              >
                <div
                  key={index}
                  className={cn(
                    "flex h-full w-full items-center justify-center",
                    "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300",
                    direction === 1 ? "motion-safe:slide-in-from-right-8" : "motion-safe:slide-in-from-left-8"
                  )}
                >
                  {kind === "image" && item.url ? (
                    <div className={cn("h-full w-full", zoomed ? "overflow-auto" : "flex items-center justify-center")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.name}
                        draggable={false}
                        onClick={() => setZoomed((z) => !z)}
                        className={cn(
                          "select-none rounded-lg shadow-2xl transition-transform duration-300",
                          zoomed
                            ? "max-w-none cursor-zoom-out"
                            : "max-h-full max-w-full cursor-zoom-in object-contain"
                        )}
                      />
                    </div>
                  ) : kind === "pdf" && item.url ? (
                    <div className="flex h-full w-full max-w-4xl flex-col gap-2">
                      <iframe
                        src={item.url}
                        title={item.name}
                        className="min-h-0 w-full flex-1 rounded-xl bg-white shadow-2xl"
                      />
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mx-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        ¿No se ve? Ábrelo en otra pestaña
                      </a>
                    </div>
                  ) : kind === "audio" && item.url ? (
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
                      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-50 text-violet-500 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500">
                        <Music className="h-9 w-9" />
                      </span>
                      <p className="mt-4 truncate text-sm font-semibold text-slate-800">{item.name}</p>
                      <audio controls src={item.url} className="mt-4 w-full" />
                    </div>
                  ) : (
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={kind === "doc" ? "/icons/docx.png" : "/icons/default.png"}
                        alt=""
                        className="mx-auto h-16 w-16 object-contain"
                      />
                      <p className="mt-4 truncate text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Este tipo de archivo no tiene vista previa.
                      </p>
                      <button
                        type="button"
                        onClick={() => downloadFile(item)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0B1829] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B1829]/90 active:scale-95"
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </button>
                    </div>
                  )}
                </div>

                {count > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 active:scale-90 sm:flex"
                      aria-label="Anterior"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 active:scale-90 sm:flex"
                      aria-label="Siguiente"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Puntos de posición (en móvil se navega deslizando) */}
              {count > 1 && (
                <div className="flex justify-center gap-1.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  {items.map((it, i) => (
                    <button
                      key={`${it.name}-${i}`}
                      type="button"
                      onClick={() => {
                        setDirection(i > index! ? 1 : -1);
                        setZoomed(false);
                        onIndexChange(i);
                      }}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        i === index ? "w-6 bg-mint" : "w-2 bg-white/30 hover:bg-white/60"
                      )}
                      aria-label={`Ver ${it.name}`}
                      aria-current={i === index}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
