/**
 * Datos de los bloques interactivos que comparten servidor y navegador
 * (sin dependencias de React ni de Node).
 */
import type {
  AdvisorAlertTone,
  AdvisorBlock,
  AdvisorDestination,
  AdvisorOptionIcon,
} from "../types/proposal.types";

export const OPTION_ICONS: AdvisorOptionIcon[] = [
  "gasto",
  "ingreso",
  "ahorro",
  "presupuesto",
  "deuda",
  "meta",
  "calendario",
  "tarjeta",
  "grafico",
  "pregunta",
];

export const ALERT_TONES: AdvisorAlertTone[] = ["peligro", "advertencia", "exito", "info"];

/** Única forma de que un atajo navegue: el modelo nunca da URLs. */
export const DESTINATIONS: Record<AdvisorDestination, { href: string; label: string }> = {
  transacciones: { href: "/transactions", label: "Transacciones" },
  presupuestos: { href: "/budget", label: "Presupuestos" },
  pagos_recurrentes: { href: "/pagos-recurrentes", label: "Transferencias" },
  planificador: { href: "/planificador", label: "Planificador" },
  categorias: { href: "/categories", label: "Categorías" },
  cuentas: { href: "/accounts", label: "Cuentas" },
  dashboard: { href: "/dashboard", label: "Dashboard" },
};

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Cómo ve el modelo un bloque en el historial (el historial es texto). Incluye
 * lo que el usuario respondió, para que no vuelva a preguntar lo mismo.
 */
export function describeBlockForModel(block: AdvisorBlock, answer?: string): string {
  const answered = answer ? ` El usuario respondió: "${answer}".` : " Aún sin respuesta.";
  switch (block.type) {
    case "options":
      return `[Mostraste opciones${block.question ? ` ("${block.question}")` : ""}: ${block.options
        .map((o) => o.text)
        .join(" | ")}.${answered}]`;
    case "alert":
      return `[Mostraste un aviso (${block.tone}): ${block.title}]`;
    case "simulator":
      return `[Mostraste un simulador de ahorro "${block.title}" con meta de ${money(block.goal)}.${answered}]`;
    case "shortcuts":
      return `[Mostraste atajos a: ${block.buttons.map((b) => DESTINATIONS[b.destination].label).join(", ")}]`;
  }
}
