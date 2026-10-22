import { describe, expect, it } from "vitest";
import { checkProposal, mergeChecks, onlyExisting, withProposed } from "./proposals";
import { planItems } from "@/features/savvi-ia/utils/plan";
import type { AdvisorCatalog } from "./snapshot";
import type { ChatAttachment, TransactionDraft } from "@/features/savvi-ia/types/proposal.types";

const catalog: AdvisorCatalog = {
  categories: [{ id: "cat-mercado", name: "Mercado", type: "egreso", parentId: null, isGroup: false }],
  accounts: [
    { id: "acc-debito", name: "Bancolombia Débito", isCredit: false, isActive: true },
    { id: "acc-nequi", name: "Nequi", isCredit: false, isActive: true },
  ],
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

describe("checkProposal – transferencias", () => {
  const transfer = (extra: Record<string, unknown>) =>
    row({ type: "transferencia", categoryId: null, toAccountId: "acc-nequi", description: "A Nequi", ...extra });

  it("entre dos cuentas propias, sin categoría", () => {
    const check = checkProposal("proponer_transacciones", { mensaje: "", transacciones: [transfer({})] }, catalog, [], "pasé 45900 a nequi");
    const item = check.proposal?.items[0] as TransactionDraft;
    expect(check.problems).toEqual([]);
    expect(item).toMatchObject({ type: "transferencia", accountId: "acc-debito", toAccountId: "acc-nequi", toAccountName: "Nequi" });
    expect(item.categoryId).toBeUndefined();
  });

  it("rechaza destino inexistente o igual al origen", () => {
    const check = checkProposal(
      "proponer_transacciones",
      { mensaje: "", transacciones: [transfer({ toAccountId: null }), transfer({ toAccountId: "acc-debito" })] },
      catalog,
      [],
      "",
    );
    expect(check.proposal).toBeNull();
    expect(check.problems).toHaveLength(2);
    expect(check.problems[1]).toMatch(/distinta/);
  });

  it("un gasto sigue necesitando categoría", () => {
    const check = checkProposal("proponer_transacciones", { mensaje: "", transacciones: [row({ categoryId: null })] }, catalog, [], "");
    expect(check.problems[0]).toMatch(/categoryId/);
  });
});


describe("checkProposal – lo que falta se crea en la misma tarjeta", () => {
  const transporte = [
    { name: "Uber", type: "egreso", grupo: "nueva:Transporte" },
    { name: "Transporte", type: "egreso", grupo: null },
  ];

  it("crea el grupo antes que sus subcategorías, aunque vengan en desorden", () => {
    const check = checkProposal("proponer_categorias", { mensaje: "", categorias: transporte }, catalog, []);
    expect(check.problems).toEqual([]);
    expect(check.proposal?.items).toMatchObject([
      { name: "Transporte", ref: "nueva:Transporte", parentId: undefined },
      { name: "Uber", ref: "nueva:Transporte › Uber", parentId: "nueva:Transporte", parentName: "Transporte" },
    ]);
  });

  it("acepta el grupo por su nombre aunque el modelo omita el prefijo", () => {
    const check = checkProposal(
      "proponer_categorias",
      { mensaje: "", categorias: [transporte[1], { ...transporte[0], grupo: "Transporte" }] },
      catalog,
      [],
    );
    expect(check.problems).toEqual([]);
    expect(check.proposal?.items[1]).toMatchObject({ name: "Uber", parentId: "nueva:Transporte" });
  });

  it("si nombra un grupo que no propuso, también lo crea, antes que sus subcategorías", () => {
    const check = checkProposal(
      "proponer_categorias",
      {
        mensaje: "",
        categorias: [
          { name: "Arriendo", type: "egreso", grupo: null },
          { name: "Uber", type: "egreso", grupo: "Transporte" },
          { name: "Gasolina", type: "egreso", grupo: "Transporte" },
        ],
      },
      catalog,
      [],
    );
    expect(check.problems).toEqual([]);
    expect(check.proposal?.items.map((c) => (c as { ref?: string }).ref)).toEqual([
      "nueva:Arriendo",
      "nueva:Transporte",
      "nueva:Transporte › Uber",
      "nueva:Transporte › Gasolina",
    ]);
  });

  it("si todo ya existía no es un error que corregir", () => {
    const check = checkProposal("proponer_cuentas", { mensaje: "", cuentas: [{ name: "nequi", description: "" }] }, catalog, []);
    expect(check.proposal).toBeNull();
    expect(onlyExisting(check)).toBe(true);
    const bad = checkProposal("proponer_cuentas", { mensaje: "", cuentas: [{ name: "", description: "" }] }, catalog, []);
    expect(onlyExisting(bad)).toBe(false);
  });

  it("un id de grupo inventado no crea nada", () => {
    const check = checkProposal(
      "proponer_categorias",
      { mensaje: "", categorias: [{ name: "Uber", type: "egreso", grupo: "9b2f4c1e-0d3a-4e5f-8a7b-1c2d3e4f5a6b" }] },
      catalog,
      [],
    );
    expect(check.proposal).toBeNull();
    expect(check.problems[0]).toMatch(/grupo no existe/);
  });

  it("una subcategoría de un grupo que ya existe usa su id y debe ser de su tipo", () => {
    const check = checkProposal(
      "proponer_categorias",
      {
        mensaje: "",
        categorias: [
          { name: "Plaza", type: "egreso", grupo: "cat-mercado" },
          { name: "Bonos", type: "ingreso", grupo: "cat-mercado" },
        ],
      },
      catalog,
      [],
    );
    expect(check.proposal?.items).toMatchObject([{ name: "Plaza", parentId: "cat-mercado", ref: "nueva:Mercado › Plaza" }]);
    expect(check.problems).toHaveLength(1);
    expect(check.problems[0]).toMatch(/egreso/);
  });

  it("une cuenta, categorías y gasto nuevos en un plan que crea primero lo que se usa", () => {
    const accounts = checkProposal("proponer_cuentas", { mensaje: "", cuentas: [{ name: "Daviplata", description: "" }] }, catalog, []);
    const categories = checkProposal(
      "proponer_categorias",
      { mensaje: "", categorias: transporte },
      withProposed(catalog, accounts.proposal),
      [],
    );
    const extended = withProposed(withProposed(catalog, accounts.proposal), categories.proposal);
    const expense = checkProposal(
      "proponer_transacciones",
      {
        mensaje: "Te registro el Uber",
        transacciones: [row({ amount: 35000, categoryId: "nueva:uber", accountId: "nueva:Daviplata" })],
      },
      extended,
      [],
      "gasté 35 mil en uber",
    );
    expect(expense.problems).toEqual([]);
    expect(expense.proposal?.items[0]).toMatchObject({
      categoryId: "nueva:Transporte › Uber",
      categoryName: "Transporte › Uber",
      accountId: "nueva:Daviplata",
    });

    const merged = mergeChecks(mergeChecks(expense, accounts), categories);
    expect(merged.proposal?.kind).toBe("plan");
    expect(planItems(merged.proposal!).map((item) => item.kind)).toEqual([
      "categories",
      "categories",
      "accounts",
      "transactions",
    ]);
    expect(merged.message).toBe("Te registro el Uber");
  });

  it('"nueva:<nombre>" de algo que ya existe usa lo que ya existe', () => {
    const check = checkProposal(
      "proponer_transacciones",
      { mensaje: "", transacciones: [row({ categoryId: "nueva:mercado", accountId: "nueva:Nequi" })] },
      catalog,
      [],
    );
    expect(check.proposal?.items[0]).toMatchObject({ categoryId: "cat-mercado", accountId: "acc-nequi" });
  });

  it("una cuenta nueva que no se propuso en la misma respuesta no existe", () => {
    const check = checkProposal(
      "proponer_transacciones",
      { mensaje: "", transacciones: [row({ accountId: "nueva:Daviplata" })] },
      catalog,
      [],
    );
    expect(check.proposal).toBeNull();
    expect(check.problems[0]).toMatch(/accountId no existe.*nueva:/);
  });
});
