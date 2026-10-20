"use client";

import { ChangeEvent, FormEvent, KeyboardEvent, useCallback, useRef, useState } from "react";
import { ArrowUp, Loader2, Mic, Paperclip } from "lucide-react";
import { useS3Upload } from "@/hooks/useS3Upload";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { AiRegisterJobResponse, AiRegisterService } from "../services/ai-register.service";
import { AiTransactionService } from "@/features/transactions/services/ai-transaction.service";
import { getErrorMessages, isApiError } from "@/types/api-error.type";
import { fileMimeType } from "@/lib/document-constraints";
import SavviIAVoiceBar from "./SavviIAVoiceBar";

/** Límite de una nota de voz; al llegar se envía sola. */
const MAX_VOICE_SECONDS = 120;

export interface SendMessageOptions {
  /** `false`: se agrega al chat sin pedir respuesta al asesor. */
  reply?: boolean;
  /** El texto viene de una nota de voz transcrita. */
  viaVoice?: boolean;
}

/** Mensaje legible de un error del API o de red. */
const errorMessage = (error: unknown, fallback: string) =>
  isApiError(error) ? getErrorMessages(error).join(" ") : error instanceof Error ? error.message : fallback;

interface SavviIAComposerProps {
  initialValue?: string;
  onSendMessage: (message: string, options?: SendMessageOptions) => void;
  onJobCreated: (job: AiRegisterJobResponse, attachmentName: string) => void;
  disabled?: boolean;
}

export default function SavviIAComposer({
  initialValue = "",
  onSendMessage,
  onJobCreated,
  disabled = false,
}: SavviIAComposerProps) {
  const [message, setMessage] = useState(initialValue);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  /** El archivo que se está subiendo es una nota de voz (cambia el aviso). */
  const [sendingVoice, setSendingVoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const levelSinkRef = useRef<((level: number) => void) | null>(null);
  const { uploadFiles, uploading } = useS3Upload();

  const uploadAndCreateJob = async (file: File) => {
    setAttachmentError(null);
    try {
      const [uploadResult] = await uploadFiles([file], "savvi-ia");
      const job = await AiRegisterService.createJob({
        ...uploadResult,
        mimeType: fileMimeType(file),
        userText: message.trim() || undefined,
      });
      onJobCreated(job, file.name);
      if (message.trim()) {
        // El texto acompaña al archivo; el registro lo procesa, no el chat.
        onSendMessage(message.trim(), { reply: false });
        setMessage("");
      }
    } catch (error) {
      const fallback = "No se pudo procesar el archivo.";
      setAttachmentError(error instanceof Error ? error.message : fallback);
    }
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
      onSendMessage(text, { viaVoice: true });
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
  const isBusy = disabled || uploading || sendingVoice;
  const hasText = message.trim().length > 0;
  const error = attachmentError ?? recorder.error;

  const submitMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    onSendMessage(trimmed);
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitMessage(message);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage(message);
    }
  };

  const triggerFilePicker = () => {
    if (isBusy) return;
    fileInputRef.current?.click();
  };

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadAndCreateJob(file);
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

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-3xl px-4 pb-4 md:px-6">
      <div
        className={`relative flex items-end gap-1.5 overflow-hidden rounded-3xl border bg-white p-1.5 shadow-lg shadow-slate-200/60 transition-all duration-300 focus-within:border-emerald-300 focus-within:shadow-emerald-500/10 focus-within:ring-4 focus-within:ring-emerald-100 ${
          isRecording ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
        }`}
      >
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
              disabled={isBusy}
              className="savvi-wiggle-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:scale-90 disabled:opacity-40"
              aria-label="Adjuntar imagen o audio"
              title="Adjuntar imagen o audio"
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
              disabled={uploading || sendingVoice}
              placeholder={sendingVoice ? "Transcribiendo tu nota de voz…" : "Escribe sobre tus finanzas..."}
              className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 md:text-[15px]"
            />

            {/* Sin texto se ofrece grabar; con texto, enviar (cambian con un pequeño salto). */}
            {!hasText && !uploading ? (
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
                  <Mic
                    className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110"
                    aria-hidden
                  />
                )}
              </button>
            ) : (
              <button
                key="send"
                type="submit"
                disabled={!hasText || isBusy}
                className="savvi-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-90 disabled:scale-100 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
                aria-label="Enviar mensaje"
              >
                {uploading ? (
                  <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
                ) : (
                  <ArrowUp className="h-[18px] w-[18px]" aria-hidden />
                )}
              </button>
            )}
          </>
        )}

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
        accept="image/*,audio/*"
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
        ) : uploading ? (
          <p className="savvi-msg-in flex items-center gap-1.5 text-emerald-600">
            <span className="flex items-center gap-0.5" aria-hidden>
              {[0, 0.15, 0.3].map((delay) => (
                <span
                  key={delay}
                  className="savvi-typing-dot h-1 w-1 rounded-full bg-emerald-500"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </span>
            Subiendo archivo…
          </p>
        ) : isRecording ? (
          <p className="savvi-msg-in text-slate-500">
            Te escucho… toca <span className="font-semibold text-emerald-600">enviar</span> o la papelera
            para descartar
          </p>
        ) : (
          <p className="text-slate-400">
            Orientación general sobre finanzas personales, no asesoría de inversión.
          </p>
        )}
      </div>
    </form>
  );
}
