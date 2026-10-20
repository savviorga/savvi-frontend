import { beforeEach, describe, expect, it, vi } from "vitest";

const bulk = vi.fn();
const create = vi.fn();
const confirmUpload = vi.fn();
vi.mock("@/features/transactions/services/transaction.service", () => ({
  TransactionService: { bulk, create, confirmUpload },
}));

import type { ProposalItemResult } from "../types/proposal.types";

const { describeResultsForModel, executeSelectedItems, toItemViews, toProposal } = await import("./proposals");

const draft = (amount: number, withEvidence: boolean) => ({
  date: "2026-10-20",
  type: "egreso" as const,
  amount,
  categoryId: "cat",
  categoryName: "Mercado",
  accountId: "acc",
  accountName: "Débito",
  description: `Compra ${amount}`,
  evidence: withEvidence ? { key: "users/u1/savvi-ia/abc-recibo.jpg", name: "recibo.jpg", size: 2048 } : undefined,
});

describe("propuestas con evidencia", () => {
  beforeEach(() => {
    bulk.mockReset();
    create.mockReset();
    confirmUpload.mockReset();
  });

  it("al confirmar crea las transacciones y adjunta la evidencia a cada una", async () => {
    bulk.mockResolvedValue([{ id: "tx-1" }, { id: "tx-2" }]);
    confirmUpload.mockResolvedValue(undefined);
    const proposal = toProposal({ kind: "transactions", items: [draft(45900, true), draft(1000, false)] });
    const results: unknown[] = [];
    await executeSelectedItems(proposal, (index, result) => (results[index] = result));

    expect(confirmUpload).toHaveBeenCalledTimes(1);
    expect(confirmUpload).toHaveBeenCalledWith("tx-1", [{ key: "users/u1/savvi-ia/abc-recibo.jpg", name: "recibo.jpg", size: 2048 }]);
    expect(results).toEqual([{ ok: true }, { ok: true }]);
  });

  it("si no se puede adjuntar, la transacción queda registrada con una nota", async () => {
    bulk.mockResolvedValue([{ id: "tx-1" }]);
    confirmUpload.mockRejectedValue({ message: "El archivo no se encontró", error: "Bad Request", statusCode: 400 });
    const proposal = toProposal({ kind: "transactions", items: [draft(45900, true)] });
    const results: ProposalItemResult[] = [];
    await executeSelectedItems(proposal, (index, result) => (results[index] = result));

    expect(results[0]).toMatchObject({ ok: true, note: expect.stringMatching(/no se pudo adjuntar recibo\.jpg/) });
    const summary = describeResultsForModel({ ...proposal, status: "done", results });
    expect(summary).toMatch(/no se pudo adjuntar/);
  });

  it("la tarjeta muestra el soporte", () => {
    const [view] = toItemViews({ kind: "transactions", items: [draft(45900, true)] });
    expect(view.attachment).toBe("recibo.jpg");
  });
});
