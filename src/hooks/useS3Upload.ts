"use client";

import { useState, useCallback, useRef } from "react";
import { getBearerAuthHeaders, getJsonAuthHeaders } from "@/lib/api-auth";
import { getPublicApiUrl } from "@/lib/public-api-url";
import type { ApiError } from "@/types/api-error.type";

export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
}

export interface S3UploadResult {
  key: string;
  name: string;
  size: number;
}

interface PresignedUrlResponse {
  url: string;
  key: string;
}

const MAX_RETRIES = 2;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name} excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024} MB`;
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: tipo de archivo no permitido (${file.type || "desconocido"})`;
  }
  return null;
}

async function requestPresignedUrl(
  file: File,
  folder: string,
): Promise<PresignedUrlResponse> {
  const apiUrl = getPublicApiUrl();
  if (!apiUrl) {
    throw {
      message: "Falta NEXT_PUBLIC_API_URL.",
      error: "Config",
      statusCode: 500,
    } satisfies ApiError;
  }

  const res = await fetch(`${apiUrl}/s3/presigned-url`, {
    method: "POST",
    headers: getJsonAuthHeaders(),
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      folder,
      fileSize: file.size,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    let message: string;
    try {
      const parsed = JSON.parse(body);
      message = Array.isArray(parsed.message)
        ? parsed.message.join(", ")
        : parsed.message || `Error HTTP ${res.status}`;
    } catch {
      message = `Error HTTP ${res.status}`;
    }
    throw { message, error: "PresignedUrl", statusCode: res.status } satisfies ApiError;
  }

  return res.json();
}

function uploadToS3WithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const handleAbort = () => {
      xhr.abort();
      reject(new DOMException("Upload aborted", "AbortError"));
    };

    signal?.addEventListener("abort", handleAbort, { once: true });

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded, e.total);
      }
    });

    xhr.addEventListener("load", () => {
      signal?.removeEventListener("abort", handleAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject({
          message: `S3 respondió con status ${xhr.status}. ${xhr.status === 403 ? "Revisa la configuración CORS del bucket S3 y que la URL prefirmada no haya expirado." : xhr.responseText}`,
          error: "S3Upload",
          statusCode: xhr.status,
        } satisfies ApiError);
      }
    });

    xhr.addEventListener("error", () => {
      signal?.removeEventListener("abort", handleAbort);
      reject({
        message:
          "Error de red al subir a S3. Causa probable: el bucket S3 no tiene CORS configurado para tu dominio. " +
          "Configura CORS en S3 → Permissions → Cross-origin resource sharing (CORS).",
        error: "S3Network",
        statusCode: 0,
      } satisfies ApiError);
    });

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(file);
  });
}

async function uploadSingleFile(
  file: File,
  folder: string,
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<S3UploadResult> {
  let url: string;
  let key: string;

  try {
    const presigned = await requestPresignedUrl(file, folder);
    url = presigned.url;
    key = presigned.key;
  } catch (err) {
    console.error(`[useS3Upload] Error obteniendo presigned URL para ${file.name}:`, err);
    throw err;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await uploadToS3WithProgress(url, file, file.type, onProgress, signal);
      return { key, name: file.name, size: file.size };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      lastError = err;
      const errMsg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? (err as { message: string }).message
            : JSON.stringify(err);
      console.error(`[useS3Upload] Intento ${attempt + 1}/${MAX_RETRIES + 1} falló para ${file.name}: ${errMsg}`);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export function useS3Upload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const totalPercent =
    progress.length > 0
      ? Math.round(
          progress.reduce((sum, p) => sum + p.percent, 0) / progress.length,
        )
      : 0;

  const uploadFiles = useCallback(
    async (files: File[], folder: string): Promise<S3UploadResult[]> => {
      const validationErrors = files
        .map(validateFile)
        .filter((e): e is string => e !== null);

      if (validationErrors.length > 0) {
        const msg = validationErrors.join("; ");
        setError(msg);
        throw { message: msg, error: "Validation", statusCode: 400 } satisfies ApiError;
      }

      setUploading(true);
      setError(null);
      setProgress(
        files.map((f) => ({
          fileName: f.name,
          loaded: 0,
          total: f.size,
          percent: 0,
        })),
      );

      abortRef.current = new AbortController();

      try {
        const results = await Promise.all(
          files.map((file, idx) =>
            uploadSingleFile(
              file,
              folder,
              (loaded, total) => {
                setProgress((prev) => {
                  const next = [...prev];
                  next[idx] = {
                    fileName: file.name,
                    loaded,
                    total,
                    percent: Math.round((loaded / total) * 100),
                  };
                  return next;
                });
              },
              abortRef.current!.signal,
            ),
          ),
        );

        return results;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "message" in err
              ? String((err as { message: unknown }).message)
              : "Error desconocido al subir archivos";
        setError(msg);
        throw err;
      } finally {
        setUploading(false);
        abortRef.current = null;
      }
    },
    [],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { uploadFiles, uploading, progress, totalPercent, error, abort };
}
