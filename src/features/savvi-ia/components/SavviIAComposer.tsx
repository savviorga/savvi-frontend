"use client";

import { ChangeEvent, FormEvent, KeyboardEvent, useRef, useState } from "react";
import { Mic, Paperclip, Send, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/shadcn-button";
import SavviIAPromptChips from "./SavviIAPromptChips";
import { useS3Upload } from "@/hooks/useS3Upload";
import { AiRegisterJobResponse, AiRegisterService } from "../services/ai-register.service";

interface SavviIAComposerProps {
  initialValue?: string;
  quickPrompts: string[];
  onSendMessage: (message: string) => void;
  onJobCreated: (job: AiRegisterJobResponse, attachmentName: string) => void;
  disabled?: boolean;
}

export default function SavviIAComposer({
  initialValue = "",
  quickPrompts,
  onSendMessage,
  onJobCreated,
  disabled = false,
}: SavviIAComposerProps) {
  const [message, setMessage] = useState(initialValue);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const { uploadFiles, uploading } = useS3Upload();

  const isBusy = disabled || uploading;

  const submitMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    onSendMessage(trimmed);
    setMessage("");
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
        onSendMessage(message.trim());
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

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4"
    >
      <div className="mb-3">
        <p className="mb-2 text-xs font-medium text-slate-500">
          Sugerencias rápidas
        </p>
        <SavviIAPromptChips
          prompts={quickPrompts}
          onSelectPrompt={(prompt) => submitMessage(prompt)}
        />
      </div>

      <label htmlFor="savvi-ia-message" className="sr-only">
        Escribe tu mensaje para Savvi IA
      </label>
      <textarea
        id="savvi-ia-message"
        rows={3}
        maxLength={500}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={onKeyDown}
        disabled={isBusy}
        placeholder="Ej: Ayúdame a organizar mis gastos fijos de este mes..."
        className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <button
            type="button"
            onClick={triggerFilePicker}
            disabled={isBusy}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
            aria-label="Adjuntar archivo"
          >
            <Paperclip className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isBusy}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
            aria-label={isRecording ? "Detener grabación" : "Grabar voz"}
          >
            {isRecording ? (
              <Square className="h-4 w-4 text-red-500" aria-hidden />
            ) : (
              <Mic className="h-4 w-4" aria-hidden />
            )}
          </button>
          <div className="hidden items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            IA Demo
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500">{message.length}/500</p>
          <Button
            type="submit"
            disabled={!message.trim() || isBusy}
            className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
          >
            Enviar
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*"
        className="hidden"
        onChange={onFileSelected}
      />

      <p className="mt-2 text-[11px] text-slate-400">
        Enter para enviar, Shift + Enter para salto de línea.
      </p>

      {uploading && (
        <p className="mt-1 text-[11px] text-emerald-600">Subiendo archivo...</p>
      )}
      {isRecording && (
        <p className="mt-1 text-[11px] text-red-500">
          Grabando audio... toca el icono cuadrado para detener.
        </p>
      )}
      {attachmentError && (
        <p className="mt-1 text-[11px] text-red-500">{attachmentError}</p>
      )}
    </form>
  );
}
