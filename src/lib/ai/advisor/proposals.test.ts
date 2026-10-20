import { describe, expect, it } from "vitest";
import { checkProposal } from "./proposals";
import type { AdvisorCatalog } from "./snapshot";
import type { ChatAttachment, TransactionDraft } from "@/features/savvi-ia/types/proposal.types";

const catalog: AdvisorCatalog = {
  categories: [{ id: "cat-mercado", name: "Mercado", type: "egreso", parentId: null, isGroup: false }],
  accounts: [{ id: "acc-debito", name: "Bancolombia Débito", isCredit: false, isActive: true }],
  debts: [],
};

const receipt: ChatAttachment = {
  key: "users/u1/savvi-ia/abc-recibo.jpg",
  name: "recibo.jpg",
  mimeType: "image/jpeg",
  size: 2048,
  analysis: '{"total":45900}',
};

const row = (extra: Record<string, unknown>) => ({
  date: "2026-10-20",
  type: "egreso",
  amount: 45900,
  categoryId: "cat-mercado",
  accountId: "acc-debito",
  description: "Mercado en Éxito",
  ...extra,
});

describe("checkProposal – evidencias", () => {
  it("asocia la evidencia por id y la deja como soporte del movimiento", () => {
    const check = checkProposal(
      "proponer_transacciones",
      { mensaje: "Te lo registro", transacciones: [row({ evidencia: "e1" })] },
      catalog,
      [],
      "mercado con la débito",
      new Map([["E1", receipt]]),
    );
    const item = check.proposal?.items[0] as TransactionDraft;
    expect(item.evidence).toEqual({ key: receipt.key, name: "recibo.jpg", size: 2048 });
    expect(check.problems).toEqual([]);
  });

  it("una evidencia que no existe se avisa y el movimiento queda sin soporte", () => {
    const check = checkProposal(
      "proponer_transacciones",
      { mensaje: "", transacciones: [row({ evidencia: "E7" })] },
      catalog,
      [],
      "",
      new Map([["E1", receipt]]),
    );
    expect((check.proposal?.items[0] as TransactionDraft).evidence).toBeUndefined();
    expect(check.problems[0]).toMatch(/E7/);
  });

  it("los montos de una lista se verifican también contra lo leído de la evidencia", () => {
    const check = checkProposal(
      "proponer_transacciones",
      {
        mensaje: "",
        transacciones: [row({ amount: 12000 }), row({ amount: 33900 }), row({ amount: 99999 })],
      },
      catalog,
      [],
      "extracto\n[EVIDENCIA E1]\n{\"movimientos\":[{\"monto\":12000},{\"monto\":33900}]}",
    );
    const warnings = (check.proposal?.items as TransactionDraft[]).map((t) => Boolean(t.warning));
    expect(warnings).toEqual([false, false, true]);
  });
});
