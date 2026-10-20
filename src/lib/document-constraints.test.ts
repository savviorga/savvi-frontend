import { describe, expect, it } from "vitest";
import { fileMimeType, normalizeMimeType, validateDocumentFile } from "./document-constraints";

describe("document-constraints", () => {
  it("quita los parámetros del MIME que agrega MediaRecorder", () => {
    expect(normalizeMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(normalizeMimeType("Audio/OGG; codecs=opus")).toBe("audio/ogg");
  });

  it("acepta una nota de voz de Chrome y deduce el tipo por extensión si falta", () => {
    const voice = new File([new Uint8Array(2000)], "nota.webm", { type: "audio/webm;codecs=opus" });
    expect(validateDocumentFile(voice)).toBeNull();
    const noType = new File([new Uint8Array(10)], "factura.PDF", { type: "" });
    expect(fileMimeType(noType)).toBe("application/pdf");
    expect(validateDocumentFile(new File(["x"], "virus.exe", { type: "" }))).toMatch(/no permitido/);
  });
});
