import type { Options as ConfettiOptions } from "canvas-confetti";

/**
 * Confeti de celebración al unirse a la lista (solo cliente; import dinámico).
 */
export async function celebrateWaitingListJoin(): Promise<void> {
  if (typeof window === "undefined") return;

  const confetti = (await import("canvas-confetti")).default;

  const colors = [
    "#00d4aa",
    "#2dd4bf",
    "#22d3ee",
    "#fbbf24",
    "#a78bfa",
    "#fb7185",
    "#ffffff",
  ];

  const fire = (opts: ConfettiOptions) => {
    confetti({
      ...opts,
      colors: opts.colors ?? colors,
    });
  };

  fire({
    particleCount: 200,
    spread: 100,
    origin: { x: 0.5, y: 0.58 },
    ticks: 420,
    gravity: 0.92,
    scalar: 1.08,
    drift: 0.02,
  });

  window.setTimeout(() => {
    fire({
      particleCount: 90,
      angle: 60,
      spread: 58,
      origin: { x: 0, y: 0.68 },
    });
    fire({
      particleCount: 90,
      angle: 120,
      spread: 58,
      origin: { x: 1, y: 0.68 },
    });
  }, 180);

  window.setTimeout(() => {
    fire({
      particleCount: 120,
      startVelocity: 38,
      spread: 360,
      ticks: 180,
      origin: { x: 0.5, y: 0.32 },
      gravity: 1.1,
    });
  }, 350);
}
