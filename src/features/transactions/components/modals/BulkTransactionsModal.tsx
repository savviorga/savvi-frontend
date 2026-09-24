"use client";

import { useMemo, useState } from "react";
import { Layers, Loader2, Plus, Send, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal/Modal";
import VoiceRecorder from "@/components/Audio/VoiceRecorder";
import { Button } from "@/components/ui/shadcn-button";
import { isApiError, getErrorMessages } from "@/types/api-error.type";
import { cn } from "@/lib/utils";
import { AiTransactionService } from "../../services/ai-transaction.service";
import type { Account, Category } from "../../types/catalog.types";
import type { CreateTransactionDto } from "../../types/transactions.types";
import {
  createEmptyRow,
  getMissingFields,
  type BulkDraftField,
  type BulkDraftRow,
} from "../../types/bulk.types";
import BulkTransactionsTable from "./BulkTransactionsTable";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

type Phase = "idle" | "transcribing" | "analyzing" | "saving";

export interface BulkTransactionsModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  /** Crea todos los registros de una vez; `true` si el guardado salió bien. */
  onConfirm: (items: CreateTransactionDto[]) => Promise<boolean>;
}

let fallbackId = 0;
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  fallbackId += 1;
  return `row-${Date.now()}-${fallbackId}`;
}

/** Resumen de lo que cambió tras un mensaje, para responder en el chat. */
function describeChanges(
  before: BulkDraftRow[],
  after: BulkDraftRow[],
): string {
  const beforeById = new Map(before.map((r) => [r.id, r]));
  const afterIds = new Set(after.map((r) => r.id));

  const added = after.filter((r) => !beforeById.has(r.id)).length;
  const removed = before.filter((r) => !afterIds.has(r.id)).length;
  const updated = after.filter((r) => {
    const previous = beforeById.get(r.id);
    if (!previous) return false;
    return (
      previous.type !== r.type ||
      previous.amount !== r.amount ||
      previous.date !== r.date ||
      previous.categoryId !== r.categoryId ||
      previous.accountId !== r.accountId ||
      previous.description !== r.description
    );
  }).length;

  const parts: string[] = [];
  const plural = (n: number, one: string, many: string) =>
    n === 1 ? `1 ${one}` : `${n} ${many}`;

  if (added) parts.push(`agregué ${plural(added, "registro", "registros")}`);
  if (updated) parts.push(`actualicé ${plural(updated, "registro", "registros")}`);
  if (removed) parts.push(`quité ${plural(removed, "registro", "registros")}`);

  if (parts.length === 0) {
    return "No encontré nada que cambiar. Dame más detalles (monto, fecha, cuenta o categoría).";
  }

  const pending = after.filter((r) => getMissingFields(r).length > 0).length;
  const summary = `Listo: ${parts.join(", ")}.`;
  return pending > 0
    ? `${summary} Faltan datos en ${plural(pending, "registro", "registros")}.`
    : summary;
}

export default function BulkTransactionsModal({
  open,
  onClose,
  categories,
  accounts,
  onConfirm,
}: BulkTransactionsModalProps) {
  const [rows, setRows] = useState<BulkDraftRow[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Cada apertura empieza de cero (sin efectos: el estado se sincroniza al render).
  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (open) {
      setRows([]);
      setMessages([]);
      setInput("");
      setPhase("idle");
      setError(null);
      setShowErrors(false);
    }
  }

  const busy = phase !== "idle";

  const invalidRows = useMemo(
    () => rows.filter((row) => getMissingFields(row).length > 0).length,
    [rows],
  );

  const describeError = (err: unknown, fallback: string) => {
    if (isApiError(err)) return getErrorMessages(err).join(" ");
    return err instanceof Error ? err.message : fallback;
  };

  const pushMessage = (role: ChatMessage["role"], text: string) => {
    setMessages((prev) => [...prev, { id: newId(), role, text }]);
  };

  const sendToAi = async (value: string) => {
    const clean = value.trim();
    if (!clean) return;

    const history = messages
      .filter((m) => m.role === "user")
      .map((m) => m.text);

    pushMessage("user", clean);
    setInput("");
    setPhase("analyzing");
    setError(null);

    try {
      const detected = await AiTransactionService.parseMany(
        clean,
        categories,
        accounts,
        {
          current: rows.map((row) => ({ ...row, id: row.id })),
          history,
        },
      );

      const next: BulkDraftRow[] = detected.map((item) => ({
        id: item.id ?? newId(),
        type: item.type,
        amount: item.amount,
        date: item.date,
        categoryId: item.categoryId,
        accountId: item.accountId,
        description: item.description,
      }));

      setRows(next);
      pushMessage("assistant", describeChanges(rows, next));
    } catch (err) {
      const message = describeError(err, "No se pudo analizar el mensaje.");
      setError(message);
      pushMessage("assistant", message);
    } finally {
      setPhase("idle");
    }
  };

  const handleRecorded = async (audio: Blob, fileName: string) => {
    setPhase("transcribing");
    setError(null);

    try {
      const transcription = await AiTransactionService.transcribe(audio, fileName);
      setPhase("idle");
      await sendToAi(transcription);
    } catch (err) {
      setError(describeError(err, "No se pudo transcribir el audio."));
      setPhase("idle");
    }
  };

  const updateRow = (id: string, patch: Partial<BulkDraftRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow(newId())]);
  };

  const handleConfirm = async () => {
    if (rows.length === 0) return;

    const incomplete = rows.some((row) => {
      const missing: BulkDraftField[] = getMissingFields(row);
      if (missing.length > 0) return true;
      // La categoría viaja por nombre: si el id ya no existe, no se puede crear.
      return !categories.some((c) => c.id === row.categoryId);
    });

    if (incomplete) {
      setShowErrors(true);
      toast.error("Completa los campos marcados antes de confirmar");
      return;
    }

    const items: CreateTransactionDto[] = rows.map((row) => ({
      date: row.date as string,
      type: row.type as CreateTransactionDto["type"],
      amount: row.amount as number,
      category: categories.find((c) => c.id === row.categoryId)?.name ?? "",
      account: row.accountId as string,
      ...(row.description ? { description: row.description } : {}),
    }));

    setPhase("saving");
    try {
      const ok = await onConfirm(items);
      if (ok) onClose();
    } finally {
      setPhase("idle");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Crear varios registros"
      description="Dicta o escribe tus movimientos, revísalos en la tabla y confírmalos todos juntos."
      className="md:max-w-5xl"
      headerIcon={<Layers className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />}
    >
      <div className="space-y-4">
        {/* Captura por voz y minichat */}
        <section className="rounded-2xl border border-mint/30 bg-mint/[0.06] p-3 sm:p-4">
          <header className="mb-3 flex items-start gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint/20 text-[#0B1829]"
              aria-hidden
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                Cuéntame tus movimientos
              </h3>
              <p className="text-xs text-muted-foreground">
                «Ayer pagué 45 mil del mercado con Bancolombia y me llegaron 2
                millones de sueldo». Puedes seguir escribiendo para corregir:
                «el segundo fue del 3 de marzo».
              </p>
            </div>
          </header>

          <VoiceRecorder onRecorded={handleRecorded} disabled={busy} />

          {messages.length > 0 ? (
            <ul
              className="mt-3 max-h-44 space-y-2 overflow-y-auto"
              aria-live="polite"
            >
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-xs",
                    message.role === "user"
                      ? "ml-auto bg-[#0B1829] text-white"
                      : "bg-white text-foreground ring-1 ring-border",
                  )}
                >
                  {message.text}
                </li>
              ))}
            </ul>
          ) : null}

          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendToAi(input);
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendToAi(input);
                }
              }}
              disabled={busy}
              rows={2}
              placeholder="Escribe aquí para agregar o corregir registros…"
              aria-label="Mensaje para la IA"
              className="block w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-base transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-60 sm:text-sm"
            />
            <Button
              type="submit"
              disabled={busy || !input.trim()}
              className="h-10 shrink-0 rounded-xl"
              aria-label="Enviar mensaje"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </form>

          <div aria-live="polite">
            {phase === "transcribing" || phase === "analyzing" ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {phase === "transcribing"
                  ? "Transcribiendo audio…"
                  : "Analizando lo que dijiste…"}
              </p>
            ) : null}

            {error ? (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            ) : null}
          </div>
        </section>

        {/* Tabla editable */}
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              Registros por crear
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {rows.length === 1 ? "1 registro" : `${rows.length} registros`}
                {invalidRows > 0
                  ? ` · ${invalidRows} con datos faltantes`
                  : ""}
              </span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={addRow}
              disabled={busy}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Agregar fila
            </Button>
          </div>

          <BulkTransactionsTable
            rows={rows}
            categories={categories}
            accounts={accounts}
            onChange={updateRow}
            onRemove={removeRow}
            disabled={phase === "saving"}
            showErrors={showErrors}
          />
        </section>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={onClose}
            disabled={phase === "saving"}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            onClick={handleConfirm}
            disabled={rows.length === 0 || busy}
          >
            {phase === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Creando…
              </>
            ) : (
              `Confirmar y crear ${rows.length === 1 ? "1 registro" : `${rows.length} registros`}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
