import type { ChatMessage } from "../components/SavviIAMessageBubble";
import { EMPTY_USAGE, readTotals, type UsageTotals } from "./usage";

/**
 * Persistencia temporal del chat en localStorage, una conversación por usuario.
 * Cuando exista el endpoint en backend, esto se reemplaza por él: la forma
 * guardada (`StoredChat`) es la misma que se enviaría.
 */

const KEY_PREFIX = "savvi_ia_chat:";
/** Acumulado de todas las conversaciones; sobrevive a "Nueva conversación". */
const USAGE_KEY_PREFIX = "savvi_ia_usage:";
const VERSION = 1;
/** Suficiente para retomar el hilo sin crecer sin límite (el modelo solo ve los últimos 30). */
const MAX_STORED_MESSAGES = 200;

export interface StoredChat {
  version: number;
  /** Última actividad (ms): decide si el asesor saluda de nuevo al volver */
  updatedAt: number;
  messages: ChatMessage[];
  /** Tokens y costo de esta conversación */
  usage?: UsageTotals;
}

const keyFor = (userId: string) => `${KEY_PREFIX}${userId}`;

/**
 * Deja el mensaje listo para restaurarse: sin animación de escritura y sin
 * estados que solo tenían sentido mientras la página estaba abierta.
 */
function toRestorable(message: ChatMessage): ChatMessage | null {
  // El seguimiento de un archivo en proceso se corta al recargar.
  if (message.status === "queued" || message.status === "processing") return null;

  const restored: ChatMessage = { ...message, animate: false };
  if (restored.proposal?.status === "creating") {
    // No se sabe qué alcanzó a guardarse: se cierra para evitar duplicados al reconfirmar.
    restored.proposal = { ...restored.proposal, status: "dismissed" };
  }
  return restored;
}

export function loadChat(userId: string): StoredChat | null {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredChat;
    if (data?.version !== VERSION || !Array.isArray(data.messages)) return null;
    const messages = data.messages.flatMap((m) => {
      const restored = m && typeof m.text === "string" ? toRestorable(m) : null;
      return restored ? [restored] : [];
    });
    return messages.length ? { ...data, messages, usage: readTotals(data.usage) } : null;
  } catch {
    return null;
  }
}

export function saveChat(userId: string, messages: ChatMessage[], usage: UsageTotals): void {
  try {
    if (messages.length === 0) {
      localStorage.removeItem(keyFor(userId));
      return;
    }
    const data: StoredChat = {
      version: VERSION,
      updatedAt: Date.now(),
      messages: messages.slice(-MAX_STORED_MESSAGES),
      usage,
    };
    localStorage.setItem(keyFor(userId), JSON.stringify(data));
  } catch {
    // Almacenamiento lleno o bloqueado (modo privado): el chat sigue en memoria.
  }
}

export function clearChat(userId: string): void {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    /* sin acceso a localStorage */
  }
}

export function loadLifetimeUsage(userId: string): UsageTotals {
  try {
    const raw = localStorage.getItem(`${USAGE_KEY_PREFIX}${userId}`);
    return raw ? readTotals(JSON.parse(raw)) : EMPTY_USAGE;
  } catch {
    return EMPTY_USAGE;
  }
}

export function saveLifetimeUsage(userId: string, usage: UsageTotals): void {
  try {
    localStorage.setItem(`${USAGE_KEY_PREFIX}${userId}`, JSON.stringify(usage));
  } catch {
    /* sin acceso a localStorage */
  }
}

export function describeAbsence(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "una hora" : `${hours} horas`;
  const days = Math.round(hours / 24);
  return days === 1 ? "un día" : `${days} días`;
}
