import { describe, expect, it } from "vitest";
import { readMessages, toModelTurns } from "./conversation";
import { compactAnalysis } from "@/lib/ai/evidence";

const userId = "u1";
const evidence = (name: string, extra: Record<string, unknown> = {}) => ({
  key: `users/${userId}/savvi-ia/abc-${name}`,
  name,
  mimeType: "image/jpeg",
  size: 2048,
  ...extra,
});

describe("readMessages", () => {
  it("acepta un mensaje del usuario que solo trae evidencia", () => {
    const turns = readMessages([{ role: "user", content: "", attachments: [evidence("recibo.jpg")] }], userId);
    expect(turns).toHaveLength(1);
    expect(turns[0].attachments?.[0].name).toBe("recibo.jpg");
  });

  it("descarta adjuntos ajenos, de otro tipo o sin tamaño válido", () => {
    const [turn] = readMessages(
      [
        {
          role: "user",
          content: "gasté esto",
          attachments: [
            evidence("ok.jpg"),
            { ...evidence("ajeno.jpg"), key: "users/otro/savvi-ia/x.jpg" },
            { ...evidence("transacciones.jpg"), key: `users/${userId}/transactions/x.jpg` },
            { ...evidence("salto.jpg"), key: `users/${userId}/savvi-ia/../../otro/x.jpg` },
            evidence("audio.webm", { mimeType: "audio/webm" }),
            evidence("gigante.jpg", { size: 50 * 1024 * 1024 }),
          ],
        },
      ],
      userId,
    );
    expect(turn.attachments?.map((a) => a.name)).toEqual(["ok.jpg"]);
  });

  it("el asesor no puede traer adjuntos", () => {
    const [turn] = readMessages([{ role: "assistant", content: "hola", attachments: [evidence("x.jpg")] }], userId);
    expect(turn.attachments).toBeUndefined();
  });
});

describe("toModelTurns", () => {
  it("numera las evidencias en orden e incluye su lectura bajo el texto", () => {
    const { turns, evidence: byId } = toModelTurns([
      { role: "user", content: "mercado con la débito", attachments: [evidence("a.jpg", { analysis: '{"total":45900}' })] },
      { role: "assistant", content: "listo" },
      { role: "user", content: "", attachments: [evidence("b.pdf", { mimeType: "application/pdf" })] },
    ]);
    expect([...byId.keys()]).toEqual(["E1", "E2"]);
    expect(turns[0].content).toContain("mercado con la débito");
    expect(turns[0].content).toContain("[EVIDENCIA E1 · a.jpg");
    expect(turns[0].content).toContain('{"total":45900}');
    expect(turns[2].content).toContain("adjuntó evidencia sin escribir nada");
    expect(turns[2].content).toContain('"legible":false');
  });
});

describe("compactAnalysis", () => {
  it("quita nulos y listas vacías", () => {
    const json = compactAnalysis(
      JSON.stringify({ tipo: "recibo", legible: true, comercio: "Éxito", fecha: null, total: 45900, items: [], movimientos: [] }),
    );
    expect(JSON.parse(json)).toEqual({ tipo: "recibo", legible: true, comercio: "Éxito", total: 45900 });
  });

  it("marca como ilegible una respuesta que no es JSON", () => {
    expect(JSON.parse(compactAnalysis("no-json")).legible).toBe(false);
  });
});

describe("asksPermissionToRegister", () => {
  it("detecta cuando pide permiso para registrar", async () => {
    const { asksPermissionToRegister } = await import("./conversation");
    expect(asksPermissionToRegister(["¿Te parece bien que lo registre así?"])).toBe(true);
    expect(asksPermissionToRegister(["Listo.", "¿Confirmamos el registro?"])).toBe(true);
    expect(asksPermissionToRegister(["¿Quieres que lo registre con la débito?"])).toBe(true);
    expect(asksPermissionToRegister(["Lo registro en Mercado. ¿Todo bien con eso?"])).toBe(true);
    expect(asksPermissionToRegister(["¿Cuál monto prefieres registrar, 50 mil o 71.850?"])).toBe(false);
    expect(asksPermissionToRegister(["¿Con qué cuenta pagaste?"])).toBe(false);
  });

  it("isPaymentEvidence solo con soportes legibles de pago", async () => {
    const { isPaymentEvidence } = await import("./conversation");
    const base = { key: "k", name: "n", mimeType: "image/png", size: 1 };
    expect(isPaymentEvidence({ ...base, analysis: '{"tipo":"factura","legible":true}' })).toBe(true);
    expect(isPaymentEvidence({ ...base, analysis: '{"tipo":"no_es_soporte","legible":true}' })).toBe(false);
    expect(isPaymentEvidence({ ...base, analysis: '{"legible":false,"error":"x"}' })).toBe(false);
  });
});

describe("userAmountContradictsEvidence", () => {
  it("solo cuando el usuario dice un monto distinto al total leído", async () => {
    const { userAmountContradictsEvidence } = await import("./conversation");
    const factura = [{ key: "k", name: "n", mimeType: "image/png", size: 1, analysis: '{"tipo":"factura","legible":true,"total":71850}' }];
    expect(userAmountContradictsEvidence("me gasté 50 mil en el mercado", factura)).toBe(true);
    expect(userAmountContradictsEvidence("pagué 71.850 en el mercado", factura)).toBe(false);
    expect(userAmountContradictsEvidence("pagué el mercado con la débito", factura)).toBe(false);
  });
});
