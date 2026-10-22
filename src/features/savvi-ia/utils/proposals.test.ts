import { beforeEach, describe, expect, it, vi } from "vitest";

const bulk = vi.fn();
const create = vi.fn();
const confirmUpload = vi.fn();
const createCategory = vi.fn();
const createAccount = vi.fn();
vi.mock("@/features/transactions/services/transaction.service", () => ({
  TransactionService: { bulk, create, confirmUpload },
}));
vi.mock("@/features/categories/services/category.service", () => ({ CategoryService: { create: createCategory } }));
vi.mock("@/features/accounts/services/account.service", () => ({ AccountService: { create: createAccount } }));

import type { ProposalItemResult } from "../types/proposal.types";
import { toProposalData } from "./plan";

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

/** "Gasté 35 mil en Uber con Nequi" sin Nequi ni Transporte. */
const uberPlan = () =>
  toProposal(
    toProposalData([
      { kind: "categories", draft: { ref: "nueva:Transporte", name: "Transporte", type: "egreso" } },
      {
        kind: "categories",
        draft: { ref: "nueva:Transporte › Uber", name: "Uber", type: "egreso", parentId: "nueva:Transporte", parentName: "Transporte" },
      },
      { kind: "accounts", draft: { ref: "nueva:Nequi", name: "Nequi", description: "" } },
      {
        kind: "transactions",
        draft: { ...draft(35000, false), categoryId: "nueva:Transporte › Uber", accountId: "nueva:Nequi", accountName: "Nequi" },
      },
    ]),
  );

describe("propuesta combinada", () => {
  beforeEach(() => {
    bulk.mockReset();
    createCategory.mockReset();
    createAccount.mockReset();
    createCategory.mockImplementation(async (payload: { parentId?: string }) => ({
      id: payload.parentId ? "id-uber" : "id-transporte",
    }));
    createAccount.mockResolvedValue({ id: "id-nequi" });
    bulk.mockResolvedValue([{ id: "tx-1" }]);
  });

  it("crea primero lo nuevo y usa sus ids reales en lo que depende de ello", async () => {
    const results: ProposalItemResult[] = [];
    await executeSelectedItems(uberPlan(), (index, result) => (results[index] = result));

    expect(createCategory).toHaveBeenNthCalledWith(2, expect.objectContaining({ name: "Uber", parentId: "id-transporte" }));
    expect(bulk).toHaveBeenCalledWith([expect.objectContaining({ categoryId: "id-uber", account: "id-nequi", toAccount: null })]);
    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }, { ok: true }]);
  });

  it("si la cuenta nueva no se crea, el gasto que la usa no se envía", async () => {
    createAccount.mockRejectedValue({ message: "Ya tienes una cuenta con ese nombre", error: "Conflict", statusCode: 409 });
    const results: ProposalItemResult[] = [];
    await executeSelectedItems(uberPlan(), (index, result) => (results[index] = result));

    expect(results[2]).toEqual({ ok: false, error: "Ya tienes una cuenta con ese nombre" });
    expect(results[3]).toMatchObject({ ok: false, error: expect.stringContaining('"Nequi"') });
    expect(bulk).not.toHaveBeenCalled();
  });

  it("al modelo le cuenta cada ítem con su tipo", () => {
    const proposal = uberPlan();
    const summary = describeResultsForModel({ ...proposal, status: "done", results: proposal.items.map(() => ({ ok: true })) });
    expect(summary).toMatch(/- cuenta: Nequi/);
    expect(summary).toMatch(/- categoría: Transporte › Uber/);
  });
});
