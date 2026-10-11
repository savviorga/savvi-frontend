"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioRecorderState = "idle" | "requesting" | "recording";

/** Formatos por orden de preferencia; Safari/iOS solo soporta mp4. */
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

export function pickAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function audioExtensionFor(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

export function formatRecordingTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface UseAudioRecorderOptions {
  /** Audio listo al terminar (no se llama si se descartó). */
  onRecorded: (audio: Blob, fileName: string) => void;
  /**
   * Volumen 0–1 en cada frame mientras graba. Va por callback (no por estado)
   * para animar con refs sin re-renderizar 60 veces por segundo.
   */
  onLevel?: (level: number) => void;
  /** Se detiene y envía solo al llegar a este tiempo. */
  maxSeconds?: number;
}

/**
 * Grabación de voz con permisos, volumen en vivo, límite de tiempo y descarte.
 * Libera el micrófono en cualquier cierre (detener, descartar, error o desmontar).
 */
export function useAudioRecorder({ onRecorded, onLevel, maxSeconds = 120 }: UseAudioRecorderOptions) {
  const [state, setState] = useState<AudioRecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  // Callbacks más recientes sin reiniciar la grabación cuando cambian.
  const onRecordedRef = useRef(onRecorded);
  const onLevelRef = useRef(onLevel);
  useEffect(() => {
    onRecordedRef.current = onRecorded;
    onLevelRef.current = onLevel;
  });

  const release = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    if (timerRef.current !== null) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => release, [release]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    } else {
      release();
      setState("idle");
      setSeconds(0);
    }
  }, [release]);

  const start = useCallback(async () => {
    if (state !== "idle") return;
    setError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no permite grabar aquí. Se necesita HTTPS y un navegador reciente.");
      return;
    }

    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const mimeType = pickAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      cancelledRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        release();
        setState("idle");
        setSeconds(0);
        if (cancelledRef.current) return;
        if (blob.size < 1000) {
          setError("La grabación fue muy corta. Habla un momento antes de enviar.");
          return;
        }
        onRecordedRef.current(blob, `nota-de-voz-${Date.now()}.${audioExtensionFor(type)}`);
      };

      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const audioContext = new AudioCtx();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        audioContext.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          // Volumen RMS de la onda (0–1), amplificado para voces suaves.
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const sample of data) {
            const centered = (sample - 128) / 128;
            sum += centered * centered;
          }
          onLevelRef.current?.(Math.min(1, Math.sqrt(sum / data.length) * 4));
          frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      }

      recorder.start();
      setState("recording");
      setSeconds(0);
      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
        if (elapsed >= maxSeconds) stop();
      }, 250);
    } catch (err) {
      release();
      setState("idle");
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("No diste permiso al micrófono. Habilítalo en el candado de la barra de direcciones.");
      } else if (name === "NotFoundError") {
        setError("No encontramos un micrófono conectado.");
      } else {
        setError("No se pudo iniciar la grabación. Intenta de nuevo.");
      }
    }
  }, [maxSeconds, release, state, stop]);

  return { state, seconds, error, setError, start, stop, cancel, maxSeconds };
}
