import { describe, expect, it } from "vitest";
import type { PlayerStats } from "../../src/domain/game/ranking.js";
import { rankPlayers } from "../../src/domain/game/ranking.js";

function stats(playerId: string, overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    playerId,
    nickname: playerId,
    joinOrder: Number(playerId.replace(/\D/g, "")) || 1,
    totalScore: 0,
    correctCount: 0,
    answeredCount: 0,
    avgResponseMs: null,
    ...overrides,
  };
}

const order = (players: PlayerStats[]) => rankPlayers(players).map((p) => p.playerId);

describe("rankPlayers", () => {
  it("ordena por puntaje descendente", () => {
    expect(order([stats("p1", { totalScore: 100 }), stats("p2", { totalScore: 300 })])).toEqual(["p2", "p1"]);
  });

  it("con el mismo puntaje, gana quien tiene más aciertos", () => {
    const result = order([
      stats("p1", { totalScore: 500, correctCount: 1 }),
      stats("p2", { totalScore: 500, correctCount: 2 }),
    ]);
    expect(result).toEqual(["p2", "p1"]);
  });

  it("luego gana el menor promedio de respuesta", () => {
    const result = order([
      stats("p1", { totalScore: 500, correctCount: 1, avgResponseMs: 4000 }),
      stats("p2", { totalScore: 500, correctCount: 1, avgResponseMs: 2000 }),
    ]);
    expect(result).toEqual(["p2", "p1"]);
  });

  it("un promedio null va detrás de cualquier número", () => {
    const result = order([
      stats("p1", { avgResponseMs: null }),
      stats("p2", { avgResponseMs: 29_000 }),
    ]);
    expect(result).toEqual(["p2", "p1"]);
  });

  it("luego ordena por joinOrder, sin separar el puesto", () => {
    const ranked = rankPlayers([
      stats("p2", { joinOrder: 2, avgResponseMs: 1000 }),
      stats("p1", { joinOrder: 1, avgResponseMs: 1000 }),
    ]);
    expect(ranked.map((p) => p.playerId)).toEqual(["p1", "p2"]);
    expect(ranked.map((p) => p.rank)).toEqual([1, 1]);
  });

  it("comparte puesto y salta el siguiente (1, 1, 3)", () => {
    const ranked = rankPlayers([
      stats("p1", { totalScore: 500 }),
      stats("p2", { totalScore: 500 }),
      stats("p3", { totalScore: 100 }),
    ]);
    expect(ranked.map((p) => p.rank)).toEqual([1, 1, 3]);
  });

  it("todos en cero comparten el puesto 1 (HU-7.3 FA2)", () => {
    const ranked = rankPlayers([stats("p1"), stats("p2"), stats("p3")]);
    expect(ranked.map((p) => p.rank)).toEqual([1, 1, 1]);
  });

  it("no muta la lista de entrada", () => {
    const input = [stats("p1", { totalScore: 1 }), stats("p2", { totalScore: 2 })];
    rankPlayers(input);
    expect(input.map((p) => p.playerId)).toEqual(["p1", "p2"]);
  });
});
