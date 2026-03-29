"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploaderProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  label?: string;
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export default function FileUploader({
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  accept,
  label = "Arrastra archivos o haz clic para seleccionar",
  onFilesChange,
  disabled = false,
  className,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesChange(acceptedFiles);
    },
    [onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      multiple: true,
      maxFiles,
      maxSize,
      accept,
      disabled,
    });

  return (
    <div className={cn("space-y-3", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-8 transition-colors outline-none",
          "border-border bg-white/80 hover:border-mint/40 hover:bg-mint/[0.04]",
          "focus-visible:ring-2 focus-visible:ring-mint/35 focus-visible:ring-offset-2",
          isDragActive && "border-mint bg-mint/10",
          disabled && "cursor-not-allowed opacity-50 hover:border-border hover:bg-transparent"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full bg-mint/10 text-mint",
              isDragActive && "bg-mint/20"
            )}
          >
            <Upload className="h-6 w-6" strokeWidth={2} aria-hidden />
          </div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            Máx. {maxFiles} archivos · {(maxSize / 1024 / 1024).toFixed(0)} MB c/u
          </p>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {fileRejections.map((rej, idx) => (
            <p key={idx}>
              {rej.file.name}: {rej.errors.map((e) => e.message).join(", ")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
