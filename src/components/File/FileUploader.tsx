"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploaderProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  label?: string;
  onFilesChange: (files: File[]) => void;
}

export default function FileUploader({
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  accept,
  label = "Arrastra archivos o haz clic para seleccionar",
  onFilesChange,
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
    });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition 
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
        `}
      >
        <input {...getInputProps()} />
        <p className="text-center text-gray-700">{label}</p>
      </div>

      {/* Errores */}
      {fileRejections.length > 0 && (
        <div className="text-red-600 text-sm">
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
