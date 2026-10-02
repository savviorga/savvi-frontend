"use client";

import { ChangeEvent, FormEvent, KeyboardEvent, useRef, useState } from "react";
import { ArrowUp, Loader2, Mic, Paperclip, Square } from "lucide-react";
import { useS3Upload } from "@/hooks/useS3Upload";
import { AiRegisterJobResponse, AiRegisterService } from "../services/ai-register.service";

interface SavviIAComposerProps {
  initialValue?: string;
  onSendMessage: (message: string, options?: { reply?: boolean }) => void;
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
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const { uploadFiles, uploading } = useS3Upload();

  const isBusy = disabled || uploading;

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

  const createAudioFile = (audioBlob: Blob) => {
    const extension = audioBlob.type.includes("wav")
      ? "wav"
      : audioBlob.type.includes("ogg")
        ? "ogg"
        : "webm";
    const fileName = `savvi-audio-${Date.now()}.${extension}`;
    return new File([audioBlob], fileName, { type: audioBlob.type || "audio/webm" });
  };

  const uploadAndCreateJob = async (file: File) => {
    setAttachmentError(null);
    try {
      const [uploadResult] = await uploadFiles([file], "savvi-ia");
      const job = await AiRegisterService.createJob({
        ...uploadResult,
        mimeType: file.type,
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

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadAndCreateJob(file);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const toggleRecording = async () => {
    if (isBusy) return;

    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      setAttachmentError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        if (chunksRef.current.length === 0) {
          setAttachmentError("No se detectó audio en la grabación.");
          return;
        }
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const audioFile = createAudioFile(audioBlob);
        await uploadAndCreateJob(audioFile);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setAttachmentError("No fue posible iniciar el micrófono.");
      setIsRecording(false);
    }
  };

  const autoResize = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-3xl px-4 pb-4 md:px-6">
      <div
        className={`flex items-end gap-1.5 rounded-3xl border bg-white p-1.5 shadow-lg shadow-slate-200/60 transition-all duration-200 focus-within:border-emerald-300 focus-within:shadow-emerald-500/10 focus-within:ring-4 focus-within:ring-emerald-100 ${
          isRecording ? "border-red-300 ring-4 ring-red-100" : "border-slate-200"
        }`}
      >
        <button
          type="button"
          onClick={triggerFilePicker}
          disabled={isBusy}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
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
          disabled={uploading}
          placeholder={isRecording ? "Escuchando..." : "Escribe sobre tus finanzas..."}
          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 md:text-[15px]"
        />

        <button
          type="button"
          onClick={toggleRecording}
          disabled={isBusy}
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
            isRecording
              ? "bg-red-50 text-red-500"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          }`}
          aria-label={isRecording ? "Detener grabación" : "Grabar voz"}
          title={isRecording ? "Detener grabación" : "Grabar voz"}
        >
          {isRecording && (
            <span className="savvi-pulse-ring absolute inset-0 rounded-full bg-red-400/40" aria-hidden />
          )}
          {isRecording ? (
            <Square className="relative h-4 w-4 fill-current" aria-hidden />
          ) : (
            <Mic className="h-[18px] w-[18px]" aria-hidden />
          )}
        </button>

        <button
          type="submit"
          disabled={!message.trim() || isBusy}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:scale-100 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
          aria-label="Enviar mensaje"
        >
          {uploading ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
          ) : (
            <ArrowUp className="h-[18px] w-[18px]" aria-hidden />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*"
        className="hidden"
        onChange={onFileSelected}
      />

      <div className="mt-2 flex min-h-4 items-center justify-center px-2 text-center text-[11px]">
        {attachmentError ? (
          <p className="savvi-msg-in text-red-500">{attachmentError}</p>
        ) : uploading ? (
          <p className="savvi-msg-in text-emerald-600">Subiendo archivo...</p>
        ) : isRecording ? (
          <p className="savvi-msg-in text-red-500">Grabando... toca el cuadrado para detener.</p>
        ) : (
          <p className="text-slate-400">
            Orientación general sobre finanzas personales, no asesoría de inversión.
          </p>
        )}
      </div>
    </form>
  );
}
