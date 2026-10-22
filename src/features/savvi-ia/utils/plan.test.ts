import { describe, expect, it } from "vitest";
import type { PlanItem } from "../types/proposal.types";
import { toProposalData, toggleSelection } from "./plan";

const uberPlanItems: PlanItem[] = [
  {
    kind: "transactions",
    draft: {
      date: "2026-10-21",
      type: "egreso",
      amount: 35000,
      categoryId: "nueva:Transporte › Uber",
      categoryName: "Transporte › Uber",
      accountId: "nueva:Nequi",
      accountName: "Nequi",
    },
  },
  { kind: "accounts", draft: { ref: "nueva:Nequi", name: "Nequi", description: "" } },
  { kind: "categories", draft: { ref: "nueva:Transporte", name: "Transporte", type: "egreso" } },
  {
    kind: "categories",
    draft: {
      ref: "nueva:Transporte › Uber",
      name: "Uber",
      type: "egreso",
      parentId: "nueva:Transporte",
      parentName: "Transporte",
    },
  },
];

/** Orden de creación: Transporte, Uber, Nequi, gasto. */
const plan = toProposalData(uberPlanItems);
const all = [true, true, true, true];

describe("toProposalData", () => {
  it("de varios tipos arma un plan que crea primero lo que otros usan", () => {
    expect(plan.kind).toBe("plan");
    expect((plan.items as PlanItem[]).map((item) => item.kind)).toEqual(["categories", "categories", "accounts", "transactions"]);
  });

  it("de un solo tipo queda como propuesta simple", () => {
    expect(toProposalData(uberPlanItems.slice(2)).kind).toBe("categories");
  });
});

describe("toggleSelection", () => {
  it("desmarcar la cuenta nueva desmarca el gasto que la usa", () => {
    expect(toggleSelection(plan, all, 2)).toEqual([true, true, false, false]);
  });

  it("desmarcar un grupo nuevo desmarca sus subcategorías y lo que las usa", () => {
    expect(toggleSelection(plan, all, 0)).toEqual([false, false, true, false]);
  });

  it("marcar el gasto vuelve a marcar todo lo que necesita", () => {
    expect(toggleSelection(plan, [false, false, false, false], 3)).toEqual(all);
  });

  it("desmarcar el gasto no toca lo demás", () => {
    expect(toggleSelection(plan, all, 3)).toEqual([true, true, true, false]);
  });
});
