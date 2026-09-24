/**
 * Lógica compartida por los route handlers que extraen movimientos de texto
 * libre (`/api/ai/parse-transaction` y `/api/ai/parse-transactions`).
 * **Solo servidor**: se usa desde `app/api/**`.
 */

export const TRANSACTION_TYPES = ["ingreso", "egreso", "transferencia"] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const MAX_CATALOG_ITEMS = 300;

export interface CatalogCategory {
  id: string;
  name: string;
  type?: string;
}

export interface CatalogAccount {
  id: string;
  name: string;
}

/** Lo que devuelve el modelo; cada campo es null si no se dedujo del texto. */
export interface DetectedTransaction {
  type: TransactionType | null;
  amount: number | null;
  date: string | null;
  categoryId: string | null;
  accountId: string | null;
  description: string | null;
}

/** Lo que pide el schema: añade la cita que justifica la fecha. */
export interface ModelOutput extends DetectedTransaction {
  dateEvidence: string | null;
}

export interface ChatCompletion {
  choices?: { message?: { content?: string } }[];
}

/** Propiedades de un movimiento en el schema de salida estructurada. */
export const TRANSACTION_SCHEMA_PROPERTIES = {
  type: {
    type: ["string", "null"],
    enum: [...TRANSACTION_TYPES, null],
    description: "Tipo de movimiento, o null si no se puede deducir.",
  },
  amount: {
    type: ["number", "null"],
    description: "Monto positivo en pesos, sin separadores.",
  },
  date: {
    type: ["string", "null"],
    description: "Fecha en formato YYYY-MM-DD, o null si no se menciona.",
  },
  dateEvidence: {
    type: ["string", "null"],
    description:
      "Palabras textuales del usuario que dicen CUÁNDO ocurrió (hoy, ayer, el lunes pasado, el 15 de marzo). No sirve el período facturado como 'el arriendo de septiembre'. null si no lo dijo.",
  },
  categoryId: {
    type: ["string", "null"],
    description: "id exacto de una categoría de la lista, o null.",
  },
  accountId: {
    type: ["string", "null"],
    description: "id exacto de una cuenta de la lista, o null.",
  },
  description: {
    type: ["string", "null"],
    description:
      "Descripción detallada del movimiento en español, con todo el contexto que dio el usuario.",
  },
} as const;

export const TRANSACTION_SCHEMA_REQUIRED = [
  "type",
  "amount",
  "date",
  "dateEvidence",
  "categoryId",
  "accountId",
  "description",
] as const;

/** Hoy en Colombia: el servidor puede estar en otra zona horaria. */
export function todayInBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Día de la semana de hoy; sin él el modelo calcula mal "el lunes pasado". */
export function weekdayInBogota(): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
  }).format(new Date());
}

/**
 * Últimos días con su nombre. Con esta tabla el modelo resuelve "el lunes pasado"
 * buscando, en vez de haciendo aritmética de calendario (que falla a menudo).
 */
export function recentDaysReference(days = 10): string {
  const formatDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const formatWeekday = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
  });

  const lines: string[] = [];
  for (let i = 1; i <= days; i++) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const label = i === 1 ? " (ayer)" : i === 2 ? " (antier)" : "";
    lines.push(`- ${formatDate.format(day)} = ${formatWeekday.format(day)}${label}`);
  }
  return lines.join("\n");
}

/** Bloque de contexto común: hoy, días recientes y catálogos del usuario. */
export function buildContextBlock(
  categories: CatalogCategory[],
  accounts: CatalogAccount[],
): string[] {
  const today = `${todayInBogota()} (${weekdayInBogota()})`;

  const categoryList = categories.length
    ? categories
        .map((c) => `- ${c.id} | ${c.name} | tipo: ${c.type ?? "egreso"}`)
        .join("\n")
    : "(el usuario no tiene categorías)";

  const accountList = accounts.length
    ? accounts.map((a) => `- ${a.id} | ${a.name}`).join("\n")
    : "(el usuario no tiene cuentas)";

  return [
    `HOY es ${today}, zona horaria America/Bogota.`,
    "DÍAS ANTERIORES (para resolver 'el lunes pasado', 'antier', etc.):",
    recentDaysReference(),
    "",
    "CATEGORÍAS DISPONIBLES (id | nombre | tipo):",
    categoryList,
    "",
    "CUENTAS DISPONIBLES (id | nombre):",
    accountList,
  ];
}

/** Reglas de extracción campo por campo, idénticas para uno o varios movimientos. */
export const EXTRACTION_RULES = [
  "1. Devuelve null en todo dato que no esté claro en el texto. No inventes ni completes por defecto.",
  "2. type: 'egreso' si gastó, pagó o compró; 'ingreso' si recibió, le pagaron o vendió; 'transferencia' si movió plata entre sus cuentas.",
  "3. amount: número positivo sin puntos ni símbolos. Interpreta el habla coloquial: '45 mil' = 45000, 'dos lucas' = 2000, 'un millón y medio' = 1500000, '20 k' = 20000.",
  "4. date: fecha en que OCURRIÓ el movimiento (YYYY-MM-DD), resolviendo expresiones relativas contra HOY. En dateEvidence copia las palabras textuales del usuario que indican ese momento (hoy, ayer, el lunes pasado, el 15 de marzo).",
  "4b. Un período o concepto NO es la fecha: en 'el arriendo de septiembre' o 'la factura de agosto', septiembre y agosto son el período facturado, no cuándo se pagó. Si el usuario no dijo cuándo ocurrió, date y dateEvidence son null: no asumas que fue hoy.",
  "5. categoryId y accountId: usa EXACTAMENTE un id de las listas de arriba, el que mejor corresponda. Si ninguno corresponde con claridad, devuelve null. La categoría debe coincidir con el tipo del movimiento.",
  "6. description: redacta una descripción DETALLADA en primera persona (1 a 3 frases, hasta 400 caracteres) que conserve TODO lo que el usuario contó: qué compró o pagó, comercio o lugar, persona o empresa involucrada, motivo, medio de pago, cuotas, plazos, desgloses, saldos pendientes y observaciones.",
  "7. PROHIBIDO agregar en description cualquier dato que el usuario no haya dicho (productos, lugares, motivos, medios de pago) y PROHIBIDO comentar lo que falta (nada de 'no mencionó el monto'). Si el usuario dio poca información, la descripción será breve: únicamente lo que dijo.",
  "8. Escribe la descripción en español correcto: limpia muletillas, titubeos y repeticiones del habla (eh, o sea, este...), pero sin recortar información. Empieza con mayúscula.",
];

/**
 * Palabras que delatan un concepto o período facturado, no el momento del
 * movimiento: "el arriendo de septiembre" no dice cuándo se pagó.
 */
const TIME_WORDS = [
  "hoy",
  "ayer",
  "anteayer",
  "antier",
  "anoche",
  "madrugada",
  "manana",
  "tarde",
  "noche",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "setiembre",
  "octubre",
  "noviembre",
  "diciembre",
  "semana",
  "mes",
  "ano",
  "dia",
  "hace",
  "pasado",
  "pasada",
  "finde",
];

const CONCEPT_WORDS = [
  "arriendo",
  "alquiler",
  "factura",
  "recibo",
  "cuota",
  "mensualidad",
  "suscripcion",
  "servicio",
  "nomina",
  "sueldo",
  "salario",
  "plan",
  "poliza",
  "seguro",
  "matricula",
  "pension",
];

/** El backend acepta 500 caracteres: se corta en la última palabra completa. */
export function clampDescription(value: string): string {
  const MAX = 500;
  if (value.length <= MAX) return value;
  const cut = value.slice(0, MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > MAX * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Minúsculas y sin tildes, para comparar la cita con el texto original. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function sanitizeTransaction(
  raw: Partial<ModelOutput>,
  text: string,
  categories: CatalogCategory[],
  accounts: CatalogAccount[],
  /**
   * Fecha que el usuario ya tenía en esa fila (edición por chat): si la cita no
   * aparece en el mensaje nuevo pero el modelo repite esa misma fecha, se conserva.
   */
  previousDate?: string | null,
): DetectedTransaction {
  const type =
    typeof raw.type === "string" &&
    (TRANSACTION_TYPES as readonly string[]).includes(raw.type)
      ? (raw.type as TransactionType)
      : null;

  const amountValue = typeof raw.amount === "number" ? raw.amount : NaN;
  const amount =
    Number.isFinite(amountValue) && amountValue > 0
      ? Math.round(amountValue * 100) / 100
      : null;

  // La fecha solo vale si el modelo puede citar dónde la dijo el usuario, y esa
  // cita existe de verdad en el texto: si no, se asumió y se descarta.
  const evidence =
    typeof raw.dateEvidence === "string" ? raw.dateEvidence.trim() : "";
  const normalizedEvidence = normalize(evidence);
  const mentionsTime =
    /\d/.test(normalizedEvidence) ||
    TIME_WORDS.some((word) => normalizedEvidence.includes(word));

  const evidenceIsReal =
    evidence.length > 0 &&
    normalize(text).includes(normalizedEvidence) &&
    mentionsTime &&
    !CONCEPT_WORDS.some((word) => normalizedEvidence.includes(word));

  const isIsoDate =
    typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date);

  let date: string | null = null;
  if (evidenceIsReal && isIsoDate) {
    const parsed = new Date(`${raw.date as string}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) date = raw.date as string;
  } else if (isIsoDate && previousDate && raw.date === previousDate) {
    // No es un dato nuevo: es la fecha que ya estaba en la fila.
    date = previousDate;
  }

  // El modelo solo puede elegir ids existentes: si inventa uno, se descarta.
  const category = categories.find((c) => c.id === raw.categoryId) ?? null;
  const categoryMatchesType =
    !category || !type || type === "transferencia"
      ? true
      : (category.type ?? "egreso") === type;

  const accountId = accounts.some((a) => a.id === raw.accountId)
    ? (raw.accountId as string)
    : null;

  const description =
    typeof raw.description === "string" && raw.description.trim()
      ? clampDescription(raw.description.trim())
      : null;

  return {
    type,
    amount,
    date,
    categoryId: category && categoryMatchesType ? category.id : null,
    accountId,
    description,
  };
}

export function readCatalog<T extends { id: unknown }>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is T => Boolean(item) && typeof (item as T).id === "string")
    .slice(0, MAX_CATALOG_ITEMS);
}
