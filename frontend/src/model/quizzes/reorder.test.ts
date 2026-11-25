import { describe, expect, it } from "vitest";
import { canReorder, moveItem, sameOrder } from "./reorder";

describe("moveItem (HU-3.4)", () => {
  const ids = ["a", "b", "c", "d"];

  it("sube, baja y lleva a un puesto concreto", () => {
    expect(moveItem(ids, 2, 1)).toEqual(["a", "c", "b", "d"]);
    expect(moveItem(ids, 0, 1)).toEqual(["b", "a", "c", "d"]);
    expect(moveItem(ids, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(moveItem(ids, 0, 3)).toEqual(["b", "c", "d", "a"]);
  });

  it("es una permutación: no duplica ni pierde preguntas", () => {
    const moved = moveItem(ids, 1, 3);
    expect([...moved].sort()).toEqual([...ids].sort());
  });

  it("fuera de rango o a la misma posición deja el orden igual", () => {
    expect(moveItem(ids, 0, -1)).toEqual(ids);
    expect(moveItem(ids, 3, 4)).toEqual(ids);
    expect(moveItem(ids, 2, 2)).toEqual(ids);
  });

  it("no modifica la lista original", () => {
    moveItem(ids, 0, 3);
    expect(ids).toEqual(["a", "b", "c", "d"]);
  });
});

describe("sameOrder", () => {
  it("FA2: el mismo orden no se vuelve a guardar", () => {
    expect(sameOrder(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameOrder(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameOrder(["a"], ["a", "b"])).toBe(false);
  });
});

describe("canReorder", () => {
  it("FA1: con menos de dos preguntas no se ofrece", () => {
    expect(canReorder(0)).toBe(false);
    expect(canReorder(1)).toBe(false);
    expect(canReorder(2)).toBe(true);
  });
});
