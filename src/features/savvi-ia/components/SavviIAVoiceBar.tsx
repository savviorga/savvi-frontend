"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { ArrowUp, Trash2 } from "lucide-react";
import { formatRecordingTime } from "@/hooks/useAudioRecorder";

/** Barras de la onda; la más reciente entra por la derecha. */
const BARS = 36;
/** Cada cuánto avanza la onda (ms). */
const SHIFT_MS = 70;

interface SavviIAVoiceBarProps {
  seconds: number;
  maxSeconds: number;
  /** El compositor escribe aquí el volumen de cada frame; la barra lo dibuja. */
  levelSinkRef: MutableRefObject<((level: number) => void) | null>;
  onCancel: () => void;
  onSend: () => void;
}

/**
 * Panel de grabación del chat: la onda se desplaza con la voz real, el halo del
 * botón de enviar late con el volumen y el punto rojo parpadea. Todo se anima
 * por refs para no re-renderizar en cada frame. Esc descarta.
 */
export default function SavviIAVoiceBar({
  seconds,
  maxSeconds,
  levelSinkRef,
  onCancel,
  onSend,
}: SavviIAVoiceBarProps) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const haloRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const history = new Array<number>(BARS).fill(0);
    let peak = 0;
    let lastShift = 0;

    levelSinkRef.current = (level) => {
      peak = Math.max(peak, level);
      if (haloRef.current) {
        haloRef.current.style.transform = `scale(${1 + level * 0.9})`;
        haloRef.current.style.opacity = `${0.25 + level * 0.5}`;
      }
      const now = performance.now();
      if (now - lastShift < SHIFT_MS) return;
      lastShift = now;
      history.shift();
      history.push(peak);
      peak = 0;
      history.forEach((value, i) => {
        const bar = barsRef.current[i];
        if (bar) bar.style.transform = `scaleY(${0.12 + value * 0.88})`;
      });
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      levelSinkRef.current = null;
      window.removeEventListener("keydown", onKey);
    };
  }, [levelSinkRef, onCancel]);

  const nearLimit = maxSeconds - seconds <= 10;

  return (
    <div className="savvi-msg-in flex min-w-0 flex-1 items-center gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="savvi-wiggle-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 active:scale-90"
        aria-label="Descartar nota de voz"
        title="Descartar (Esc)"
      >
        <Trash2 className="h-[18px] w-[18px]" aria-hidden />
      </button>

      <span className="flex shrink-0 items-center gap-1.5" role="timer" aria-live="off">
        <span className="savvi-blink h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden />
        <span
          className={`w-9 text-sm font-semibold tabular-nums ${nearLimit ? "text-rose-600" : "text-slate-700"}`}
        >
          {formatRecordingTime(seconds)}
        </span>
      </span>

      {/* Onda: se mueve de derecha a izquierda con el volumen real del micrófono. */}
      <div className="flex h-9 min-w-0 flex-1 items-center justify-end gap-[3px] overflow-hidden" aria-hidden>
        {Array.from({ length: BARS }).map((_, i) => (
          <span
            key={i}
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            className="h-full w-[3px] shrink-0 origin-center rounded-full bg-gradient-to-t from-emerald-500 to-teal-400 transition-transform duration-75"
            style={{ transform: "scaleY(0.12)", opacity: 0.35 + (i / BARS) * 0.65 }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onSend}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 transition-transform duration-200 hover:scale-105 active:scale-90"
        aria-label="Enviar nota de voz"
        title="Enviar"
      >
        <span
          ref={haloRef}
          className="pointer-events-none absolute inset-0 rounded-full bg-emerald-400 transition-[transform,opacity] duration-100 motion-reduce:hidden"
          style={{ opacity: 0.25 }}
          aria-hidden
        />
        <ArrowUp className="relative h-[18px] w-[18px]" aria-hidden />
      </button>
    </div>
  );
}
