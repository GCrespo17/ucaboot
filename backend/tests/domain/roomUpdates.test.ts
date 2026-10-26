import { describe, expect, it } from "vitest";
import { withRound } from "../../src/domain/game/roomUpdates.js";
import { makeStartedRoom } from "./fixtures.js";

describe("withRound", () => {
  it("reemplaza solo la ronda indicada", () => {
    const room = makeStartedRoom(1);
    const original = room.rounds[0];
    if (!original) throw new Error("no round");
    const updated = withRound(room, { ...original, closedAt: 123 });
    expect(updated.rounds[0]?.closedAt).toBe(123);
    expect(updated.phase).toBe(room.phase);
    expect(updated.players).toBe(room.players);
  });

  it("no muta la sala de entrada", () => {
    const room = makeStartedRoom(1);
    const original = room.rounds[0];
    if (!original) throw new Error("no round");
    const snapshot = structuredClone(room);
    withRound(room, { ...original, closedAt: 123 });
    expect(room).toEqual(snapshot);
  });
});
