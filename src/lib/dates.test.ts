import { describe, expect, it, vi } from "vitest";
import { formatLocalDate, formatMonthKey, parseLocalDate, toLocalISODate, todayLocalISO } from "./dates";

// Estas pruebas corren con TZ=America/Bogota (ver package.json): ahí se notaba el bug.
describe("dates", () => {
  it("corre en hora de Colombia", () => {
    expect(new Date("2026-10-01").getDate()).toBe(30); // el bug original
  });

  it("una fecha YYYY-MM-DD conserva su día", () => {
    expect(parseLocalDate("2026-10-01").getDate()).toBe(1);
    expect(parseLocalDate("2026-12-01T00:00:00.000Z").getDate()).toBe(1);
    expect(formatLocalDate("2026-10-20")).toBe("20 oct 2026");
  });

  it("el mes de un gráfico no se corre al anterior", () => {
    expect(formatMonthKey("2026-10")).toBe("oct 2026");
  });

  it("hoy a las 9 p. m. sigue siendo hoy", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T02:00:00Z")); // 20-oct 21:00 en Bogotá
    expect(todayLocalISO()).toBe("2026-10-20");
    expect(toLocalISODate(new Date())).toBe("2026-10-20");
    vi.useRealTimers();
  });
});
