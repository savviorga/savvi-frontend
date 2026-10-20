import { describe, expect, it } from "vitest";
import { addUsage, emptyUsage, priceFor, transcriptionUsage } from "./pricing";

describe("pricing", () => {
  it("usa el prefijo conocido más largo", () => {
    expect(priceFor("gpt-4o-mini-2024-07-18")?.input).toBe(0.15);
    expect(priceFor("gpt-4o-mini-transcribe")?.input).toBe(1.25);
    expect(priceFor("modelo-raro")).toBeNull();
  });

  it("descuenta los tokens de caché del precio de entrada", () => {
    const total = emptyUsage("gpt-4o-mini");
    addUsage(total, "gpt-4o-mini", { prompt_tokens: 1_000_000, completion_tokens: 0, prompt_tokens_details: { cached_tokens: 500_000 } });
    expect(total.costUsd).toBeCloseTo(0.5 * 0.15 + 0.5 * 0.075);
  });

  it("transcripción por tokens y por duración (whisper)", () => {
    expect(transcriptionUsage("gpt-4o-mini-transcribe", { type: "tokens", input_tokens: 1_000_000, output_tokens: 0 }).costUsd).toBeCloseTo(1.25);
    const whisper = transcriptionUsage("whisper-1", { type: "duration", seconds: 120 });
    expect(whisper.calls).toBe(1);
    expect(whisper.costUsd).toBeCloseTo(0.012);
  });
});
