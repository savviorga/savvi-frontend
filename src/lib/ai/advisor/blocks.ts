/**
 * Valida el bloque interactivo que el modelo adjunta a un mensaje. Si no cumple
 * la forma (tipo conocido, textos y montos dentro de límites, destinos de la
 * lista cerrada) se descarta y el mensaje llega solo con texto. Solo servidor.
 */

import type { AdvisorBlock, AdvisorDestination } from "@/features/savvi-ia/types/proposal.types";
import { ALERT_TONES, DESTINATIONS, OPTION_ICONS } from "@/features/savvi-ia/utils/blocks";

const MAX_OPTIONS = 6;
const MAX_SHORTCUTS = 3;
/** Tope del simulador: evita sliders absurdos si el modelo exagera. */
const MAX_AMOUNT = 10_000_000_000;

const text = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

const amount = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= MAX_AMOUNT ? Math.round(n) : undefined;
};

/** Paso del slider redondo según la escala del monto. */
const roundTo = (value: number, max: number) => {
  const step = max >= 5_000_000 ? 100_000 : max >= 500_000 ? 10_000 : 1_000;
  return Math.max(step, Math.round(value / step) * step);
};

export function sanitizeBlock(raw: unknown): AdvisorBlock | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const source = raw as Record<string, unknown>;

  switch (source.tipo) {
    case "opciones": {
      const seen = new Set<string>();
      const options = (Array.isArray(source.opciones) ? source.opciones : [])
        .map((o) => {
          const item = (o ?? {}) as Record<string, unknown>;
          const label = text(item.texto, 40);
          if (!label || seen.has(label.toLowerCase())) return null;
          seen.add(label.toLowerCase());
          return {
            text: label,
            description: text(item.descripcion, 90),
            icon: OPTION_ICONS.find((i) => i === item.icono) ?? "pregunta",
          };
        })
        .filter((o): o is NonNullable<typeof o> => o !== null)
        .slice(0, MAX_OPTIONS);
      if (options.length < 2) return undefined;
      return {
        type: "options",
        question: text(source.pregunta, 120),
        multiple: source.multiple === true,
        options,
      };
    }

    case "alerta": {
      const title = text(source.titulo, 120);
      const tone = ALERT_TONES.find((t) => t === source.tono);
      if (!title || !tone) return undefined;
      return { type: "alert", tone, title, detail: text(source.detalle, 240) };
    }

    case "simulador": {
      const title = text(source.titulo, 80);
      const goal = amount(source.meta);
      const saved = amount(source.ahorro_actual) ?? 0;
      let min = amount(source.aporte_min);
      let max = amount(source.aporte_max);
      if (!title || !goal || saved >= goal || min === undefined || !max || min >= max) return undefined;
      min = roundTo(min, max);
      max = roundTo(max, max);
      if (min >= max) return undefined;
      const suggested = Math.min(max, Math.max(min, roundTo(amount(source.aporte_sugerido) ?? min, max)));
      return { type: "simulator", title, goal, saved, suggested, min, max };
    }

    case "atajos": {
      const buttons = (Array.isArray(source.botones) ? source.botones : [])
        .map((b) => {
          const item = (b ?? {}) as Record<string, unknown>;
          const label = text(item.texto, 40);
          const destination = Object.keys(DESTINATIONS).find((d) => d === item.destino) as
            | AdvisorDestination
            | undefined;
          return label && destination ? { text: label, destination } : null;
        })
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .slice(0, MAX_SHORTCUTS);
      return buttons.length ? { type: "shortcuts", buttons } : undefined;
    }

    default:
      return undefined;
  }
}
