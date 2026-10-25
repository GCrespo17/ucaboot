import { describe, expect, it } from "vitest";
import { answerStyle } from "../../src/domain/game/answerStyle.js";

describe("answerStyle", () => {
  it("asigna color y forma por índice de opción", () => {
    expect(answerStyle(0)).toEqual({ color: "red", shape: "triangle" });
    expect(answerStyle(1)).toEqual({ color: "blue", shape: "diamond" });
    expect(answerStyle(2)).toEqual({ color: "yellow", shape: "circle" });
    expect(answerStyle(3)).toEqual({ color: "green", shape: "square" });
  });

  it("falla con un índice fuera de rango", () => {
    expect(() => answerStyle(4)).toThrow(RangeError);
  });
});
