"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AlertCircle, ArrowUp, FileText, Loader2, Mic, Paperclip, X } from "lucide-react";
import { uploadFileToS3 } from "@/hooks/useS3Upload";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { AiTransactionService } from "@/features/transactions/services/ai-transaction.service";
import { getErrorMessages, isApiError } from "@/types/api-error.type";
import { fileMimeType } from "@/lib/document-constraints";
import type { ChatAttachment } from "../types/proposal.types";
import {
  EVIDENCE_ACCEPT,
  MAX_EVIDENCE_BYTES,
  MAX_EVIDENCE_PER_MESSAGE,
  formatFileSize,
  isEvidenceType,
  isPdf,
} from "../utils/evidence";
import SavviIAVoiceBar from "./SavviIAVoiceBar";

/** Límite de una nota de voz; al llegar se envía sola. */
const MAX_VOICE_SECONDS = 120;

export interface SendMessageOptions {
  /** `false`: se agrega al chat sin pedir respuesta al asesor. */
  reply?: boolean;
  /** El texto viene de una nota de voz transcrita. */
  viaVoice?: boolean;
  /** Evidencias (recibos, facturas, comprobantes) ya subidas a S3. */
  attachments?: ChatAttachment[];
}

/** Mensaje legible de un error del API o de red. */
const errorMessage = (error: unknown, fallback: string) =>
  isApiError(error) ? getErrorMessages(error).join(" ") : error instanceof Error ? error.message : fallback;

/** Evidencia en el composer: se sube apenas se elige y se envía con el mensaje. */
interface PendingAttachment {
  id: string;
  file: File;
  mimeType: string;
  /** Miniatura local (solo imágenes; se libera al quitarla o enviarla). */
  previewUrl?: string;
  status: "uploading" | "ready" | "error";
  progress: number;
  uploaded?: { key: string; name: string; size: number };
  error?: string;
}

interface SavviIAComposerProps {
  initialValue?: string;
  onSendMessage: (message: string, options?: SendMessageOptions) => void;
  disabled?: boolean;
}

export default function SavviIAComposer({ initialValue = "", onSendMessage, disabled = false }: SavviIAComposerProps) {
  const [message, setMessage] = useState(initialValue);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [dragging, setDragging] = useState(false);
  /** La nota de voz se está transcribiendo. */
  const [sendingVoice, setSendingVoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const levelSinkRef = useRef<((level: number) => void) | null>(null);
  // Copia para leer las evidencias desde callbacks async (nota de voz, subidas).
  const attachmentsRef = useRef<PendingAttachment[]>([]);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  // Al desmontar se liberan las miniaturas.
  useEffect(
    () => () => attachmentsRef.current.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl)),
    [],
  );

  const patchAttachment = (id: string, patch: Partial<PendingAttachment>) =>
    setAttachments((previous) => previous.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const removeAttachment = (id: string) =>
    setAttachments((previous) => {
      const removed = previous.find((a) => a.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return previous.filter((a) => a.id !== id);
    });

  const uploadAttachment = async (item: PendingAttachment) => {
    try {
      const uploaded = await uploadFileToS3(item.file, "savvi-ia", (progress) => patchAttachment(item.id, { progress }));
      patchAttachment(item.id, { status: "ready", progress: 100, uploaded });
    } catch (error) {
      patchAttachment(item.id, { status: "error", error: errorMessage(error, "No se pudo subir el archivo.") });
    }
  };

  /** Agrega evidencias desde el clip, pegar o arrastrar: valida y empieza a subirlas. */
  const addFiles = (files: File[]) => {
    setAttachmentError(null);
    const room = MAX_EVIDENCE_PER_MESSAGE - attachmentsRef.current.length;
    if (room <= 0) {
      setAttachmentError(`Puedes adjuntar hasta ${MAX_EVIDENCE_PER_MESSAGE} archivos por mensaje.`);
      return;
    }
    const accepted: PendingAttachment[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      const mimeType = fileMimeType(file);
      if (!isEvidenceType(mimeType)) rejected.push(`${file.name}: usa una foto (JPG, PNG, WEBP) o un PDF`);
      else if (file.size > MAX_EVIDENCE_BYTES) rejected.push(`${file.name}: supera ${formatFileSize(MAX_EVIDENCE_BYTES)}`);
      else if (accepted.length < room)
        accepted.push({
          id: crypto.randomUUID(),
          file,
          mimeType,
          previewUrl: mimeType.startsWith("image/") ? URL.createObjectURL(file) : undefined,
          status: "uploading",
          progress: 0,
        });
      else rejected.push(`${file.name}: máximo ${MAX_EVIDENCE_PER_MESSAGE} archivos por mensaje`);
    }
    if (rejected.length) setAttachmentError(rejected.join(" · "));
    if (!accepted.length) return;
    setAttachments((previous) => [...previous, ...accepted]);
    accepted.forEach((item) => void uploadAttachment(item));
    textareaRef.current?.focus();
  };

  /** La nota de voz se transcribe y llega al asesor como un mensaje normal. */
  const sendVoiceNote = async (audio: Blob, fileName: string) => {
    setAttachmentError(null);
    setSendingVoice(true);
    try {
      const text = (await AiTransactionService.transcribe(audio, fileName)).trim();
      if (!text) {
        setAttachmentError("No entendimos la nota de voz. Intenta grabarla de nuevo.");
        return;
      }
      sendWith(text, { viaVoice: true });
    } catch (error) {
      setAttachmentError(errorMessage(error, "No pudimos transcribir tu nota de voz."));
    } finally {
      setSendingVoice(false);
    }
  };

  const recorder = useAudioRecorder({
    maxSeconds: MAX_VOICE_SECONDS,
    onLevel: (level) => levelSinkRef.current?.(level),
    onRecorded: (audio, fileName) => void sendVoiceNote(audio, fileName),
  });

  const isRecording = recorder.state === "recording";
  const isBusy = disabled || sendingVoice;
  const uploadingFiles = attachments.some((a) => a.status === "uploading");
  const readyAttachments = attachments.filter((a) => a.status === "ready" && a.uploaded);
  const hasText = message.trim().length > 0;
  const canSend = (hasText || readyAttachments.length > 0) && !uploadingFiles && !isBusy;
  const error = attachmentError ?? recorder.error;

  /** Envía el texto (escrito o dictado) junto con las evidencias listas. */
  function sendWith(text: string, options: Omit<SendMessageOptions, "attachments"> = {}) {
    const evidence: ChatAttachment[] = attachmentsRef.current.flatMap((a) =>
      a.status === "ready" && a.uploaded ? [{ ...a.uploaded, mimeType: a.mimeType }] : [],
    );
    onSendMessage(text, { ...options, attachments: evidence });
    attachmentsRef.current.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
  }

  const submitMessage = () => {
    if (!canSend) return;
    sendWith(message.trim());
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitMessage();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  const triggerFilePicker = () => {
    if (isBusy) return;
    fileInputRef.current?.click();
  };

  const onFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length) addFiles(files);
  };

  /** Pegar una captura de pantalla la adjunta como evidencia. */
  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files);
    if (!files.length) return;
    event.preventDefault();
    addFiles(files);
  };

  const onDrop = (event: DragEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDragging(false);
    if (isBusy) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length) addFiles(files);
  };

  const startRecording = () => {
    if (isBusy) return;
    setAttachmentError(null);
    void recorder.start();
  };

  const { cancel: cancelRecording, stop: stopRecording } = recorder;
  const cancel = useCallback(() => cancelRecording(), [cancelRecording]);

  const autoResize = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  };

  const timeProgress = Math.min(100, (recorder.seconds / MAX_VOICE_SECONDS) * 100);
  const showSend = hasText || attachments.length > 0;

  return (
    <form
      onSubmit={onSubmit}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className="mx-auto w-full max-w-3xl px-4 pb-4 md:px-6"
    >
      <div
        className={`relative overflow-hidden rounded-3xl border bg-white shadow-lg shadow-slate-200/60 transition-all duration-300 focus-within:border-emerald-300 focus-within:shadow-emerald-500/10 focus-within:ring-4 focus-within:ring-emerald-100 ${
          isRecording || dragging ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
        }`}
      >
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-emerald-50/90 text-sm font-medium text-emerald-700">
            Suelta aquí la foto del recibo o el PDF
          </div>
        )}

        {attachments.length > 0 && (
          <ul className="flex gap-2 overflow-x-auto px-3 pt-3" aria-label="Evidencias por enviar">
            {attachments.map((item) => (
              <li
                key={item.id}
                className={`savvi-msg-in relative flex w-44 shrink-0 items-center gap-2 rounded-2xl border p-1.5 pr-7 ${
                  item.status === "error" ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
                }`}
                title={item.error ?? item.file.name}
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                  {item.previewUrl ? (
                    // Miniatura local (blob:), no pasa por el optimizador de imágenes.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : isPdf(item.mimeType) ? (
                    <FileText className="h-5 w-5 text-rose-500" aria-hidden />
                  ) : null}
                  {item.status === "uploading" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600" aria-hidden />
                    </span>
                  )}
                </span>
                <span className="min-w-0 text-xs leading-tight">
                  <span className="block truncate font-medium text-slate-700">{item.file.name}</span>
                  <span className={`block truncate ${item.status === "error" ? "text-red-600" : "text-slate-400"}`}>
                    {item.status === "uploading"
                      ? `Subiendo… ${item.progress}%`
                      : item.status === "error"
                        ? "No se pudo subir"
                        : formatFileSize(item.file.size)}
                  </span>
                </span>
                {item.status === "error" && <AlertCircle className="absolute right-7 top-1.5 h-3.5 w-3.5 text-red-500" aria-hidden />}
                <button
                  type="button"
                  onClick={() => removeAttachment(item.id)}
                  className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                  aria-label={`Quitar ${item.file.name}`}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-end gap-1.5 p-1.5">
          {isRecording ? (
            <SavviIAVoiceBar
              seconds={recorder.seconds}
              maxSeconds={MAX_VOICE_SECONDS}
              levelSinkRef={levelSinkRef}
              onCancel={cancel}
              onSend={stopRecording}
            />
          ) : (
            <>
              <button
                type="button"
                onClick={triggerFilePicker}
                disabled={isBusy || attachments.length >= MAX_EVIDENCE_PER_MESSAGE}
                className="savvi-wiggle-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:scale-90 disabled:opacity-40"
                aria-label="Adjuntar recibo, factura o comprobante"
                title="Adjuntar recibo, factura o comprobante (foto o PDF)"
              >
                <Paperclip className="h-[18px] w-[18px]" aria-hidden />
              </button>

              <label htmlFor="savvi-ia-message" className="sr-only">
                Escribe tu mensaje para Savvi IA
              </label>
              <textarea
                id="savvi-ia-message"
                ref={textareaRef}
                rows={1}
                maxLength={30_000}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  autoResize(event.target);
                }}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                disabled={sendingVoice}
                placeholder={
                  sendingVoice
                    ? "Transcribiendo tu nota de voz…"
                    : attachments.length
                      ? "Cuéntame qué fue (ej. mercado, con la débito)…"
                      : "Escribe sobre tus finanzas..."
                }
                className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 md:text-[15px]"
              />

              {/* Sin texto ni archivos se ofrece grabar; si no, enviar (cambian con un pequeño salto). */}
              {!showSend ? (
                <button
                  key="mic"
                  type="button"
                  onClick={startRecording}
                  disabled={isBusy || recorder.state === "requesting"}
                  className="savvi-pop group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 transition-transform duration-200 hover:scale-105 active:scale-90 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  aria-label="Grabar nota de voz"
                  title="Grabar nota de voz"
                >
                  {recorder.state === "requesting" ? (
                    <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
                  ) : (
                    <Mic className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" aria-hidden />
                  )}
                </button>
              ) : (
                <button
                  key="send"
                  type="submit"
                  disabled={!canSend}
                  className="savvi-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-90 disabled:scale-100 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  aria-label="Enviar mensaje"
                >
                  {uploadingFiles ? (
                    <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
                  ) : (
                    <ArrowUp className="h-[18px] w-[18px]" aria-hidden />
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Avance hacia el límite de la nota de voz. */}
        {isRecording && (
          <span
            className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-emerald-400 to-teal-400 transition-transform duration-300"
            style={{ transform: `scaleX(${timeProgress / 100})` }}
            aria-hidden
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={EVIDENCE_ACCEPT}
        multiple
        className="hidden"
        onChange={onFileSelected}
      />

      <div className="mt-2 flex min-h-4 items-center justify-center px-2 text-center text-[11px]" aria-live="polite">
        {error ? (
          <p key={error} className="savvi-msg-in text-red-500">
            {error}
          </p>
        ) : sendingVoice ? (
          <p className="savvi-msg-in flex items-center gap-1.5 text-emerald-600">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            Transcribiendo tu nota de voz…
          </p>
        ) : uploadingFiles ? (
          <p className="savvi-msg-in flex items-center gap-1.5 text-emerald-600">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            Subiendo tus archivos…
          </p>
        ) : isRecording ? (
          <p className="savvi-msg-in text-slate-500">
            Te escucho… toca <span className="font-semibold text-emerald-600">enviar</span> o la papelera para descartar
          </p>
        ) : attachments.length ? (
          <p className="text-slate-500">Savvi IA leerá tus archivos y te propondrá el registro para que lo confirmes.</p>
        ) : (
          <p className="text-slate-400">
            Adjunta el recibo o la factura y cuéntame qué gastaste · Orientación general, no asesoría de inversión.
          </p>
        )}
      </div>
    </form>
  );
}
