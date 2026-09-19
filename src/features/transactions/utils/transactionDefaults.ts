/**
 * Prellenado del formulario de creación: recuerda el contexto de la última
 * transacción guardada (fecha, tipo, cuenta y categoría) para no volver a
 * elegirlo en cada registro. Monto y descripción no se guardan: cambian siempre.
 *
 * Vive en localStorage, así que sobrevive a recargas y es por navegador/usuario.
 */

const STORAGE_KEY = "savvi_last_transaction";

export interface TransactionDefaults {
  date: string;
  type: string;
  /** id de la cuenta */
  account: string;
  /** id de la categoría */
  category: string;
}

export function loadTransactionDefaults(): TransactionDefaults | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<TransactionDefaults>;
    return {
      date: typeof data.date === "string" ? data.date : "",
      type: typeof data.type === "string" ? data.type : "",
      account: typeof data.account === "string" ? data.account : "",
      category: typeof data.category === "string" ? data.category : "",
    };
  } catch {
    return null;
  }
}

export function saveTransactionDefaults(defaults: TransactionDefaults): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  } catch {
    /* modo privado o storage lleno: el prellenado es opcional */
  }
}

export function clearTransactionDefaults(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignorar */
  }
}

/**
 * Descarta lo que ya no aplica: una cuenta o categoría borrada, o una categoría
 * que no corresponde al tipo recordado (ingreso ≠ egreso).
 */
export function resolveTransactionDefaults(
  defaults: TransactionDefaults | null,
  accounts: { id: string }[],
  categories: { id: string; type?: string }[],
): TransactionDefaults {
  const empty = { date: "", type: "", account: "", category: "" };
  if (!defaults) return empty;

  const account = accounts.some((a) => a.id === defaults.account)
    ? defaults.account
    : "";

  const category = categories.some(
    (c) =>
      c.id === defaults.category &&
      (!defaults.type ||
        defaults.type === "transferencia" ||
        (c.type ?? "egreso") === defaults.type),
  )
    ? defaults.category
    : "";

  return { date: defaults.date, type: defaults.type, account, category };
}
