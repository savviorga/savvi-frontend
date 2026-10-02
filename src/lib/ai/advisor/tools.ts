/**
 * Herramientas (function calling) de Savvi IA.
 * - `consultar_*`: solo lectura; el servidor las ejecuta contra el backend.
 * - `proponer_*`: no ejecutan nada; terminan el turno con una tarjeta que el
 *   usuario revisa y confirma en el navegador.
 */

const nullable = (type: string, description: string) => ({ type: [type, "null"], description });
const ids = (description: string) => ({ type: "string", description });

const mensaje = {
  type: "string",
  description:
    "Mensaje corto y cercano que presenta la propuesta y dice qué va a pasar al confirmar. Sin repetir la lista.",
};

function tool(name: string, description: string, properties: Record<string, unknown>) {
  return {
    type: "function",
    function: {
      name,
      description,
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        required: Object.keys(properties),
        properties,
      },
    },
  } as const;
}

function listTool(name: string, description: string, listKey: string, itemProps: Record<string, unknown>) {
  return tool(name, description, {
    mensaje,
    [listKey]: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: Object.keys(itemProps),
        properties: itemProps,
      },
    },
  });
}

export const READ_TOOL_NAMES = [
  "consultar_transacciones",
  "consultar_presupuestos",
  "consultar_deudas",
  "consultar_pagos_recurrentes",
] as const;

export type ReadToolName = (typeof READ_TOOL_NAMES)[number];

export const PROPOSAL_TOOL_NAMES = [
  "proponer_categorias",
  "proponer_cuentas",
  "proponer_transacciones",
  "proponer_presupuestos",
  "proponer_deudas",
  "proponer_abono_deuda",
  "proponer_pagos_recurrentes",
] as const;

export type ProposalToolName = (typeof PROPOSAL_TOOL_NAMES)[number];

export const ADVISOR_TOOLS = [
  tool(
    "consultar_transacciones",
    "Busca transacciones del usuario con filtros y devuelve totales, gasto por categoría y las más recientes. Úsala para analizar hábitos, comparar periodos o encontrar un movimiento.",
    {
      desde: nullable("string", "Fecha inicial YYYY-MM-DD, o null."),
      hasta: nullable("string", "Fecha final YYYY-MM-DD, o null."),
      tipo: { type: ["string", "null"], enum: ["ingreso", "egreso", "transferencia", null] },
      categoriaId: nullable("string", "id de categoría del catálogo, o null."),
      cuentaId: nullable("string", "id de cuenta del catálogo, o null."),
      texto: nullable("string", "Texto a buscar en la descripción, o null."),
      limite: nullable("integer", "Cuántas transacciones listar (máx. 40). null = 15."),
    },
  ),
  tool(
    "consultar_presupuestos",
    "Presupuestos de un mes con lo gastado en cada categoría, lo que queda y el porcentaje usado.",
    {
      anio: { type: "integer", description: "Año, ej. 2026." },
      mes: { type: "integer", description: "Mes 1-12." },
    },
  ),
  tool("consultar_deudas", "Deudas del planificador con saldo, vencimiento y abonos.", {
    estado: { type: "string", enum: ["pendientes", "pagadas", "todas"] },
  }),
  tool(
    "consultar_pagos_recurrentes",
    "Plantillas de pagos recurrentes (arriendo, servicios, suscripciones…) y recordatorios pendientes.",
    {},
  ),

  listTool(
    "proponer_categorias",
    "Propone categorías de ingresos o egresos a crear.",
    "categorias",
    {
      name: { type: "string", description: "Nombre corto, máx. 100 caracteres." },
      type: { type: "string", enum: ["ingreso", "egreso"] },
      description: nullable("string", "Qué incluye, según el usuario."),
      color: { type: "string", description: "Color #RRGGBB distinto para cada categoría." },
      budgetLimit: nullable("number", "Presupuesto mensual en COP si el usuario lo mencionó, o null."),
    },
  ),
  listTool("proponer_cuentas", "Propone cuentas bancarias, billeteras o tarjetas a crear.", "cuentas", {
    name: { type: "string", description: "Nombre visible, ej. 'Bancolombia Ahorros'." },
    description: { type: "string", description: "Para qué la usa." },
    initialBalance: nullable("number", "Saldo actual en COP, o null."),
    isCredit: { type: "boolean", description: "true si es tarjeta de crédito." },
    creditLimit: nullable("number", "Cupo de la tarjeta, o null."),
    statementDay: nullable("integer", "Día de corte 1-31, o null."),
    dueDay: nullable("integer", "Día límite de pago 1-31, o null."),
  }),
  listTool(
    "proponer_transacciones",
    "Propone registrar ingresos o gastos que el usuario te contó. Si te pasó una lista o tabla, incluye TODAS sus filas en esta misma llamada (hasta 100); la tarjeta es la única confirmación.",
    "transacciones",
    {
      date: { type: "string", description: "Fecha YYYY-MM-DD." },
      type: { type: "string", enum: ["ingreso", "egreso"] },
      amount: { type: "number", description: "Monto positivo en COP." },
      categoryId: ids("id de una categoría del catálogo cuyo tipo coincida con type."),
      accountId: ids("id de una cuenta del catálogo."),
      description: nullable("string", "Descripción corta, o null."),
    },
  ),
  listTool(
    "proponer_presupuestos",
    "Propone crear o ajustar presupuestos mensuales por categoría (si ya existe para ese mes, se actualiza).",
    "presupuestos",
    {
      categoryId: ids("id de una categoría de egreso del catálogo."),
      amount: { type: "number", description: "Monto mensual en COP." },
      year: { type: "integer", description: "Año." },
      month: { type: "integer", description: "Mes 1-12." },
    },
  ),
  listTool("proponer_deudas", "Propone registrar deudas u obligaciones en el planificador.", "deudas", {
    name: { type: "string", description: "Nombre, ej. 'Crédito libre inversión'." },
    payee: { type: "string", description: "A quién se le debe." },
    totalAmount: { type: "number", description: "Monto total en COP." },
    dueDate: { type: "string", description: "Fecha límite YYYY-MM-DD." },
    accountId: ids("id de la cuenta con la que se paga."),
    notes: nullable("string", "Notas, o null."),
    isRecurring: { type: "boolean", description: "true si se paga en cuotas periódicas." },
    recurrenceType: { type: ["string", "null"], enum: ["monthly", "biweekly", null] },
    recurrenceDay: nullable("integer", "Día de pago 1-31 si es recurrente, o null."),
  }),
  listTool(
    "proponer_abono_deuda",
    "Propone registrar un abono a una deuda pendiente. Crea también la transacción del pago.",
    "abonos",
    {
      debtId: ids("id de una deuda pendiente."),
      amount: { type: "number", description: "Monto del abono en COP." },
      accountId: ids("id de la cuenta desde la que se pagó."),
      categoryId: ids("id de una categoría de egreso para el pago."),
      paidAt: nullable("string", "Fecha YYYY-MM-DD, o null para hoy."),
      description: nullable("string", "Descripción, o null."),
    },
  ),
  listTool(
    "proponer_pagos_recurrentes",
    "Propone crear plantillas de pagos recurrentes (arriendo, servicios, suscripciones).",
    "pagos",
    {
      name: { type: "string", description: "Nombre, ej. 'Arriendo'." },
      payeeName: { type: "string", description: "A quién se le paga." },
      fromAccountId: ids("id de la cuenta desde la que se paga."),
      initialAmount: nullable("number", "Monto habitual en COP, o null."),
      recurrenceType: {
        type: "string",
        enum: ["reminder", "automatic"],
        description: "reminder = solo recordar; automatic = registrar solo. Por defecto reminder.",
      },
      frequency: { type: "string", enum: ["weekly", "biweekly", "monthly", "bimonthly"] },
      dayOfMonth: { type: "integer", description: "Día del mes 1-28." },
      payeeBank: nullable("string", "Banco del beneficiario, o null."),
    },
  ),
] as const;

const CHART_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["tipo", "titulo", "subtitulo", "etiquetas", "series", "formato"],
  properties: {
    tipo: {
      type: "string",
      enum: ["barras", "barras_horizontales", "dona", "linea", "progreso", "indicadores"],
      description:
        "barras: comparar pocos periodos o categorías; barras_horizontales: ranking de categorías; dona: partes de un total (máx. 6); linea: tendencia en el tiempo; progreso: presupuestos (serie 1 gastado, serie 2 límite); indicadores: 2 a 4 cifras clave.",
    },
    titulo: { type: "string", description: "Título corto que dice qué muestra." },
    subtitulo: nullable("string", "Periodo o aclaración, o null."),
    etiquetas: { type: "array", items: { type: "string" }, description: "Una por barra, porción, punto o tarjeta (máx. 12)." },
    series: {
      type: "array",
      description: "1 a 3 series; cada una con un valor por etiqueta, en el mismo orden.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["nombre", "valores"],
        properties: {
          nombre: { type: "string" },
          valores: { type: "array", items: { type: "number" } },
        },
      },
    },
    formato: { type: "string", enum: ["moneda", "porcentaje", "numero"] },
  },
} as const;

/** Respuesta final: burbujas cortas (markdown + gráfico opcional) + respuestas rápidas. */
export const REPLY_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "respuesta_asesor",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["mensajes", "sugerencias"],
      properties: {
        mensajes: {
          type: "array",
          description: "1 a 3 mensajes cortos, como los enviaría una persona por chat.",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["texto", "grafico"],
            properties: {
              texto: { type: "string", description: "Texto del mensaje en markdown." },
              grafico: { anyOf: [CHART_SCHEMA, { type: "null" }] },
            },
          },
        },
        sugerencias: {
          type: "array",
          description: "0 a 3 respuestas rápidas que el usuario podría tocar, escritas en su voz (máx. 40 caracteres).",
          items: { type: "string" },
        },
      },
    },
  },
} as const;
