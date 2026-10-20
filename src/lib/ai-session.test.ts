import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireSession } from "./ai-session";
import { OpenAIError } from "./openai";

const request = (authorization?: string) =>
  new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });

describe("requireSession", () => {
  beforeEach(() => {
    process.env.API_URL_INTERNAL = "http://backend.test";
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rechaza peticiones sin Bearer", async () => {
    await expect(requireSession(request())).rejects.toMatchObject({ status: 401 });
  });

  it("falla cerrado si el backend no responde", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    const result = requireSession(request("Bearer token-de-prueba-caido-123"));
    await expect(result).rejects.toBeInstanceOf(OpenAIError);
    await expect(result).rejects.toMatchObject({ status: 503 });
  });

  it("devuelve 401 si el backend rechaza el token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(requireSession(request("Bearer token-vencido-abcdefgh"))).rejects.toMatchObject({ status: 401 });
  });

  it("valida contra /auth/me y cachea la sesión", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ id: "user-1", name: "Ana", email: "a@b.co" }));
    const auth = "Bearer token-valido-1234567890";
    await expect(requireSession(request(auth))).resolves.toEqual({ authorization: auth, userId: "user-1" });
    await requireSession(request(auth));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://backend.test/auth/me");
  });
});
