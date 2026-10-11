"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import FileRow from "./File";
import FilePreviewer, { type PreviewItem } from "./FilePreviewer";

export type FileListItem =
  | File
  | {
      name: string;
      url: string;
      size: number;
      type?: string;
      file?: File;
    };

interface FileListProps {
  files: FileListItem[];
  onRemove?: (i: number) => void;
  showDownload?: boolean;
  className?: string;
}

/**
 * Adjuntos en cuadrícula de tarjetas con miniatura. Tocar uno lo abre en el
 * visor a pantalla completa, donde se recorren todos.
 */
export default function FileList({
  files,
  onRemove,
  showDownload = true,
  className,
}: FileListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Vista local (blob:) de los archivos aún no subidos, para miniatura y visor.
  const localUrls = useMemo(
    () => files.map((item) => (item instanceof File ? URL.createObjectURL(item) : null)),
    [files]
  );
  useEffect(
    () => () => localUrls.forEach((url) => url && URL.revokeObjectURL(url)),
    [localUrls]
  );

  const items: PreviewItem[] = files.map((item, i) =>
    item instanceof File
      ? { name: item.name, size: item.size, file: item, type: item.type, url: localUrls[i] ?? undefined }
      : { name: item.name, size: item.size, url: item.url, file: item.file, type: item.type }
  );

  if (files.length === 0) return null;

  // Si se quitó el archivo abierto, el visor se cierra.
  const safeIndex = openIndex !== null && openIndex < items.length ? openIndex : null;

  return (
    <>
      <div className={cn("mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3", className)}>
        {items.map((item, i) => (
          <FileRow
            key={`${item.name}-${item.size}-${i}`}
            index={i}
            name={item.name}
            size={item.size}
            url={item.url}
            file={item.file}
            type={item.type}
            showDownload={showDownload}
            onOpen={() => setOpenIndex(i)}
            onRemove={onRemove ? () => onRemove(i) : undefined}
          />
        ))}
      </div>

      <FilePreviewer
        items={items}
        index={safeIndex}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}
