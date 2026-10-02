"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Cuenta regresiva en segundos, p. ej. para habilitar "Reenviar código".
 * `initial` arranca ya corriendo (con un `Date.now()` tomado fuera del render).
 */
export function useCooldown(initial?: { startedAt: number; ms: number }) {
  const [until, setUntil] = useState(
    initial ? initial.startedAt + initial.ms : 0,
  );
  const [now, setNow] = useState(initial?.startedAt ?? 0);
  const secondsLeft = Math.max(0, Math.ceil((until - now) / 1000));

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, now]);

  const start = useCallback((ms: number) => {
    const startedAt = Date.now();
    setUntil(startedAt + ms);
    setNow(startedAt);
  }, []);

  return { secondsLeft, start };
}
