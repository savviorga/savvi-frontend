import { describe, expect, it } from "vitest";
import { DEFAULT_REDIRECT, safeRedirectUrl } from "./safe-redirect";

describe("safeRedirectUrl", () => {
  it("acepta rutas internas con query y hash", () => {
    expect(safeRedirectUrl("/savvi-ia")).toBe("/savvi-ia");
    expect(safeRedirectUrl("/budget/123?mes=10#detalle")).toBe("/budget/123?mes=10#detalle");
  });

  it.each([
    null,
    "",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/%5Cevil.com/../",
    "\\\\evil.com",
    "javascript:alert(1)",
    "/\tevil",
    "evil.com",
  ])("rechaza %s", (value) => {
    const result = safeRedirectUrl(value as string | null);
    expect(result.startsWith("/") && !result.startsWith("//")).toBe(true);
    expect(new URL(result, "https://savvi.co").origin).toBe("https://savvi.co");
    if (value !== "/%5Cevil.com/../") expect(result).toBe(DEFAULT_REDIRECT);
  });
});
