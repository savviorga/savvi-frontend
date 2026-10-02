"use client";

import { useEffect, useState } from "react";

/** Anima un número desde 0 hasta `target` (ease-out). Respeta prefers-reduced-motion. */
export function useCountUp(target: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = reduced ? 0 : duration;

    let frame = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const t = total === 0 ? 1 : Math.min((now - start) / total, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    const timeout = window.setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, reduced ? 0 : delay);

    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [target, duration, delay]);

  return value;
}
