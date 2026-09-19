"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";

type RecorderState = "idle" | "requesting" | "recording";

export interface VoiceRecorderProps {
  /** Se llama al detener la grabación con el audio listo para enviar. */
  onRecorded: (audio: Blob, fileName: string) => void;
  disabled?: boolean;
  /** Corta la grabación automáticamente al llegar a este tiempo. */
  maxSeconds?: number;
  className?: string;
}

/** Número de barras del visualizador. */
const BARS = 21;

/** Formatos por orden de preferencia; Safari solo soporta mp4. */
const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function extensionFor(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VoiceRecorder({
  onRecorded,
  disabled = false,
  maxSeconds = 90,
  className,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  /** Las barras se animan por ref: evita re-renderizar en cada frame. */
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  /** Suelta micrófono, audio y temporizadores. Debe correr en todo cierre. */
  const releaseResources = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => releaseResources, [releaseResources]);

  const animateLevels = useCallback((analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const step = Math.max(1, Math.floor(data.length / BARS));

      for (let i = 0; i < BARS; i++) {
        const bar = barsRef.current[i];
        if (!bar) continue;
        const value = data[i * step] ?? 0;
        // 0.15 mantiene una línea visible aunque haya silencio.
        const scale = Math.max(0.15, Math.min(1, value / 180));
        bar.style.transform = `scaleY(${scale})`;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const finish = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    if (disabled || state !== "idle") return;
    setError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError(
        "Tu navegador no permite grabar aquí. Se necesita HTTPS (o localhost) y un navegador reciente.",
      );
      return;
    }

    setState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const mimeType = pickMimeType();
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
        releaseResources();
        setState("idle");
        setSeconds(0);

        if (cancelledRef.current) return;
        if (blob.size < 1000) {
          setError("La grabación fue muy corta. Mantén el botón y habla un momento.");
          return;
        }
        onRecorded(blob, `nota-de-voz.${extensionFor(type)}`);
      };

      // Visualizador en vivo.
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const audioContext = new AudioCtx();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.7;
        audioContext.createMediaStreamSource(stream).connect(analyser);
        animateLevels(analyser);
      }

      recorder.start();
      setState("recording");
      setSeconds(0);

      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
        if (elapsed >= maxSeconds) finish();
      }, 250);
    } catch (err) {
      releaseResources();
      setState("idle");

      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(
          "No diste permiso al micrófono. Habilítalo en el candado de la barra de direcciones.",
        );
      } else if (name === "NotFoundError") {
        setError("No encontramos un micrófono conectado.");
      } else {
        setError("No se pudo iniciar la grabación. Intenta de nuevo.");
      }
    }
  }, [animateLevels, disabled, finish, maxSeconds, onRecorded, releaseResources, state]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    } else {
      releaseResources();
      setState("idle");
      setSeconds(0);
    }
  }, [releaseResources]);

  const isRecording = state === "recording";
  const progress = Math.min(100, (seconds / maxSeconds) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      {isRecording ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={cancel}
              aria-label="Descartar grabación"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 transition active:scale-95"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            {/* Visualizador: las barras se mueven con la voz. */}
            <div
              className="flex h-10 flex-1 items-center justify-center gap-[3px]"
              aria-hidden
            >
              {Array.from({ length: BARS }).map((_, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    barsRef.current[i] = el;
                  }}
                  className="h-7 w-[3px] origin-center rounded-full bg-rose-400 transition-transform duration-75"
                  style={{ transform: "scaleY(0.15)" }}
                />
              ))}
            </div>

            <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-rose-700">
              {formatTime(seconds)}
            </span>

            <button
              type="button"
              onClick={finish}
              aria-label="Terminar y transcribir"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 transition active:scale-95"
            >
              <Square className="h-4 w-4 fill-current" aria-hidden />
            </button>
          </div>

          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-rose-200">
            <div
              className="h-full rounded-full bg-rose-500 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-center text-[11px] text-rose-700/80" role="status">
            Grabando… habla con naturalidad (máx. {formatTime(maxSeconds)})
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={disabled || state === "requesting"}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border border-mint/40 bg-mint/10 px-4 py-3 text-sm font-semibold text-[#0B1829] transition",
            "hover:bg-mint/20 active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-cosmos">
            <Mic className="h-4 w-4" aria-hidden />
          </span>
          {state === "requesting" ? "Pidiendo permiso…" : "Grabar nota de voz"}
        </button>
      )}

      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
